# D-01 Assembly & Regulation

## Tools

Loupe 10×, screwdriver set, hand press, pegwood, rodico, oilers, timegrapher, case press.

## Oil chart (typical)

| Location | Lubricant |
|----------|-----------|
| Balance pivots (shock) | Moebius 9010 |
| Escape / pallet pivots | 9010 |
| Train pivots (3rd, 4th, center) | 9010 light film |
| Barrel wall / arbor | HP 1300 / grease |
| Mainspring | Graphite or spring grease sparingly |
| Escape tooth impulse faces | 9415 (epilame first if used) |
| Cannon / hour friction | Trace grease |

## Assembly order

1. Jewels into mainplate and bridges (pegwood clean).  
2. Barrel + mainspring + arbor + ratchet + click.  
3. Center wheel / pinion; third; fourth (seconds).  
4. **CCW idler + cannon drive**; verify cannon rotates **opposite** center when barrel is powered by finger.  
5. Escape pinion / wheel and pallet from kit; check lock and drop.  
6. Balance complete; check endshake; wind slightly — listen for clean tick.  
7. Motion work: cannon, minute wheel, hour wheel, date.  
8. Dial + feet; date alignment in window.  
9. Hands: minute at CCW “12”; hour stacked; seconds last. Confirm 1 h set moves hour toward numeral **1** via **CCW** arc ([script.js](../script.js) behavior).  
10. Case up; crystal; crown stem; gasket check.

## CCW hand-set card (for wearer)

> Crown pulled: turning the crown **clockwise** moves the hands **counterclockwise** on the dial. Numerals increase in the CCW direction.

## Regulation targets

| Metric | Target |
|--------|--------|
| Rate (dial up) | 0 to +10 s/day preferred |
| All positions average | ±20 s/day |
| Beat error | ≤ 0.5 ms |
| Amplitude horizontal | ≥ 270° |
| Amplitude vertical | ≥ 220° |

Wear 7 days; adjust regulator; re-check.

## Failures to watch

- Hands CW → idler missing or even gear count in reverse stage  
- Seconds CW while hours CCW → enable seconds idler in params and remake pipe  
- Low amplitude → over-oil, tight pivots, weak spring, escape depth  
- Stop at full wind → bind in train or date interference  
