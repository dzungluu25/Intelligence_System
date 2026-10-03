"""Builds the LaTeX tables of the report from notebook/results/*.json and *_comparison.csv (run after the notebooks)."""
import json
from pathlib import Path
import pandas as pd

HERE = Path(__file__).parent
RES = HERE.parent / "notebook" / "results"
ORDER = ["SC-RNN", "TF-RNN", "PT-RNN", "TF-LSTM", "PT-LSTM", "TF-GRU", "PT-GRU"]


def run(rid): return r"\run{" + rid + "}"
def esc(s): return s.replace("_", r"\_").replace("%", r"\%")
def thousands(x): return f"{int(x):,}".replace(",", "{,}")


def load(code):
    cmp_ = pd.read_csv(RES / f"{code}_comparison.csv", index_col=0)
    base = cmp_[cmp_.index.str.startswith("baseline")]
    runs = {k: json.loads((RES / f"{code}-{k}.json").read_text()) for k in ORDER}
    return base, runs


def table(code, cols, header, fmt):
    base, runs = load(code)
    lines = [r"\begin{tabular}{l" + "r" * len(cols) + "}", r"\toprule", "Run & " + " & ".join(header) + r" \\", r"\midrule"]
    for name, row in base.iterrows():
        vals = [fmt[c](row[c]) if c in row and pd.notna(row[c]) else "--" for c in cols]
        lines.append(r"\textit{" + esc(name.replace("baseline: ", "")) + "} & " + " & ".join(vals) + r" \\")
    lines.append(r"\midrule")
    for k in ORDER:
        r = runs[k]
        flat = {**r["test"], "params": r["params"], "epochs": f"{r['epochs_run']} ({r['best_epoch']})",
                "s_per_epoch": r["time_per_epoch_s"], "infer": r["infer_ms_per_1k"]}
        lines.append(run(f"{code}-{k}") + " & " + " & ".join(fmt[c](flat[c]) for c in cols) + r" \\")
    lines += [r"\bottomrule", r"\end{tabular}"]
    return "\n".join(lines)


f1 = lambda x: f"{x:.1f}"; f2 = lambda x: f"{x:.2f}"; f3 = lambda x: f"{x:.3f}"; pct = lambda x: f"{100 * x:.1f}"
common = dict(params=thousands, epochs=str, s_per_epoch=f1, infer=f2)
ec = table("EC", ["rmse_days", "mae_days", "hit3", "r2_oos", "params", "epochs", "s_per_epoch", "infer"],
           ["RMSE (d)", "MAE (d)", r"$\pm$3 d (\%)", r"$R^2$", "params", "epochs (best)", "s/epoch", "ms/1k"],
           dict(rmse_days=f3, mae_days=f3, hit3=pct, r2_oos=f3, **common))
st = table("ST", ["rmse_pct", "mae_pct", "r2_oos", "dir_acc", "params", "epochs", "s_per_epoch", "infer"],
           ["RMSE (pp)", "MAE (pp)", r"$R^2$", r"dir.\ (\%)", "params", "epochs (best)", "s/epoch", "ms/1k"],
           dict(rmse_pct=lambda x: f"{x:.4f}", mae_pct=lambda x: f"{x:.4f}", r2_oos=f3, dir_acc=pct, **common))
(HERE / "table_ec.tex").write_text(ec, encoding="utf-8")
(HERE / "table_st.tex").write_text(st, encoding="utf-8")

# compact 14-row summary: main metric per run
rows = []
for code, key in (("EC", "rmse_days"), ("ST", "rmse_pct")):
    _, runs = load(code)
    for k in ORDER:
        r = runs[k]
        rows.append((f"{code}-{k}", r["test"][key], r["test"]["r2_oos"], r["params"], r["time_per_epoch_s"]))
lines = [r"\begin{tabular}{lrrrr}", r"\toprule", r"Run & test RMSE & $R^2$ & params & s/epoch \\", r"\midrule"]
for i, (rid, a, b, p, t) in enumerate(rows):
    if i == len(ORDER): lines.append(r"\midrule")
    fa = f"{a:.3f} d" if rid.startswith("EC") else f"{a:.4f} pp"
    lines.append(run(rid) + f" & {fa} & {b:.3f} & {thousands(p)} & {t:.1f}" + r" \\")
lines += [r"\bottomrule", r"\end{tabular}"]
(HERE / "table_summary.tex").write_text("\n".join(lines), encoding="utf-8")
print("tables written")
