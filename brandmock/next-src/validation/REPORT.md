# LAB 0.6 validation — 2026-11-15

- TypeScript and Vite production build: passed.
- npm lock/install dry run (`npm ci --ignore-scripts --dry-run`): passed.
- Engine assertions: original plane cases, alpha, holes, original pixels, source proportions, repeatability; cylinder forward/inverse and real deformation; object clipping; bounded fabric mapping; fine strokes: passed.
- Actual CPU YOLOS-tiny + SlimSAM inference on the real mug photograph, repeated deterministic mask, conservative body fit: passed.
- Chromium 1254 production browser test at `/brandmock/next/`: actual WASM inference on mug, synthetic shirt and towel; four PNG effects at 900×600; logo dragging in cylinder coordinates; ZIP version 6 restores segmentation mask; same-origin resource requests only; stable localStorage and IndexedDB sentinels untouched; no page exceptions: passed.
- All model hashes match the pinned SHA-256 manifest.
- Stable app tree: 19e3f4a613ec35d9aeea8df482fa8d9ae6f1e870. Stable source tree: bbc79085dffdcaf5abe6aec0bb01f02d6bb83e76. Both checked unchanged before publication.

PNG files here are actual renderer/browser outputs, not generated mockup imagery. Shirt/towel photos are synthetic fixtures. These checks do not establish reliable fold/depth recovery on arbitrary real garments; cloth deformation remains a limited lightness-based approximation.
