#!/usr/bin/env python3
"""Build a WooCommerce-ready product CSV from products-catalog.json.

Prices are left blank on purpose. After exporting from Shopify, merge Regular price
(and Sale price if any) into this file before importing into WooCommerce.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data" / "products-catalog.json"
OUT = ROOT / "data" / "products-woocommerce.csv"

HEADERS = [
    "Type",
    "SKU",
    "Name",
    "Published",
    "Is featured?",
    "Visibility in catalog",
    "Short description",
    "Description",
    "Tax status",
    "Tax class",
    "In stock?",
    "Stock",
    "Backorders allowed?",
    "Sold individually?",
    "Allow customer reviews?",
    "Regular price",
    "Categories",
    "Tags",
    "Images",
    "Parent",
    "Position",
    "Attribute 1 name",
    "Attribute 1 value(s)",
    "Attribute 1 visible",
    "Attribute 1 global",
    "Attribute 2 name",
    "Attribute 2 value(s)",
    "Attribute 2 visible",
    "Attribute 2 global",
    "Meta: _purity",
    "Meta: _research_use_only",
]


def sku_slug(value: str) -> str:
    return (
        value.lower()
        .replace("+", "plus")
        .replace(" ", "-")
        .replace("/", "-")
        .replace("(", "")
        .replace(")", "")
    )


def main() -> None:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    disclaimer = data["disclaimer"]
    rows: list[dict[str, str]] = []

    for product in data["products"]:
        parent_sku = f"PBP-{product['slug'].upper()}"
        sizes = product["sizes"]
        forms = product["forms"]
        short = f"{product['subtitle']} · {product['purity']} purity"
        description = (
            f"<p>{product['description']}</p>"
            f"<p><strong>Research Use Only:</strong> {disclaimer}</p>"
        )

        rows.append(
            {
                "Type": "variable",
                "SKU": parent_sku,
                "Name": product["name"],
                "Published": "1",
                "Is featured?": "0",
                "Visibility in catalog": "visible",
                "Short description": short,
                "Description": description,
                "Tax status": "taxable",
                "Tax class": "",
                "In stock?": "1",
                "Stock": "",
                "Backorders allowed?": "0",
                "Sold individually?": "0",
                "Allow customer reviews?": "0",
                "Regular price": "",
                "Categories": product["category"],
                "Tags": f"research,{product['slug']}",
                "Images": "",
                "Parent": "",
                "Position": "0",
                "Attribute 1 name": "Size",
                "Attribute 1 value(s)": ", ".join(sizes),
                "Attribute 1 visible": "1",
                "Attribute 1 global": "1",
                "Attribute 2 name": "Form",
                "Attribute 2 value(s)": ", ".join(forms),
                "Attribute 2 visible": "1",
                "Attribute 2 global": "1",
                "Meta: _purity": product["purity"],
                "Meta: _research_use_only": "yes",
            }
        )

        position = 1
        for size in sizes:
            for form in forms:
                variation_sku = f"{parent_sku}-{sku_slug(size)}-{sku_slug(form)}"
                rows.append(
                    {
                        "Type": "variation",
                        "SKU": variation_sku,
                        "Name": f"{product['name']} - {size}, {form}",
                        "Published": "1",
                        "Is featured?": "0",
                        "Visibility in catalog": "visible",
                        "Short description": "",
                        "Description": "",
                        "Tax status": "taxable",
                        "Tax class": "parent",
                        "In stock?": "1",
                        "Stock": "",
                        "Backorders allowed?": "0",
                        "Sold individually?": "0",
                        "Allow customer reviews?": "0",
                        "Regular price": "",
                        "Categories": "",
                        "Tags": "",
                        "Images": "",
                        "Parent": parent_sku,
                        "Position": str(position),
                        "Attribute 1 name": "Size",
                        "Attribute 1 value(s)": size,
                        "Attribute 1 visible": "1",
                        "Attribute 1 global": "1",
                        "Attribute 2 name": "Form",
                        "Attribute 2 value(s)": form,
                        "Attribute 2 visible": "1",
                        "Attribute 2 global": "1",
                        "Meta: _purity": product["purity"],
                        "Meta: _research_use_only": "yes",
                    }
                )
                position += 1

    with OUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)

    parents = sum(1 for row in rows if row["Type"] == "variable")
    variations = sum(1 for row in rows if row["Type"] == "variation")
    print(f"Wrote {OUT}")
    print(f"Parents: {parents} | Variations: {variations} | Total rows: {len(rows)}")
    print("WARNING: Regular price is blank. Merge Shopify prices before import.")


if __name__ == "__main__":
    main()
