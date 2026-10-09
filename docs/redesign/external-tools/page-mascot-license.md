# License & Feasibility Audit: `page-mascot` (Koboyo Penguin Assets)

Task ID: `T-1.4-MASCOT`  
Phase: 1 — Home Hero Mascot (Penguin)  
Date: 2026-10-09  
Auditor Role: `ASSETS-UI`  

---

## 1. Package & Upstream Metadata

- **Package Name:** `page-mascot`
- **Latest Version:** `0.1.0`
- **NPM Registry URL:** `https://registry.npmjs.org/page-mascot`
- **Declared NPM License:** `MIT`
- **Repository:** `https://github.com/nilbuild/page-mascot`
- **Author:** Kamran Ahmed (`https://kamran.fyi`, creator of `roadmap.sh`)
- **Demo / Documentation:** `https://koboyo.com/page-mascot`

---

## 2. Upstream License Inspection

The upstream GitHub repository and NPM package tarball include a standard MIT license:

```
MIT License

Copyright (c) 2026 Kamran Ahmed <https://kamran.fyi>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The repository stores all 52 mascot sprite sheets directly in the public repository tree under `public/mascots/` (including `penguin-directions.webp` and `penguin-reactions.webp`), and the official README explicitly instructs users:
> "Pick a character on the demo page (https://koboyo.com/page-mascot) and download its two sheets into `public/mascots`, then point the component at them... License: MIT © Kamran Ahmed"

---

## 3. Four Core Licensing Criteria

1. **May the two `.webp` sheets be redistributed in a public OSS repo?**  
   **YES.** The assets are hosted in the public git repository and covered by the top-level MIT license without any proprietary or non-commercial restrictions.
2. **Is attribution required and where?**  
   **YES.** Standard MIT copyright notice is required. Satisfied in `docs/redesign/external-tools/page-mascot-license.md`, `docs/redesign/COMPONENT_LOG.md`, and in the header of `src/components/ui/Mascot.astro`.
3. **Is commercial use permitted?**  
   **YES.** The MIT license explicitly grants permission to deal in the Software without restriction, including rights to use, copy, modify, merge, publish, distribute, sublicense, and sell copies.
4. **Free or paid?**  
   **100% Free** ("free of charge").

---

## 4. Final Verdict

### **VERDICT: SHIP**
The license is fully permissive MIT. Redistribution of `penguin-directions.webp` and `penguin-reactions.webp` in `public/mascots/` complies with all legal and architectural invariants.
