# Studio 0.6 validation

Checks use the production Vite build and the installed Chromium with SwiftShader on this Linux environment. No browser package was downloaded. This validates desktop rendering and interaction; it is not a cross-device performance benchmark.

- TypeScript and production build pass.
- All four actual GLBs have four bounded print surfaces and an original atlas UV set. The new tee retains exactly the previous tee's printable face counts. Deliberate fit scale is accounted for in the sewing-pattern UV check; logo rectangles preserve their physical aspect at multiple rotations.
- Real Three.js OrbitControls pointer tests pass: vertical dragging cannot tilt, horizontal dragging rotates, and saved cameras recenter without losing azimuth or distance.
- BrandMock demo migration preserves customer source bytes.
- The full browser workflow renders all four garments and verifies multiple original SVGs, independent layers, real sleeve/chest dragging, orbiting outside logos, deterministic transparent PNG, ZIP contents, restore and IndexedDB reload. Advanced layer interaction checks use the existing ShoyoX hoodie.
- The focused new-tee browser workflow compares both T-shirts in green/white/graphite, verifies the author normal atlas is loaded, exports 1600px front/back/three-quarter PNGs, and verifies the new tee cannot tilt on vertical drag. No page errors or failed requests occur.

Generated screenshots and PNGs remain in ignored test-artifacts/. The focused workflow runs against the final crew-neck geometry and cotton material. checks.json records published asset hashes and verifies previous T-shirt files are unchanged from the parent commit.
