#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from bs4 import BeautifulSoup


ROOT = Path("/Users/daibang/Projects/oz-timber-floor")
RANGES_DIR = ROOT / "ranges"
DATA_PATH = ROOT / "data/product-catalogue.json"


def clean_slug(value: str | None) -> str:
    value = (value or "").strip().strip("/")
    if value.startswith("ranges/"):
        value = value.split("/", 1)[1]
    return value


def asset_exists(src: str | None) -> bool:
    if not src or "coming-soon" in src or not src.startswith("/assets/"):
        return False
    return (ROOT / src.lstrip("/")).exists()


def product_map(products: list[dict]) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for product in products:
        for key in {
            clean_slug(product.get("parentRange")),
            clean_slug(product.get("rangeSlug")),
            clean_slug(product.get("range")),
        }:
            if key:
                grouped.setdefault(key, []).append(product)
    return grouped


def best_image(range_record: dict, grouped_products: dict[str, list[dict]]) -> str:
    slug = clean_slug(range_record.get("slug") or range_record.get("url"))
    candidates = [
        range_record.get("primaryImage"),
        range_record.get("thumbnailImage"),
        range_record.get("heroImage"),
    ]
    for product in grouped_products.get(slug, []):
        candidates.extend(
            [
                product.get("primaryImage"),
                product.get("image"),
                product.get("thumbnailImage"),
            ]
        )
    for candidate in candidates:
        if asset_exists(candidate):
            return candidate
    return ""


def build_missing(soup: BeautifulSoup, range_name: str):
    wrapper = soup.new_tag(
        "div",
        attrs={
            "class": "missing-image-state",
            "role": "img",
            "aria-label": f"{range_name} colour image to confirm",
        },
    )
    span = soup.new_tag("span")
    span.string = "Image to confirm"
    small = soup.new_tag("small")
    small.string = "Ask for current sample"
    wrapper.append(span)
    wrapper.append(small)
    return wrapper


def build_img(soup: BeautifulSoup, src: str, range_name: str, category: str):
    return soup.new_tag(
        "img",
        attrs={
            "class": "category-thumb",
            "src": src,
            "alt": f"{range_name} {category.lower()} colour swatch",
            "loading": "lazy",
            "decoding": "async",
        },
    )


def main():
    data = json.loads(DATA_PATH.read_text())
    grouped_products = product_map(data["products"])
    ranges = {
        clean_slug(item.get("slug") or item.get("url")): item
        for item in data["ranges"]
        if clean_slug(item.get("slug") or item.get("url"))
    }

    changed_files = 0
    changed_cards = 0
    missing_images: list[tuple[str, str]] = []

    for html_path in sorted(RANGES_DIR.glob("*/index.html")):
        soup = BeautifulSoup(html_path.read_text(), "html.parser")
        dirty = False
        for heading in soup.find_all("h2"):
            if heading.get_text(" ", strip=True) != "Compare nearby options":
                continue
            section = heading.find_parent("section")
            if not section:
                continue
            for card in section.select("a.range-summary-card[href^='/ranges/']"):
                href = card.get("href", "")
                slug = clean_slug(href)
                range_record = ranges.get(slug)
                if not range_record:
                    continue
                image_src = best_image(range_record, grouped_products)
                name = range_record.get("name") or card.find("h3").get_text(" ", strip=True)
                category = range_record.get("category") or "Flooring range"

                current_thumb = card.select_one(".category-thumb")
                current_state = card.select_one(".missing-image-state")
                expected_node = (
                    build_img(soup, image_src, name, category)
                    if image_src
                    else build_missing(soup, name)
                )

                if image_src:
                    if not current_thumb or current_thumb.get("src") != image_src:
                        if current_thumb:
                            current_thumb.decompose()
                        if current_state:
                            current_state.decompose()
                        overline = card.select_one(".catalogue-overline")
                        if overline:
                            overline.insert_before(expected_node)
                        else:
                            card.insert(0, expected_node)
                        dirty = True
                        changed_cards += 1
                else:
                    missing_images.append((html_path.parent.name, slug))
                    if current_thumb:
                        current_thumb.decompose()
                        if current_state:
                            current_state.decompose()
                        overline = card.select_one(".catalogue-overline")
                        if overline:
                            overline.insert_before(expected_node)
                        else:
                            card.insert(0, expected_node)
                        dirty = True
                        changed_cards += 1
                    elif not current_state:
                        overline = card.select_one(".catalogue-overline")
                        if overline:
                            overline.insert_before(expected_node)
                        else:
                            card.insert(0, expected_node)
                        dirty = True
                        changed_cards += 1

        if dirty:
            html_path.write_text(str(soup))
            changed_files += 1

    print(json.dumps({
        "changed_files": changed_files,
        "changed_cards": changed_cards,
        "missing_images": missing_images,
    }, indent=2))


if __name__ == "__main__":
    main()
