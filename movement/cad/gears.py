"""Involute spur gear (approx) and plate primitives for D-01."""

from __future__ import annotations

import math

import cadquery as cq

from _common import blank_diameter, pitch_diameter


def spur_gear(
    module: float,
    teeth: int,
    thickness: float,
    bore: float,
    pressure_angle_deg: float = 20.0,
) -> cq.Workplane:
    """
    Build a spur gear solid.

    Tooth outline is a simplified trapezoid on the pitch circle — suitable for
    blank preview / soft prototype. Production teeth should be hobbed or cut
    from the blank OD to true involute.
    """
    pd = pitch_diameter(module, teeth)
    od = blank_diameter(module, teeth)
    root_r = (pd - 2.5 * module) / 2.0
    outer_r = od / 2.0
    pitch_r = pd / 2.0
    pa = math.radians(pressure_angle_deg)

    # Angular tooth width at pitch ≈ π / teeth * 0.5 (half tooth)
    tooth_angle = math.pi / teeth
    tip_half = tooth_angle * 0.35
    root_half = tooth_angle * 0.55

    def polar(r: float, a: float) -> tuple[float, float]:
        return (r * math.cos(a), r * math.sin(a))

    wp = cq.Workplane("XY")
    # Start with root cylinder
    gear = wp.circle(root_r).extrude(thickness)

    # Add teeth as lofted wedges
    tooth_solids = []
    for i in range(teeth):
        a0 = i * 2 * math.pi / teeth
        pts = [
            polar(root_r, a0 - root_half),
            polar(pitch_r, a0 - tip_half - 0.15 * pa),
            polar(outer_r, a0 - tip_half * 0.6),
            polar(outer_r, a0 + tip_half * 0.6),
            polar(pitch_r, a0 + tip_half + 0.15 * pa),
            polar(root_r, a0 + root_half),
        ]
        tooth = (
            cq.Workplane("XY")
            .polyline(pts + [pts[0]])
            .close()
            .extrude(thickness)
        )
        tooth_solids.append(tooth)

    for tooth in tooth_solids:
        gear = gear.union(tooth)

    if bore > 0:
        gear = gear.faces(">Z").workplane().hole(bore)

    return gear


def disc_blank(od: float, thickness: float, bore: float) -> cq.Workplane:
    wp = cq.Workplane("XY").circle(od / 2.0).extrude(thickness)
    if bore > 0:
        wp = wp.faces(">Z").workplane().hole(bore)
    return wp


def plate_circle(diameter: float, thickness: float) -> cq.Workplane:
    return cq.Workplane("XY").circle(diameter / 2.0).extrude(thickness)
