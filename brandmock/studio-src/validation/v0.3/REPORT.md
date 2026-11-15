# BrandMock Studio 0.3 validation

Production TypeScript/Vite build and GLB geometry tests pass. All processing remains local to the browser.

## Models and cotton material

Original revision 3 meshes refine shoulders, sleeve fullness, gathered cuffs, hem, hood, collar, pocket and topstitching. Sleeve and torso boundaries use matching samples and are welded. The generator rejects open armhole edges; `--check-joins` passes for all three models. Shoulder topstitches project onto the finished cloth surface; hem stitches respect the tapered outline.

The runtime cotton material has roughness 1, specular intensity 0.14, metalness 0, roughness variation, a fine woven normal map, a subtle deterministic fibre albedo pattern and separate rib-knit normals. Lighting is calibrated for diffuse cloth. Model and preview URLs carry revision 3 so an old browser cache cannot silently retain earlier meshes.

## Interaction and exports

Chromium/WebGL SwiftShader runs the complete workflow from /brandmock/studio/: three model loads, four print zones, multiple independent originals, alpha-preserving recolour, one-degree rotation, sleeve dragging without a grab jump, chest dragging, and separate logo settings.

Dragging outside a logo over either fabric or background rotates the model while every logo coordinate stays unchanged. Orbit damping is stopped without a camera jump when grabbing a logo or exporting. Export pauses preview frames and hides editing helpers.

1024 transparent PNG exports from editing and orbit modes are byte-identical. Original SVG bytes survive the multi-logo ZIP; restoring the archive and reloading IndexedDB recover all layers. A real 0.1 archive migrates successfully. No page errors or external resource requests occur.

After the final seam projection adjustment, a focused browser check renders all three final GLBs, checks the front/back hoodie, exports its PNG and verifies revisioned model URLs. Its screenshots and log are included alongside the full workflow evidence.

## Limits

These are original static procedural garments. The changes improve the earlier prototype; they do not establish the photographic detail, natural cloth drape or exact visual quality of the reference video. No physical cloth dynamics or production sewing-pattern accuracy is claimed. Software rendering validates functionality, not performance on a user's GPU. GPU bitwise identity across devices is not guaranteed.
