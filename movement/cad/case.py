"""D-01 40 mm case blank (simple round case + lug stubs)."""

from __future__ import annotations

import cadquery as cq

from _common import load_params


def build() -> cq.Workplane:
    p = load_params()
    od = p["case"]["outer_diameter"]
    th = p["case"]["thickness"]
    lug_w = p["case"]["lug_width"]
    crystal = p["case"]["crystal_inner"]
    mov = p["movement"]["diameter"]

    case = cq.Workplane("XY").circle(od / 2).extrude(th)
    # Movement cavity
    case = case.cut(
        cq.Workplane("XY")
        .transformed(offset=(0, 0, 1.5))
        .circle(mov / 2 + 0.15)
        .extrude(th)
    )
    # Crystal rebate
    case = case.cut(
        cq.Workplane("XY")
        .transformed(offset=(0, 0, th - 1.0))
        .circle(crystal / 2)
        .extrude(1.1)
    )
    # Lug stubs (12 and 6)
    for y_sign in (1, -1):
        case = case.union(
            cq.Workplane("XY")
            .transformed(offset=(0, y_sign * (od / 2 + 2.0), th / 2))
            .box(lug_w, 6.0, 3.0)
        )
    # Crown tube hole at 3 o'clock
    case = case.cut(
        cq.Workplane("YZ")
        .transformed(offset=(od / 2 - 1.0, 0, th / 2))
        .circle(0.7)
        .extrude(-6.0)
    )
    return case
