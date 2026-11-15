# BrandMock 3D Studio 0.1 validation

- TypeScript and Vite production build: PASS.
- Original GLB models: depth, front/back print surfaces, UV orientation, pattern-space logo aspect for multiple logo formats, invalid settings rejection: PASS.
- Mesh triangle counts: regular 113600, oversized 141776, hoodie 165652 (includes thickness, seam meshes and pocket). These are actual 3D assets, not flat image planes.
- Chromium production workflow at /brandmock/studio/: PASS. Three actual GLB scenes; late responses discarded during rapid model selection; original SVG raster alpha/holes preserved after recolour; one-unit adjustments; independent front/back placement; pointer movement uses actual surface UVs.
- 1024×1024 transparent PNG: real opaque garment pixels with alpha-zero background; two consecutive exports byte-identical on the test browser/device: PASS. No floor shadow is included in transparent cutouts.
- ZIP restores exact original SVG bytes, camera, colours and both placements; IndexedDB reload: PASS.
- No external runtime requests; only self-hosted resources and local blob/data URLs: PASS.
- Dependency lock dry run and bundled asset SHA-256 verification: PASS.

The browser tests use Chromium 1254 with SwiftShader because the headless validation environment has no hardware GPU. This is functional validation, not a frame-rate benchmark. Rendering on other GPU/drivers can differ at pixel level. PNG/ZIP files here were produced by the actual application.

These are original parametric prototype models, not commercial Brand Mockups assets. Garment shaping, collars, pocket construction and fabric materials still require artistic refinement. Folds are fixed mesh geometry; no physical cloth animation, walking simulation or production sewing patterns are claimed. Reference-quality photorealism has not yet been achieved.

Existing editors kept unchanged; recorded Git tree hashes:
- app: 19e3f4a613ec35d9aeea8df482fa8d9ae6f1e870
- online: bbc79085dffdcaf5abe6aec0bb01f02d6bb83e76
- next: 3c37f9516ea6ebc1169e8dd1d1fed5eefd00ec8a
- next-src: a2c7afc911bd1911f3c483fa3be45df422e1a1c0
