"""One-step smaller Tailwind headline classes app-wide.

Run from repo root: python scripts/shrink_headers.py

Note: Do not add naive `<h1 ... text-3xl` -> text-2xl replacement: it can match
`md:text-3xl` and corrupt responsive classes. Use (?<!:)\\btext-3xl\\b if needed.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "app"
EXTS = {".tsx", ".jsx", ".js"}

HERO_TOKEN = "__HERO_HEADLINE_CLASSES__"


def process(content: str) -> str:
    content = content.replace(
        "text-5xl md:text-7xl lg:text-8xl", HERO_TOKEN
    )

    content = content.replace("text-4xl md:text-5xl", "text-3xl md:text-4xl")
    content = content.replace("text-3xl md:text-4xl", "text-2xl md:text-3xl")

    content = re.sub(r"\btext-4xl\b", "text-3xl", content)

    content = content.replace(
        HERO_TOKEN, "text-4xl md:text-6xl lg:text-7xl"
    )

    # Only the leading fixed size on h1 (not md:/lg: breakpoints)
    content = re.sub(
        r'(<h1[^>]*className="[^"]*?)\btext-3xl\b(?! md:)',
        r"\1text-2xl",
        content,
    )
    content = re.sub(
        r"(<h1 className=\{`[^`]*?)\btext-3xl\b(?! md:)",
        r"\1text-2xl",
        content,
    )
    content = re.sub(
        r"(<h1 className=\{cn\(\s*['\"])text-3xl(?! md:)",
        r"\1text-2xl",
        content,
    )

    return content


def main() -> None:
    changed: list[str] = []
    for path in ROOT.rglob("*"):
        if path.suffix.lower() not in EXTS:
            continue
        raw = path.read_text(encoding="utf-8")
        new = process(raw)
        if new != raw:
            path.write_text(new, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT.parent)))

    print(f"files changed: {len(changed)}")
    for c in sorted(changed):
        print(c)


if __name__ == "__main__":
    main()
