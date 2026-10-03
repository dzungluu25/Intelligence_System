"""Save every figure embedded in the executed notebooks to report/images/<name>.png.

The name is the one the notebook itself uses in savefig (run ID or dataset code + plot),
so the report can reference figures without re-running training.

    python report/extract_figures.py
"""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "report" / "images"
NOTEBOOKS = {"SV": "sv_svhn.ipynb", "GT": "gt_gtsrb.ipynb", "DB": "db_diabetes.ipynb"}


def names_for(src, ds):
    """Figure names produced by one code cell, in the order they are shown."""
    names = []
    for fw, m in re.findall(r'run_(tf|pt)\("([\w-]+)"', src):
        names += [f"{ds}-{fw.upper()}-{m}_curves", f"{ds}-{fw.upper()}-{m}_confusion"]
    for fw in re.findall(r"show_feature_maps\((tf|pt)_maps", src):
        for m in ("CNN-3", "CNN-5"):
            names += [f"{ds}-{fw.upper()}-{m}_filters", f"{ds}-{fw.upper()}-{m}_feature_maps"]
    for fw in re.findall(r'show_misclassified\((tf|pt)_preds\["CNN-5"\]', src):
        names.append(f"{ds}-{fw.upper()}-CNN-5_misclassified")
    for fw in re.findall(r'plot_threshold_curves\(\w+, "(TF|PT)"\)', src):
        names += [f"{ds}-{fw}_roc_pr", f"{ds}-{fw}-CNN-5_probabilities"]
    if names:
        return names
    return [f"{ds}_{n}" for n in re.findall(r'savefig\(fig, f"\{DATASET\}_(\w+)"\)', src)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for ds, file in NOTEBOOKS.items():
        cells = json.loads((ROOT / "notebook" / file).read_text(encoding="utf-8"))["cells"]
        saved = 0
        for i, cell in enumerate(cells):
            if cell["cell_type"] != "code":
                continue
            images = [o["data"]["image/png"] for o in cell.get("outputs", []) if "image/png" in o.get("data", {})]
            if not images:
                continue
            names = names_for("".join(cell["source"]), ds)
            if len(names) != len(images):
                names = [f"{ds}_cell{i:02d}_{k}" for k in range(len(images))]
                print(f"  {file} cell {i}: name mismatch, saved as {names[0]}...")
            for name, data in zip(names, images):
                (OUT / f"{name}.png").write_bytes(base64.b64decode("".join(data)))
                saved += 1
        print(f"{file}: {saved} figures -> {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
