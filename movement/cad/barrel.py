"""D-01 barrel drum and arbor."""

from __future__ import annotations

import cadquery as cq

from _common import blank_diameter, load_params
from gears import spur_gear


def barrel_drum() -> cq.Workplane:
    p = load_params()
    m = p["gear"]["module"]
    z = p["teeth"]["barrel"]
    th = p["wheel_thickness"]["barrel_drum"]
    bore = p["jewels"]["barrel"]["bore"]
    # Outer teeth + inner well for mainspring
    drum = spur_gear(m, z, th, bore=0.0, pressure_angle_deg=p["gear"]["pressure_angle_deg"])
    inner_r = blank_diameter(m, z) / 2 - 1.2
    drum = drum.cut(
        cq.Workplane("XY").circle(max(inner_r, bore)).extrude(th - 0.25)
    )
    drum = drum.faces(">Z").workplane().hole(bore)
    return drum


def barrel_arbor() -> cq.Workplane:
    p = load_params()
    pivot = p["jewels"]["barrel"]["pivot"]
    # Simple stepped arbor
    arbor = cq.Workplane("XY").circle(pivot / 2).extrude(4.0)
    arbor = arbor.union(
        cq.Workplane("XY").transformed(offset=(0, 0, 1.5)).circle(1.1).extrude(0.4)
    )
    return arbor


def build_all() -> dict[str, cq.Workplane]:
    return {
        "barrel": barrel_drum(),
        "barrel_arbor": barrel_arbor(),
    }
