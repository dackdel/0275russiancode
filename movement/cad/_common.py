"""Shared helpers for D-01 CadQuery models."""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent
PARAMS_PATH = ROOT / "parameters.yaml"
EXPORT_DIR = ROOT / "exports"


def load_params(path: Path = PARAMS_PATH) -> dict[str, Any]:
    with path.open() as f:
        return yaml.safe_load(f)


def pitch_diameter(module: float, teeth: int) -> float:
    return module * teeth


def blank_diameter(module: float, teeth: int) -> float:
    # Addendum ≈ 1 module
    return module * (teeth + 2)


def center_distance(module: float, z1: int, z2: int) -> float:
    return module * (z1 + z2) / 2.0


def verify_center_distances(p: dict[str, Any]) -> list[str]:
    """Return human-readable warnings if arbor spacing ≠ gear theory."""
    m = p["gear"]["module"]
    t = p["teeth"]
    a = p["arbors"]
    warnings: list[str] = []

    def dist(name_a: str, name_b: str) -> float:
        ax, ay = a[name_a]["x"], a[name_a]["y"]
        bx, by = a[name_b]["x"], a[name_b]["y"]
        return math.hypot(ax - bx, ay - by)

    checks = [
        ("barrel", "center", t["barrel"], t["center_pinion"]),
        ("center", "third", t["center_wheel"], t["third_pinion"]),
        ("third", "fourth", t["third_wheel"], t["fourth_pinion"]),
        ("fourth", "escape", t["fourth_wheel"], t["escape_pinion"]),
        ("center", "ccw_idler", t["reverse_on_center"], t["ccw_idler"]),
    ]
    for n1, n2, z1, z2 in checks:
        theoretical = center_distance(m, z1, z2)
        actual = dist(n1, n2)
        err = abs(theoretical - actual)
        if err > 0.05:
            warnings.append(
                f"{n1}–{n2}: layout {actual:.3f} mm vs theory {theoretical:.3f} mm "
                f"(Δ {err:.3f})"
            )
    return warnings
