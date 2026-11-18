"""Positioned assembly for interference preview."""

from __future__ import annotations

import cadquery as cq

import barrel
import bridges
import mainplate
import wheels
from _common import load_params


def build() -> cq.Workplane:
    p = load_params()
    a = p["arbors"]
    t_plate = p["movement"]["mainplate_thickness"]

    asm = mainplate.build()

    # Wheels floating above plate (simplified Z stack)
    w = wheels.build_wheels(use_teeth=False)
    z_wheel = t_plate + 0.4

    def place(solid: cq.Workplane, name: str, z: float) -> cq.Workplane:
        return solid.translate((a[name]["x"], a[name]["y"], z))

    asm = asm.union(place(w["center_wheel"], "center", z_wheel))
    asm = asm.union(place(w["third_wheel"], "third", z_wheel + 0.2))
    asm = asm.union(place(w["fourth_wheel"], "fourth", z_wheel))
    asm = asm.union(place(w["ccw_idler"], "ccw_idler", z_wheel + 0.35))

    b = barrel.build_all()
    asm = asm.union(place(b["barrel"], "barrel", z_wheel))

    br = bridges.build_all()
    z_br = t_plate + 1.6
    asm = asm.union(br["barrel_bridge"].translate((0, 0, z_br)))
    asm = asm.union(br["train_bridge"].translate((0, 0, z_br)))
    asm = asm.union(
        br["balance_cock"].translate((0, 0, z_br + 0.3))
    )

    return asm
