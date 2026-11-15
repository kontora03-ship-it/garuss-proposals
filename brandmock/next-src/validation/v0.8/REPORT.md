# BrandMock LAB 0.8 validation

- TypeScript/Vite production build: PASS.
- `npm test`: existing geometry/alpha/repeatability and fast-garment assertions plus deterministic, reversible product recolouring confined to the object mask: PASS.
- Actual Chromium production workflow at `/brandmock/next/`: PASS. All 10 photographic assets are selectable through category/style controls. Each has valid dimensions, a prepared print region and a working colour mask. Logo and its chosen colour survive product changes. No ONNX/model library is downloaded in this workflow.
- Numeric controls: rotation ±1 degree, scale ±1 percent, opacity, intensity, light; values persisted to the local project: PASS. All buttons have title hints.
- Full-resolution export, opaque logo RGB recolour and unchanged pixels outside the recolouring/print mask: PASS. Alpha boundary sampling uses the same bilinear support as the renderer.
- ZIP restores photo, both colours/masks and source attribution: PASS. Source credit is also written to SOURCE-CREDIT.txt.
- Custom photo upload clears library colouring and masks. Changing its type performs actual detection: PASS.
- Real clothing photo, browser SlimSAM point inference after automatic canvas scrolling: PASS, about 16.6 seconds of inference/fitting on this machine (not a speed guarantee).
- Pinned model digests, photo-source SHA-256 manifest and dependency lock dry run: PASS.

Photographs, credits and licence links are in public/catalog. Masks and placements were checked visually; preparation scripts use local segmentation and manual silhouette refinements. The screenshots here are actual browser captures, not generated product images. Colour selection is a lightness-based visualisation, not a manufacturer colour catalogue. The trucker cap exposes front-panel colour. Uploaded caps currently require manual four-corner placement; prepared library caps work without detection. Deep cloth folds remain approximate.

Stable app/source were not edited. Baseline tree hashes: 19e3f4a613ec35d9aeea8df482fa8d9ae6f1e870 / bbc79085dffdcaf5abe6aec0bb01f02d6bb83e76.
