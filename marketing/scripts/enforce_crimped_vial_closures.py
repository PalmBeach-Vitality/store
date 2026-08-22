#!/usr/bin/env python3
"""DEPRECATED — vial look is now PB Vitality blue flip-cap packaging.

Run: python3 marketing/scripts/enforce_pbvita_vial_packaging.py
"""

from __future__ import annotations

import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(
        str(Path(__file__).with_name("enforce_pbvita_vial_packaging.py")),
        run_name="__main__",
    )
