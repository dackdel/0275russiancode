# Dackdel Caliber D-01 — Product Spec

Custom manual-wind mechanical wristwatch movement derived from the Dackdel glass clock UI (`script.js` / `style.css`).

## Product

| Item | Value |
|------|-------|
| Name | Dackdel Caliber D-01 |
| Case OD | 40.00 mm |
| Case thickness (target) | 11.5 mm (excl. crystal dome) |
| Lug width | 20.00 mm |
| Lug-to-lug (target) | 47 mm |
| Crystal | Flat sapphire, double AR |
| Caseback | Exhibition sapphire |
| Water resistance | 5 ATM |
| Crown | Signed, 3-position (wind / hand-set); stem at 3 o’clock |

## Dial (from UI proportions)

Reference dial diameter **32.50 mm** (fits ~40 mm case with chapter ring / flange).

`1 cqi` = 1% of dial diameter = **0.325 mm**.

| Feature | UI | mm |
|---------|-----|-----|
| Dial Ø | 100 cqi | 32.50 |
| Numeral radius | 41.4% | 13.46 |
| Minute marker length | 2.86 cqi | 0.93 |
| Minute marker width | 0.29 cqi | 0.09 |
| Hour numeral height | ~4.57 cqi | 1.49 |
| Logo “dackdel” | under 12, 2.86 cqi | 0.93 letter height |
| Date window | ~6 o’clock | 2.5 × 1.4 aperture |
| City / timezone | printed text only | no GMT disc (v1) |

**Numeral layout:** counterclockwise reading order matching `buildDialMarks` — clockwise around the dial the labels are `12, 11, 10, …, 1`. Hands run **CCW**.

## Hands

| Hand | Length from center | Width | Color |
|------|-------------------|-------|-------|
| Hour | 8.82 mm (27.14 cqi) | 0.93 mm | black / dark |
| Minute | 13.00 mm (40 cqi) | 0.65 mm | black / dark |
| Seconds (tip) | 13.93 mm (42.86 cqi) | 0.19 mm | `#F36505` |
| Seconds counterweight | 1.30 mm (4 cqi) | 0.56 mm | `#F36505` |
| Seconds tip disc Ø | 0.74 mm (2.29 cqi) | — | `#F36505` |
| Center pipe / cap Ø | 1.11 mm (3.43 cqi) | — | `#F36505` |

## Movement envelope

| Item | Value |
|------|-------|
| Movement Ø | 26.00 mm (11½′′′ class) |
| Movement height (excl. hands) | ≤ 5.8 mm |
| Beat rate | **36,000 vph** (5 Hz / 10 impulses·s⁻¹) — matches UI `highFreq` |
| Escapement | Purchased Swiss lever + balance complete |
| Winding | Manual (automatic rotor deferred) |
| Power reserve goal | ≥ 40 h |
| Hand motion | Counterclockwise via CCW idler into cannon pinion |
| Complications v1 | Central seconds, date-at-6 |

## Files

| File | Role |
|------|------|
| [dial.svg](dial.svg) | True-scale dial artwork |
| [hands.svg](hands.svg) | True-scale hand set |
| [gear-train.md](gear-train.md) | Tooth counts, module, ratios |
| [plates.md](plates.md) | Plate stack, jewels, stem |
| [BOM.md](BOM.md) | Buy vs make |
| [FABRICATION.md](FABRICATION.md) | Shop handoff |
| [ASSEMBLY.md](ASSEMBLY.md) | Build & regulate |
| [cad/](cad/) | CadQuery source + exports |

## Success criteria

- Wearable 40 mm watch on custom D-01 train
- CCW hands + CCW dial numerals match UI behavior
- Central seconds at high-beat impulse rate
- Exhibition caseback shows finished bridges
