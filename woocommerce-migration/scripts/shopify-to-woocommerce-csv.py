#!/usr/bin/env python3
"""Convert a Shopify products export CSV into a WooCommerce product import CSV."""

from __future__ import annotations

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

SHOPIFY_DEFAULT = Path("/home/ubuntu/.cursor/projects/workspace/uploads/products_export_3d7b.csv")
OUT_DEFAULT = Path(__file__).resolve().parents[1] / "data" / "products-from-shopify-woocommerce.csv"

WC_HEADERS = [
    "Type",
    "SKU",
    "Name",
    "Published",
    "Is featured?",
    "Visibility in catalog",
    "Short description",
    "Description",
    "Tax status",
    "In stock?",
    "Stock",
    "Backorders allowed?",
    "Sold individually?",
    "Weight (kg)",
    "Allow customer reviews?",
    "Regular price",
    "Sale price",
    "Categories",
    "Tags",
    "Images",
    "Position",
    "Meta: _shopify_handle",
    "Meta: _research_use_only",
]


def clean_html_one_line(text: str) -> str:
    return " ".join((text or "").split())


def sku_from_handle(handle: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", handle).strip("-").upper()
    return f"PBV-{slug}"


def published_flag(status: str) -> str:
    return "1" if (status or "").strip().lower() == "active" else "0"


def category_from_row(row: dict) -> str:
    product_type = (row.get("Type") or "").strip()
    if product_type:
        return product_type
    return "Uncategorized"


def convert(shopify_path: Path, out_path: Path) -> None:
    with shopify_path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    by_handle: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        handle = (row.get("Handle") or "").strip()
        if handle:
            by_handle[handle].append(row)

    out_rows: list[dict] = []
    for handle, group in by_handle.items():
        main = next((r for r in group if (r.get("Title") or "").strip()), group[0])
        title = (main.get("Title") or handle).strip()
        body = clean_html_one_line(main.get("Body (HTML)") or "")
        price = ""
        compare = ""
        grams = ""
        for r in group:
            if (r.get("Variant Price") or "").strip():
                price = r["Variant Price"].strip()
                compare = (r.get("Variant Compare At Price") or "").strip()
                grams = (r.get("Variant Grams") or "").strip()
                break

        images: list[str] = []
        for r in group:
            src = (r.get("Image Src") or "").strip()
            if src and src not in images:
                images.append(src)
            vimg = (r.get("Variant Image") or "").strip()
            if vimg and vimg not in images:
                images.append(vimg)

        tags = (main.get("Tags") or "").replace(", ", ",")
        weight_kg = ""
        if grams:
            try:
                weight_kg = f"{float(grams) / 1000:.3f}".rstrip("0").rstrip(".")
            except ValueError:
                weight_kg = ""

        sku = (main.get("Variant SKU") or "").strip() or sku_from_handle(handle)
        short = ""
        if (main.get("Option1 Name") or "").strip() and (main.get("Option1 Value") or "").strip():
            if main["Option1 Name"] != "Title" and main["Option1 Value"] != "Default Title":
                short = f"{main['Option1 Name']}: {main['Option1 Value']}"

        out_rows.append(
            {
                "Type": "simple",
                "SKU": sku,
                "Name": title,
                "Published": published_flag(main.get("Status") or ""),
                "Is featured?": "0",
                "Visibility in catalog": "visible",
                "Short description": short,
                "Description": body,
                "Tax status": "taxable",
                "In stock?": "1",
                "Stock": "",
                "Backorders allowed?": "0",
                "Sold individually?": "0",
                "Weight (kg)": weight_kg,
                "Allow customer reviews?": "0",
                "Regular price": price,
                "Sale price": compare if compare and price and float(compare or 0) > float(price or 0) else "",
                "Categories": category_from_row(main),
                "Tags": tags,
                "Images": ", ".join(images),
                "Position": "0",
                "Meta: _shopify_handle": handle,
                "Meta: _research_use_only": "yes",
            }
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=WC_HEADERS)
        writer.writeheader()
        writer.writerows(out_rows)

    published = sum(1 for r in out_rows if r["Published"] == "1")
    print(f"Wrote {out_path}")
    print(f"Products: {len(out_rows)} | Published(active): {published} | Draft(suspended/archived): {len(out_rows) - published}")


if __name__ == "__main__":
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else SHOPIFY_DEFAULT
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else OUT_DEFAULT
    convert(src, dest)
