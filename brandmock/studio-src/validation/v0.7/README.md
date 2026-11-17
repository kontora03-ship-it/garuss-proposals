# Heavy tee 0.7 validation

This is a newly authored approximation from the user's rotating reference video. It is not the reference store's mesh or a reconstruction of its original sewing pattern. The video is not redistributed.

The Blender tool verifies shared armholes before subdivision, applies the offline drape, adds real shell thickness, and rejects a shell with non-manifold edges. The exported GLB is checked independently: welded edge counts, interior and exterior faces, front-to-back volume, readable front/back UV directions, four print surfaces, the separate collar and six twin-needle seam loops.

TypeScript/Vite build and all five garments' geometry tests pass alongside camera-lock, legacy project and exact built-in demo migration checks. The Heavy test runs against the production build with installed Chromium/SwiftShader. It checks:

- Fresh projects select Heavy with BrandMock chest and back samples.
- Front/back/side/three-quarter rendering and actual 1600px PNG downloads.
- Blue, white, graphite and green appearance.
- An asymmetric red/cyan/yellow source SVG rendered in each of four zones, with actual pixel measurements confirming left-to-right and top-to-bottom print directions.
- Moving artwork over the real chest surface with the pointer.
- Vertical dragging leaves the view unchanged; horizontal dragging rotates it.
- All four prior garment options load; the Heavy ZIP retains exact source SVG bytes; ZIP restore and IndexedDB reload retain Heavy and its layers.
- No page errors or failed requests.

Screenshots and full PNG exports are generated in ignored test-artifacts/heavy-tee/. tee-heavy-look.jpg is a 1000px preview derived from the actual 1600px browser export. checks.json records hashes and confirms every previous model, metadata and thumbnail is byte-identical to the parent commit. This is desktop correctness/visual verification, not a mobile performance benchmark.
