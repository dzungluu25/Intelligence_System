"""Cross-dataset summary for the report, read from the executed notebooks.

Takes the section-6 results table printed in each notebook (the DataFrame built from
results/<run_id>.json), and writes:
    report/summary.csv           all runs, all metrics
    report/summary_table.tex     12-run LaTeX table (booktabs) for the report
    report/images/summary_f1.png     macro F1 per run, grouped by dataset
    report/images/summary_time.png   training time per epoch per run

    python report/make_summary.py
"""
import json
import re
from io import StringIO
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
NOTEBOOKS = {"SV": "sv_svhn.ipynb", "GT": "gt_gtsrb.ipynb", "DB": "db_diabetes.ipynb"}
NAMES = {"SV": "SVHN", "GT": "GTSRB", "DB": "Diabetes"}


def results_from_notebook(file):
    """Parse the printed results table (`comparison.round(4)`) of one notebook."""
    cells = json.loads((ROOT / "notebook" / file).read_text(encoding="utf-8"))["cells"]
    for cell in cells:
        if cell["cell_type"] == "code" and "results_table(records)" in "".join(cell["source"]):
            for out in cell.get("outputs", []):
                text = "".join(out.get("data", {}).get("text/plain", []))
                if "run_id" in text:
                    return parse_wrapped_frame(text)
    raise ValueError(f"no results table in {file}")


def parse_wrapped_frame(text):
    """pandas prints wide tables in column blocks separated by blank lines; join them back."""
    blocks = [b for b in re.split(r"\n\s*\n", text.strip()) if b.strip()]
    frames = []
    for block in blocks:
        lines = [l.rstrip(" \\") for l in block.splitlines()]
        header, rows = lines[0].split(), [l for l in lines[2:] if l.strip()]
        body = pd.read_csv(StringIO("\n".join(rows)), sep=r"\s+", header=None)
        body.columns = ["run_id"] + header
        frames.append(body.set_index("run_id"))
    return pd.concat(frames, axis=1)


def main():
    df = pd.concat([results_from_notebook(f).assign(dataset=ds) for ds, f in NOTEBOOKS.items()])
    df.to_csv(ROOT / "report" / "summary.csv")

    cnn = df[df.model.isin(["CNN-3", "CNN-5"])]
    rows = []
    for rid, r in cnn.iterrows():
        rows.append(f"{rid} & {NAMES[r.dataset]} & {r.framework} & {r.model} & {int(r.params):,} & {int(r.epochs)} & "
                    f"{r.accuracy:.4f} & {r.f1_macro:.4f} & {r.time_per_epoch_s:.1f} \\\\")
    table = "\n".join([
        r"\begin{tabular}{llllrrrrr}", r"\toprule",
        r"Run ID & Dataset & Fw. & Model & Params & Epochs & Accuracy & Macro F1 & s/epoch \\", r"\midrule",
        *[row + ("\n\\midrule" if i in (3, 7) else "") for i, row in enumerate(rows)],
        r"\bottomrule", r"\end{tabular}", ""])
    (ROOT / "report" / "summary_table.tex").write_text(table, encoding="utf-8")

    images = ROOT / "report" / "images"
    images.mkdir(exist_ok=True)
    for metric, ylabel, name in [("f1_macro", "test macro F1", "summary_f1"),
                                 ("time_per_epoch_s", "seconds per epoch", "summary_time")]:
        fig, ax = plt.subplots(figsize=(8, 3.8))
        x = np.arange(len(NOTEBOOKS))
        for k, (fw, m) in enumerate([("TF", "CNN-3"), ("TF", "CNN-5"), ("PT", "CNN-3"), ("PT", "CNN-5")]):
            vals = [cnn[(cnn.dataset == ds) & (cnn.framework == fw) & (cnn.model == m)][metric].iloc[0] for ds in NOTEBOOKS]
            ax.bar(x + (k - 1.5) * 0.2, vals, 0.2, label=f"{fw} {m}", hatch="//" if fw == "PT" else None,
                   color=["tab:blue", "tab:orange"][m == "CNN-5"], edgecolor="white")
        ax.set_xticks(x, [NAMES[d] for d in NOTEBOOKS])
        ax.set_ylabel(ylabel); ax.grid(axis="y", alpha=0.3); ax.legend(fontsize=8, ncol=4)
        if metric == "f1_macro":
            ax.set_ylim(0.5, 1.1)
        ax.set_title(f"All 12 runs: {ylabel}")
        fig.tight_layout(); fig.savefig(images / f"{name}.png", dpi=150); plt.close(fig)

    print(df[["dataset", "framework", "model", "accuracy", "f1_macro", "time_per_epoch_s"]].to_string())


if __name__ == "__main__":
    main()
