#!/usr/bin/env python3
"""Export D-01 STEP/STL artifacts into exports/."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import cadquery as cq
from OCP.BRepBuilderAPI import BRepBuilderAPI_Transform
from OCP.gp import gp_Pnt, gp_Trsf

import assembly
import barrel
import bridges
import case
import mainplate
import wheels
from _common import EXPORT_DIR, load_params, verify_center_distances
from gears import blank_diameter, disc_blank


def _scale_workplane(solid: cq.Workplane, scale: float) -> cq.Workplane:
    if scale == 1.0:
        return solid
    trsf = gp_Trsf()
    trsf.SetScale(gp_Pnt(0, 0, 0), scale)
    shape = BRepBuilderAPI_Transform(solid.val().wrapped, trsf, True).Shape()
    return cq.Workplane(cq.Shape.cast(shape))


def export_solid(
    solid: cq.Workplane,
    name: str,
    formats: list[str],
    scale: float = 1.0,
) -> None:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    shape = _scale_workplane(solid, scale)
    suffix = f"_scale{int(scale)}" if scale != 1.0 else ""
    for fmt in formats:
        path = EXPORT_DIR / f"{name}{suffix}.{fmt}"
        try:
            cq.exporters.export(shape, str(path))
            print(f"wrote {path}")
        except Exception as exc:
            print(f"fail {path}: {exc}")


def main() -> int:
    p = load_params()
    warnings = verify_center_distances(p)
    if warnings:
        print("Center-distance checks:")
        for w in warnings:
            print(f"  WARN {w}")
    else:
        print("Center-distance checks: OK")

    formats = p["export"]["formats"]
    scale = float(p["export"]["scale_prototype"])

    # Disc blanks for reliable first export (hob true teeth in production).
    use_teeth = False

    parts: dict = {}
    parts["mainplate"] = mainplate.build()
    parts.update(bridges.build_all())
    parts.update(wheels.build_wheels(use_teeth=use_teeth))

    m = p["gear"]["module"]
    z = p["teeth"]["barrel"]
    th = p["wheel_thickness"]["barrel_drum"]
    bore = p["jewels"]["barrel"]["bore"]
    parts["barrel"] = disc_blank(blank_diameter(m, z), th, bore)
    parts["barrel_arbor"] = barrel.barrel_arbor()
    parts["case_blank"] = case.build()
    parts["assembly"] = assembly.build()

    for name, solid in parts.items():
        export_solid(solid, name, formats, scale=1.0)
        if scale != 1.0 and name != "assembly":
            export_solid(solid, name, ["stl"], scale=scale)

    print(f"Done. Exports in {EXPORT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
