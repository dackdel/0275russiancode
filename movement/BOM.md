# D-01 Bill of Materials

## Purchased (do not fabricate in v1)

| Part | Spec / notes | Qty | Source guidance |
|------|--------------|-----|-----------------|
| Balance complete | 36,000 vph, timed, with hairspring + stud | 1 | High-beat donor salvage (e.g. Zenith-type / Chinese 36k clones) or assortment supplier; measure staff Ø before final plate ream |
| Escape wheel | Swiss lever, **20 teeth**, matches balance kit | 1 | Same kit as balance |
| Pallet fork | Swiss lever, impulse jewels set | 1 | Same kit |
| Shock springs + settings | Incabloc / equivalent for balance | 1 set | Match balance staff |
| Mainspring | Barrel ID ~Ø 9–10 mm, strength for ~40 h+ | 1 | GR / Bestfit / barrel-specific after barrel CAD freeze |
| Jewels | Hole + cap per [plates.md](plates.md) | ~17–21 | Watch-jewel supplier; bore to parameters.yaml |
| Date disc | 31-day, fits 2.5×1.4 window | 1 | Standard 26 mm movement date |
| Crown | Ø 5–6 mm, signed “dackdel” optional | 1 | Custom CNC or generic + pad print |
| Crystal | Sapphire Ø for 40 mm case, AR | 1 | Case maker |
| Caseback crystal | Exhibition sapphire | 1 | Case maker |
| Gaskets | Case, crown, crystals | 1 set | Match case |
| Spring bars | 20 mm | 2 | Standard |
| Oils / greases | Moebius 9010, 9415, HP 1300 (or equiv.) | — | See ASSEMBLY.md |

### Escapement sourcing notes

1. Prefer a **complete 36k regulating organ** (balance + cock jewels + escape + pallet) from one donor so depthing is known.  
2. Photograph and caliper: staff Ø, escape pinion leaf count (expect **6**), pallet staff Ø, balance Ø.  
3. Enter measured values into `cad/parameters.yaml` under `escapement:` before CNC.  
4. If only 28,800 vph kits are available, either accept 28.8k and update SPEC, or keep 36k search — do not mix incompatible escape/balance pairs.

## Fabricated (from this repo)

| Part | CAD / drawing | Material |
|------|---------------|----------|
| Mainplate | `cad/mainplate.py` → STEP | Nickel silver or Ms58 brass |
| Barrel bridge | `cad/bridges.py` | Same |
| Train bridge | `cad/bridges.py` | Same |
| Balance cock blank | `cad/bridges.py` | Same (final fit to kit) |
| Barrel drum + cover | `cad/barrel.py` | Brass |
| Barrel arbor + ratchet | `cad/barrel.py` | Steel |
| Center / third / fourth wheels | `cad/wheels.py` | Brass |
| Pinions (center, third, fourth) | `cad/wheels.py` or purchase cut | Steel |
| CCW idler + cannon drive | `cad/wheels.py` | Brass |
| Cannon pinion / hour wheel | `cad/wheels.py` | Brass / steel |
| Dial | [dial.svg](dial.svg) | Brass plate + print / enamel |
| Hands | [hands.svg](hands.svg) | Steel / brass + orange coat |
| Case + lugs | `cad/case.py` (blank) | 316L or Ti |
| Stem / winding parts | drawings in FABRICATION | Steel |

## Consumables

- Threadlocker (low strength) for case screws  
- Dial feet adhesive or friction  
- Hand-fitting tools, pegwood, rodico  
