# D-01 CAD (CadQuery)

Parametric source for the Dackdel custom movement. Dimensions live in [`parameters.yaml`](parameters.yaml).

## Setup

```bash
cd movement/cad
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python export.py
```

Exports → [`exports/`](exports/) (STEP + STL). `*_scale3.stl` is a 3× soft prototype.

## Modules

| File | Output |
|------|--------|
| `mainplate.py` | Mainplate with jewel bores, stem slot, date pocket |
| `bridges.py` | Barrel bridge, train bridge, balance cock blank |
| `wheels.py` | Center/third/fourth, CCW idler, cannon drive, pinion blanks |
| `barrel.py` | Barrel drum + arbor |
| `case.py` | 40 mm case blank |
| `assembly.py` | Stacked preview |
| `gears.py` | Simplified tooth generator (preview; hob production teeth) |

## After buying the escapement

1. Caliper staff / jewel sizes.  
2. Edit `escapement:` and `jewels:` in `parameters.yaml`.  
3. Re-run `python export.py`.  
4. Send STEP set + [`../FABRICATION.md`](../FABRICATION.md) to the shop.
