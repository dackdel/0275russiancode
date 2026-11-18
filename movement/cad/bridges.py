"""D-01 bridges and balance cock blank."""

from __future__ import annotations

import cadquery as cq

from _common import load_params


def _bridge_over(points: list[tuple[float, float]], width: float, thickness: float) -> cq.Workplane:
    """Simple stadium / capsule bridge covering the given arbor points."""
    if len(points) == 1:
        x, y = points[0]
        return (
            cq.Workplane("XY")
            .transformed(offset=(x, y, 0))
            .circle(width / 2)
            .extrude(thickness)
        )

    # Convex hull approximation: extrude a polyline slot
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    min_x, max_x = min(xs) - width / 2, max(xs) + width / 2
    min_y, max_y = min(ys) - width / 2, max(ys) + width / 2
    return (
        cq.Workplane("XY")
        .rect(max_x - min_x, max_y - min_y)
        .extrude(thickness)
        .translate(((min_x + max_x) / 2, (min_y + max_y) / 2, 0))
    )


def barrel_bridge() -> cq.Workplane:
    p = load_params()
    t = p["movement"]["bridge_thickness"]
    a = p["arbors"]
    bore = p["jewels"]["barrel"]["bore"]
    body = _bridge_over([(a["barrel"]["x"], a["barrel"]["y"])], width=8.0, thickness=t)
    # widen toward center slightly
    body = body.union(
        cq.Workplane("XY")
        .transformed(offset=((a["barrel"]["x"] + a["center"]["x"]) / 2, 0, 0))
        .box(6.0, 5.0, t)
    )
    body = body.cut(
        cq.Workplane("XY")
        .transformed(offset=(a["barrel"]["x"], a["barrel"]["y"], 0))
        .circle(bore / 2)
        .extrude(t + 0.1)
    )
    return body


def train_bridge() -> cq.Workplane:
    p = load_params()
    t = p["movement"]["bridge_thickness"]
    a = p["arbors"]
    pts = [
        (a["third"]["x"], a["third"]["y"]),
        (a["fourth"]["x"], a["fourth"]["y"]),
        (a["escape"]["x"], a["escape"]["y"]),
    ]
    body = _bridge_over(pts, width=5.5, thickness=t)
    for name in ("third", "fourth", "escape"):
        bore = p["jewels"][name]["bore"]
        body = body.cut(
            cq.Workplane("XY")
            .transformed(offset=(a[name]["x"], a[name]["y"], 0))
            .circle(bore / 2)
            .extrude(t + 0.1)
        )
    return body


def balance_cock() -> cq.Workplane:
    p = load_params()
    t = p["movement"]["balance_cock_thickness"]
    a = p["arbors"]
    x, y = a["balance"]["x"], a["balance"]["y"]
    body = (
        cq.Workplane("XY")
        .transformed(offset=(x, y, 0))
        .circle(3.2)
        .extrude(t)
    )
    # arm toward plate edge
    body = body.union(
        cq.Workplane("XY")
        .transformed(offset=(x + 2.5, y - 2.0, 0))
        .box(5.0, 2.2, t)
    )
    # shock jewel seat placeholder (ream to kit)
    body = body.cut(
        cq.Workplane("XY")
        .transformed(offset=(x, y, 0))
        .circle(0.8)
        .extrude(t + 0.1)
    )
    return body


def build_all() -> dict[str, cq.Workplane]:
    return {
        "barrel_bridge": barrel_bridge(),
        "train_bridge": train_bridge(),
        "balance_cock": balance_cock(),
    }
