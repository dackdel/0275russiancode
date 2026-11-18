# D-01 Gear Train

Module base **m = 0.10 mm** (going train). Involute, 20° pressure angle.

Pitch diameter \(d = m \cdot Z\). Center distance \(a = m \cdot (Z_1 + Z_2) / 2\).

## Going train (barrel → escape)

| Stage | Driver | Driven | Z_driver | Z_driven | Ratio | a (mm) |
|-------|--------|--------|----------|----------|-------|--------|
| 1 | Barrel | Center pinion | 80 | 10 | 8.000 | 4.50 |
| 2 | Center wheel | Third pinion | 75 | 10 | 7.500 | 4.25 |
| 3 | Third wheel | Fourth pinion | 64 | 8 | 8.000 | 3.60 |
| 4 | Fourth wheel | Escape pinion | 90 | 6 | 15.000 | 4.80 |

**Fourth wheel** carries the **central seconds** hand (1 rev / 60 s).

### Beat-rate check (36,000 vph)

- Escape wheel **Zₑ = 20** (purchased Swiss lever assortment)
- Impulses per escape revolution = \(2 \times 20 = 40\)
- Required escape speed = \(36000 / 40 = 900\) rev/h = **15 rev/min**
- Fourth = 1 rev/min → required fourth∶escape = **15** → matches stage 4

### Power reserve (estimate)

- Useful barrel turns ≈ 6.5
- Center revolutions ≈ \(6.5 \times 8 = 52\)
- Center = 1 rev/h → **~52 h** theoretical (goal ≥ 40 h after losses)

## Motion work (CCW hands)

Center arbor runs in the **normal** going-train direction. Hands are reversed once:

| Stage | Driver | Driven | Z | Notes |
|-------|--------|--------|---|-------|
| R1 | Reverse wheel (on center arbor) | CCW idler | 40 / 40 | Direction flip |
| R2 | CCW idler | Cannon drive wheel | 40 / 40 | Cannon spins **opposite** center |
| M1 | Cannon pinion | Minute wheel | 12 / 36 | Standard motion |
| M2 | Minute pinion | Hour wheel | 10 / 40 | Combined **12∶1** hour |

Hour and minute both follow cannon → **CCW**. Seconds stay on fourth arbor; if fourth rotation sense does not match the dial’s CCW seconds, add a 1∶1 idler on the seconds pipe (document as optional `seconds_idler: true` in CAD params).

**Default CAD assumption:** going-train fourth direction is accepted; dial numerals are laid out for CCW hour/minute. Seconds idler enabled if bench test shows CW seconds.

## Wheel blank sizes (OD ≈ pitch + 2m)

| Part | Z | Pitch Ø (mm) | Blank Ø approx (mm) | Material |
|------|---|--------------|---------------------|----------|
| Barrel wall teeth | 80 | 8.00 | 8.20 | Brass |
| Center pinion | 10 | 1.00 | — | Steel |
| Center wheel | 75 | 7.50 | 7.70 | Brass |
| Third pinion | 10 | 1.00 | — | Steel |
| Third wheel | 64 | 6.40 | 6.60 | Brass |
| Fourth pinion | 8 | 0.80 | — | Steel |
| Fourth wheel | 90 | 9.00 | 9.20 | Brass |
| Escape pinion | 6 | 0.60 | — | Steel (w/ assortment) |
| Escape wheel | 20 | — | — | **Purchased** |
| CCW idler | 40 | 4.00 | 4.20 | Brass |
| Cannon drive | 40 | 4.00 | 4.20 | Brass |

## Layout sketch (mainplate, mm from movement center)

Locked in [`cad/parameters.yaml`](cad/parameters.yaml) to match center distances above (±0.01 mm):

| Arbor | X | Y |
|-------|---|---|
| Center / cannon | 0.00 | 0.00 |
| Barrel | 4.50 | 0.00 |
| Third | −2.125 | 3.681 |
| Fourth (seconds) | −5.243 | 1.881 |
| Escape | −8.920 | −1.205 |
| Balance (staff) | −8.20 | −6.50 |
| CCW idler | 3.064 | −2.571 |
| Stem / winding | 11.5 | 0.00 (to crown) |

Refine balance XY after the purchased escapement envelope is measured.

## Manufacturing notes

- Pinions: cut or purchased steel, hardened and tempered; pivot Ø per jewel bore in [plates.md](plates.md)
- Wheels: brass, crossed-out optional for exhibition
- Depthing: aim 0.55–0.60 of addendum engagement; adjust via eccentric bushings only if needed
- Do **not** cut escape wheel or pallet stones in-house for v1
