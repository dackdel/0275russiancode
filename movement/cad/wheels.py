"""D-01 train wheels and CCW idler (preview toothform)."""

from __future__ import annotations

import cadquery as cq

from _common import load_params
from gears import blank_diameter, disc_blank, spur_gear


def build_wheels(use_teeth: bool = True) -> dict[str, cq.Workplane]:
    p = load_params()
    m = p["gear"]["module"]
    pa = p["gear"]["pressure_angle_deg"]
    teeth = p["teeth"]
    th = p["wheel_thickness"]
    j = p["jewels"]

    def gear_or_blank(z: int, thickness: float, bore: float) -> cq.Workplane:
        if use_teeth and z <= 100:
            try:
                return spur_gear(m, z, thickness, bore, pa)
            except Exception:
                od = blank_diameter(m, z)
                return disc_blank(od, thickness, bore)
        od = blank_diameter(m, z)
        return disc_blank(od, thickness, bore)

    return {
        "center_wheel": gear_or_blank(teeth["center_wheel"], th["center"], j["center"]["bore"]),
        "third_wheel": gear_or_blank(teeth["third_wheel"], th["third"], j["third"]["bore"]),
        "fourth_wheel": gear_or_blank(teeth["fourth_wheel"], th["fourth"], j["fourth"]["bore"]),
        "ccw_idler": gear_or_blank(teeth["ccw_idler"], th["idler"], j["center"]["bore"] * 0.8),
        "cannon_drive": gear_or_blank(teeth["cannon_drive"], th["idler"], j["center"]["pivot"]),
        # Blanks for pinions (steel — often purchased cut)
        "center_pinion_blank": disc_blank(blank_diameter(m, teeth["center_pinion"]), 1.2, 0.0),
        "third_pinion_blank": disc_blank(blank_diameter(m, teeth["third_pinion"]), 1.0, 0.0),
        "fourth_pinion_blank": disc_blank(blank_diameter(m, teeth["fourth_pinion"]), 0.9, 0.0),
    }
