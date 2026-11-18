# D-01 Plates & Bridges

Movement diameter **26.00 mm**, height budget **≤ 5.8 mm** excluding hands.

## Stack (dial side → caseback)

| Layer | Thickness (mm) | Notes |
|-------|----------------|-------|
| Dial | 0.40 | Feet into mainplate |
| Mainplate | 1.60 | Train recesses, stem tunnel, dial feet |
| Train space | 1.40 | Wheel clearance |
| Train bridge / barrel bridge | 1.20 | Combined or split (exhibition) |
| Balance cock | 0.80 | Shock setting upper |
| Clearance to crystal | — | Hands + 0.3 mm |

Total metal ≈ 5.0 mm + dial/hands under crystal.

## Mainplate

- Outline: Ø 26.00 mm circle; optional flats for case seat
- Dial feet: 3× at r = 11.5 mm, angles 90° / 210° / 330°
- Date aperture cutout under dial 6 o’clock: 2.6 × 1.5 mm through to date disc pocket
- Stem tunnel: Ø 1.20 mm reamed, height to match keyless works (crown at 3 o’clock)
- Setting lever / yoke recesses: machine after keyless layout freeze

## Jewel map (synthetic ruby)

Pivot diameters are **placeholders** until the purchased balance/escapement kit is measured — update `cad/parameters.yaml`.

| # | Location | Jewel type | Bore Ø (mm) | Pivot Ø (mm) |
|---|----------|------------|-------------|--------------|
| 1–2 | Barrel arbor | Hole | 0.80 | 0.70 |
| 3–4 | Center | Hole | 0.50 | 0.40 |
| 5–6 | Third | Hole | 0.40 | 0.30 |
| 7–8 | Fourth | Hole | 0.40 | 0.30 |
| 9–10 | Escape | Hole / cap | 0.35 | 0.25 |
| 11–12 | Balance | Shock (Incabloc-type) | kit | kit |
| 13 | Pallet staff | Hole | 0.30 | 0.20 |
| — | Cannon / motion | Bushing OK | — | — |

**Jewel count target:** 17–21 depending on shock caps and intermediate bushes.

## Bridges (exhibition)

1. **Barrel bridge** — covers barrel + ratchet; côtes de Genève optional  
2. **Train bridge** — third + fourth  
3. **Escape / pallet bridge** — or shared with train  
4. **Balance cock** — separate for regulation access  

Minimum bridge thickness 0.90 mm at jewel seats.

## Stem & keyless (manual wind)

| Item | Spec |
|------|------|
| Stem thread | Compatible with Ø 5–6 mm signed crown |
| Positions | 0 = wind, 1 = hand-set |
| Hand-set | Pull crown; rotate — **CCW dial**: clockwise crown turn advances hands **CCW** on dial (document on caseback card) |
| Click | Spring + ratchet on barrel arbor |

## Escapement keep-out

Reserve a rectangular/circular pocket on the mainplate for the purchased escape wheel, pallet fork, and balance:

- Balance staff at approx (−8.2, −7.6) mm  
- Clear Ø 9.5 mm for balance wheel swing  
- Do not CAD the lever geometry — bolt jewel positions to the kit drawing once sourced  

## CadQuery mapping

| Spec entity | Script |
|-------------|--------|
| Mainplate outline + bores | `cad/mainplate.py` |
| Bridges | `cad/bridges.py` |
| Jewel XY | `cad/parameters.yaml` → `jewels:` |
