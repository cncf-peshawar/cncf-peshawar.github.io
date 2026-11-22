# Parity Tools

CLI tools for extracting structured HTML snapshots and verifying DOM parity across redesign iterations.

## parity.mjs — snapshot extractor
Extracts a normalized, deterministic JSON snapshot of all routes from built HTML (`dist/`), excluding `/admin/`.

```bash
node docs/redesign/tools/parity.mjs dist/ --out docs/redesign/baseline/baseline.json
```

Or write to stdout:
```bash
node docs/redesign/tools/parity.mjs dist/ > snapshot.json
```

## parity-diff.mjs — diff tool
Compares two snapshots route-by-route and reports additions, removals, and modifications per category.

```bash
node docs/redesign/tools/parity-diff.mjs docs/redesign/baseline/baseline.json <current.json>
```

### Exit Codes
- `0`: Zero failures (clean match or permitted warnings only)
- `1`: One or more hard parity failures detected
- `2`: Route set mismatch (missing or unexpected routes)

## Categories
1. **ANCHORS**: Added or removed anchor `href`s (FAIL unless approved)
2. **IDS**: Added or removed DOM IDs (FAIL if in `CONTRACT.md` §5 frozen hooks, WARNING otherwise)
3. **DATA_ATTRS**: Added, removed, or modified `data-*` attributes excluding Astro compiler scoping hashes (FAIL)
4. **ARIA_ATTRS**: Added, removed, or modified `aria-*` attributes (FAIL)
5. **META**: Modified meta content (FAIL, except `theme-color` and `og:image` per §9)
6. **TITLE**: Modified `<title>` text (FAIL)
7. **FORMS**: Added, removed, or modified form fields and options (FAIL)
8. **HEADINGS_TEXT**: Modified heading text content (FAIL)
9. **HEADINGS_LEVEL**: Changed heading level for existing text, e.g. h2→h3 (WARNING)
10. **IMAGES**: Modified `src` or `alt` text on `<img>` tags (FAIL)
11. **SCRIPTS**: Added or removed external `<script src>` tags (WARNING — new motion scripts expected)
12. **LINKS**: Added or removed `<link>` stylesheets or icons (WARNING — redesign tokens expected)
