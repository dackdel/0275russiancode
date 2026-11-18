"""D-01 mainplate."""

from __future__ import annotations

import math

import cadquery as cq

from _common import load_params
from gears import plate_circle


def build() -> cq.Workplane:
    p = load_params()
    d = p["movement"]["diameter"]
    t = p["movement"]["mainplate_thickness"]
    jewels = p["jewels"]
    arbors = p["arbors"]
    esc = p["escapement"]

    plate = plate_circle(d, t)

    bore_map = [
        ("center", jewels["center"]["bore"]),
        ("third", jewels["third"]["bore"]),
        ("fourth", jewels["fourth"]["bore"]),
        ("escape", jewels["escape"]["bore"]),
        ("barrel", jewels["barrel"]["bore"]),
        ("ccw_idler", jewels["center"]["bore"] * 0.8),
    ]

    for name, bore in bore_map:
        x, y = arbors[name]["x"], arbors[name]["y"]
        plate = plate.cut(
            cq.Workplane("XY")
            .transformed(offset=(x, y, -0.05))
            .circle(bore / 2)
            .extrude(t + 0.1)
        )

    # Stem tunnel toward 3 o'clock
    sx, sy = arbors["stem"]["x"], arbors["stem"]["y"]
    plate = plate.cut(
        cq.Workplane("XY")
        .transformed(offset=(sx - 1.0, sy, t / 2))
        .box(4.0, 1.2, t + 0.1)
    )

    # Balance keep-out shallow pocket
    bx, by = arbors["balance"]["x"], arbors["balance"]["y"]
    kr = esc["keepout_radius"]
    plate = plate.cut(
        cq.Workplane("XY")
        .transformed(offset=(bx, by, t - 0.3))
        .circle(kr)
        .extrude(0.35)
    )

    # Dial feet sockets
    foot_r = 11.5
    for ang_deg in (90, 210, 330):
        ang = math.radians(ang_deg)
        fx, fy = foot_r * math.cos(ang), foot_r * math.sin(ang)
        if math.hypot(fx, fy) < d / 2 - 0.5:
            plate = plate.cut(
                cq.Workplane("XY")
                .transformed(offset=(fx, fy, t - 0.5))
                .circle(0.45)
                .extrude(0.55)
            )

    # Date window pocket near 6 o'clock
    plate = plate.cut(
        cq.Workplane("XY")
        .transformed(offset=(0.0, -9.5, t - 0.4))
        .box(2.8, 1.6, 0.5)
    )

    return plate
