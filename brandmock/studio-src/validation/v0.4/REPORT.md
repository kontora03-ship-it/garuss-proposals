# Studio 0.4: licensed garment and print validation

The hoodie now uses a prepared, authored garment instead of the previous procedural prototype. Its original source is Hoodie by ShoyoX, CC BY 4.0; the prepared mesh was distributed by omikhan4901/teestudio. Source, author, licence, distribution commit, SHA-256 and modifications are recorded under sources/vendor/ and public/PROVENANCE.md. Source and output contain no avatar or rig.

## Geometric integrity

Four independent authored panels are retained: chest, back and both sleeves. Their UVs use orthogonal orientation and uniform physical scale. The original UV set is retained as TEXCOORD_1. The test compares source-pattern edge distances with the final print coordinates and confirms no anisotropic distortion. Logo aspect ratios are tested for four source shapes and rotations −90°, −45°, 0°, 45°, 90° and 180°.

The shoulder boundaries remain fixed during the relaxed distal sleeve pose. Sleeve placement defaults are calibrated to visible front/outside patches. The front pocket receives barycentrically projected front-panel print coordinates. Cuffs and hem retain the authored geometry and receive aligned rib-knit shading.

## Browser workflow

Chromium/WebGL SwiftShader loads all three real GLBs. The complete multi-logo workflow runs on the new licensed hoodie: two different original SVGs, independent per-layer colour/rotation, alpha and interior-hole preservation, all four zones, sleeve dragging without a grab jump, direct chest dragging, and model rotation when dragging fabric or background. PNG exports in editing/orbit modes are byte-identical and contain an actual opaque subject and transparent background. Original logo bytes survive ZIP save/restore, IndexedDB reload, and migration of a real Studio 0.1 ZIP. The workflow has no page errors or third-party resource requests.

After the cuff/hem material polish, geometry tests and focused front/back/unbranded PNG exports pass on the final asset. A production-subdirectory export check validates relative model and texture paths. The browser revision query prevents reuse of older cached meshes.

## Appearance and scope

The included PNGs are actual exports from the browser, not generated garment photographs. The cloth uses self-hosted ambientCG Fabric034 derivatives under CC0, rough cotton shading, soft shadows and original procedural rib normals. The author and licence are shown in the editor; copyright/credit is embedded in the GLB.

This is a different licensed garment in the reference's product-mockup style. It does not reproduce the reference store's exact proprietary cut, mesh or renders. The browser displays a static prepared pose rather than running cloth dynamics. GPU bitwise identity across devices is not guaranteed. PNG repeatability is verified on the same test renderer.
