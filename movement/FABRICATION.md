# D-01 Fabrication Handoff

Shop package for CNC / gear cutting. Geometry source: `movement/cad/` CadQuery exports.

## Export command

```bash
cd movement/cad
python -m pip install -r requirements.txt
python export.py
```

Outputs land in `movement/cad/exports/`.

## STEP / STL list

| File | Part | Material | Qty |
|------|------|----------|-----|
| `mainplate.step` | Mainplate | Nickel silver CuNi18Zn20 or Ms58 | 1 |
| `barrel_bridge.step` | Barrel bridge | Same | 1 |
| `train_bridge.step` | Train bridge | Same | 1 |
| `balance_cock.step` | Balance cock blank | Same | 1 |
| `barrel.step` | Barrel drum + cover | Brass Ms58 | 1 |
| `barrel_arbor.step` | Barrel arbor | Silver steel | 1 |
| `center_wheel.step` | Center wheel | Brass | 1 |
| `third_wheel.step` | Third wheel | Brass | 1 |
| `fourth_wheel.step` | Fourth wheel | Brass | 1 |
| `ccw_idler.step` | CCW idler | Brass | 1 |
| `cannon_drive.step` | Cannon drive wheel | Brass | 1 |
| `case_blank.step` | 40 mm case blank | 316L | 1 |
| `*_scale3.stl` | 3× printables | PLA/POM | optional |

Also supply [dial.svg](dial.svg) and [hands.svg](hands.svg) to dial/hand makers (SVG mm units).

## Tolerances

| Feature | Tolerance |
|---------|-----------|
| Plate outer Ø | ±0.02 mm |
| Jewel seat bore | H7 (ream after soft bore) |
| Arbor pivot journals | −0.005 / −0.012 mm vs jewel ID |
| Gear center distance | ±0.01 mm |
| Wheel thickness | ±0.02 mm |
| Endshake (assembled) | 0.02–0.04 mm |
| Sideshake | visible free, not sloppy |

## Finishing

- Plates: perlage underside optional; bridges côtes de Genève optional  
- Edges: chamfer 0.1 mm  
- Screw holes: M1.0 or M1.2 as in STEP; blue screws preferred  
- Deburr all gear teeth; inspect for burrs under 10×  

## Do not machine

- Escape wheel, pallet fork, balance complete, shock settings — **purchased** ([BOM.md](BOM.md))  
- Balance cock final jewel seat — fit to kit after receipt  

## Inspection checklist before assembly

- [ ] All center distances match [gear-train.md](gear-train.md)  
- [ ] Stem tunnel aligns with case tube  
- [ ] Dial feet engage without rocking  
- [ ] Barrel spins freely on arbor with click fitted  
- [ ] 3× STL mesh test shows CCW cannon drive if printed  
