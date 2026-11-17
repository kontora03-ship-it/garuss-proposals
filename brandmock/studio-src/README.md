# Update 0.7 — Heavy tee authored from the video reference

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.7

The first catalogue item, **T-shirt Heavy · по видео**, is an original model with a wide straight torso, dropped shoulders, shaped volumetric sleeves, rounded crew neck, actual cotton thickness and twin-needle hem stitching. It is authored from the user's rotating video reference; no reference-store mesh or texture is included. Both previous T-shirts and both hoodies remain available with their original assets and profiles.

The body and both sleeves form one welded closed shell with a real interior and folded material returns. Heavy cotton gravity drape is calculated offline in Blender with supported shoulders and collision forms, then baked. Seams are registered from the rest mesh to the posed cloth before export. The browser loads a static GLB and performs no cloth simulation. The new cotton material uses original fine irregular grain, muted sheen, and neutral studio lighting.

All four print surfaces retain independent logo layers and use calibrated readable UV directions. New projects start with Heavy and BrandMock chest/back samples. Saved projects retain their garment and artwork. Vertical-axis-only orbit and zoom remain.

Rebuild the model with Blender 4.3:

```sh
blender -b --threads 4 --disable-autoexec --python-exit-code 1 --python tools/build_heavy_tee.py
npm test
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 5182
# Another terminal, with an installed Chromium:
BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:heavy-tee
```

The editable source is sources/tee-heavy.blend; no Blender cameras, collision supports or simulation are shipped in the browser GLB. Reference origin is recorded in sources/tee-heavy-reference.json. Published hashes and verification notes are in validation/v0.7/. Browser evidence is generated in ignored test-artifacts/heavy-tee/.

---

# Update 0.6 — separate heavyweight T-shirt

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.6

T-shirt Studio is a separate adaptation of the user-supplied BrockCreative model: 14% wider, 6% shorter body, reshaped round crew neck, gently smoothed printable cloth, native sewing/weave normal atlas on the retained original UV set, ribbed collar and soft cotton shading. Double-sided rendering shows the rear neckline and sleeve interiors. The previous T-shirt and both hoodies retain their assets and material profile. Fresh projects start on the new tee; saved projects retain their garment. BrandMock demo logos and vertical-axis-only rotation remain.

The normal atlas is copied without modification from FBX_normal.png in the supplied archive. tools/prepare_studio_tee.py rebuilds the new GLB/JSON/thumbnail from tee-regular.glb with Blender 4.3 and auto-execution disabled. The previous model is never overwritten. This is an adapted source model, not the reference store's geometry or an offline Blender render.

Validation: production TypeScript/Vite build; all four GLBs, retained original UV atlas, unchanged printable face counts and physical logo ratios; real OrbitControls and demo migration checks. Headless Chromium checks render both T-shirts in green/white/graphite, verify the native map loads, export 1600px front/back/three-quarter PNGs and confirm vertical dragging cannot tilt the new tee. The full browser workflow also passes on the four-model catalogue, independent logo layers, surface dragging, transparent export, ZIP restore and IndexedDB reload. Generated screenshots and exports are in ignored test-artifacts/studio-tee/. See validation/v0.6/.

```sh
npm test
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 5182
# Another terminal, using an already installed Chromium:
BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:studio-tee
```

---

# Update 0.5.1 — vertical orbit and BrandMock demo

The camera rotates only around the garment's vertical axis. Pitch and panning are disabled; wheel/pinch zoom remains available. All preset views use the garment centre. Old saved cameras keep their azimuth and distance, with tilt removed and the target recentered on the garment.

The default white logo uses the existing BrandMock layer mark and wordmark. Exact built-in FORME demo files in old browser projects and imported v2 archives are upgraded. User-uploaded files, including custom files stored under the demo asset ID, remain byte-for-byte unchanged.

Verified with actual Three.js OrbitControls pointer events under Node: vertical dragging cannot tilt, horizontal dragging still rotates, and legacy camera restoration preserves distance and azimuth. Demo migration and customer-file preservation checks pass alongside the GLB geometry tests and production build. Full browser UI checks were not run.

---

# BrandMock 3D Studio 0.5

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.5

## This release

- Replaced both old procedural T-shirt menu entries with the user's BrockCreative T-shirt.
- Added the user's BrockCreative hoodie as a separate option next to the original ShoyoX hoodie.
- Real static GLB meshes, all four print surfaces, independent logo layers, fabric colour, camera rotation and PNG export use the existing editor.
- Preserved uniform proportions of original sewing-pattern UVs. Exported mesh normals transformed with the geometry. Sleeve print orientation is calibrated; pocket prints are projected from the chest, with drawstrings in front of the design.
- Old oversized projects migrate to the replacement T-shirt without losing logo files. Placement should be checked on the new garment.
- No sweatshirt or AI generation in this release. The separate photo editor is unchanged.

BrockCreative archive hashes and attribution: sources/vendor/BROCK-PROVENANCE.json and public/PROVENANCE.md. Raw uploaded Blender archives are kept outside the public application. Existing sources/tee-*.blend and tools/build_garments.py document the previous procedural release, not the new BrockCreative assets.

To prepare the supplied files with Blender 4.3, open the relevant .blend with auto-execution disabled and run tools/prepare_brock.py with `-- tee-regular` or `-- hoodie-brock`. These are user-provided commercial assets; no CC license is inferred from the free price. The old hoodie retains its CC BY 4.0 terms.

Checks: TypeScript/Vite build; parsing all three real GLBs; four valid UV print surfaces, preserved pattern distances, metric logo aspect at multiple rotations, sleeve seams, v1 migration and legacy oversized migration. Blender thumbnails visually checked. Browser interaction checks not run in this environment; the existing Playwright workflow has been updated for the new catalogue.

```sh
npm ci
npm test
npm run build
```

Publish dist/ to ../studio/. Preserve all other Garuss site sections.

---

## Previous release documentation

# BrandMock 3D Studio 0.4

Browser editor: https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.4

Separate from the photo editors app/online and next/next-src. Those editors and their storage remain unchanged. Studio has its own IndexedDB brandmock-studio-v1. There are no accounts, paid APIs or server uploads of user logos.

## What works

- Regular and oversized T-shirts plus a prepared licensed hoodie with authored cloth folds, hood, pocket, hems and cuffs.
- Chest, back, left and right sleeve surfaces; up to 16 independent logo layers from 12 original files (10 MB each, 40 MB total).
- Drag a logo to move it on the actual UV surface. Drag fabric outside logos or the background to rotate the model. Wheel zoom works in both modes. The orbit-only mode is also available.
- Each logo has independent scale, rotation, position, colour, visibility and background removal. Duplicate, delete and layer order controls are available. Numeric steps are 1 degree / 1 percent; position entry supports 0.01 percent.
- Original SVG/PNG/WebP/JPG files are preserved. SVG is rasterized in a restricted subset without scripts, CSS, DTD or external resources. Recolour preserves every alpha pixel. JPG background removal removes a connected, near-uniform edge background; it does not vectorize a photograph.
- Cloth uses matte PBR shading, fine fabric maps, rib-knit normals and soft studio shadows. The authoring calculations are baked; the browser renders a static 3D garment using Three.js/WebGL 2.
- PNG 1024/1600/2400/3200 pixels with optional transparent background. Selection helpers are excluded. Camera motion stops during export.
- Save in the browser or download a version 2 ZIP containing all used source files, layers and camera. Studio 0.1 archives migrate automatically. Photo-editor projects open in the separate photo editor.

## Hoodie preparation and accuracy

The hoodie is **Hoodie by ShoyoX**, CC BY 4.0, distributed as a prepared mesh by omikhan4901/teestudio. Author, original source, distribution, license, hashes and modifications are recorded in sources/vendor/PROVENANCE.json and public/PROVENANCE.md. Credit is visible beneath the model. The original 6.6 MB source is included unchanged under its own license.

The import tool retains the original sewing-pattern UVs using uniform scale and orthogonal orientation. It does not redraw the logo or stretch the pattern independently in X and Y. Sleeve defaults are calibrated to a visible front/outside patch. The pocket uses projected front-panel print coordinates so a logo remains visible on its surface. Artist sleeve patterns are bounded cut pieces; printing does not repeat across their side seam.

These are static visual mockups, not a live fabric simulation or manufacturing patterns. Appearance differs with lighting, camera, fold and print position. Cross-device GPU bitwise identity is not guaranteed; unchanged scenes export identically on the test renderer.

## Windows: run locally

Install Node.js 22 LTS or newer. Open PowerShell in brandmock/studio-src:

```powershell
npm ci --ignore-scripts
npm run dev
```

Open http://localhost:5181 .

```powershell
npm run build
npm exec vite preview -- --host 0.0.0.0 --port 5182
```

Publish dist/ to brandmock/studio/. Do not replace app/, online/, next/ or next-src/.

## Rebuild the model assets

Blender 4.3 with its bundled NumPy is required. Run from the source directory:

```powershell
blender -b --python-exit-code 1 --python tools/build_garments.py -- public/models --only tee-regular
blender -b --python-exit-code 1 --python tools/build_garments.py -- public/models --only tee-oversized
blender -b --python-exit-code 1 --python tools/prepare_vendor_hoodie.py
```

The general garment generator also retains an experimental original hoodie for authoring comparisons. The final command above prepares the licensed hoodie used by the current release. It preserves the source file, writes the adapted GLB/JSON and saves an editable Blender source.

## Validation

```powershell
npm test
npm exec playwright install chromium
npm run build
npm exec vite preview -- --port 5182
# Another PowerShell window:
npm run test:e2e
```

Tests check real GLB surfaces, original sewing-pattern distances, physical logo ratios at multiple rotations, alpha and interior holes, real sleeve/chest dragging, model rotation outside logos, independent layers, deterministic transparent PNG, ZIP source bytes, IndexedDB reload, version 1 migration and self-hosted resources. test-artifacts/ holds generated evidence; the release records are in validation/v0.4/.

Three.js, React, JSZip and Lucide keep their own licenses in public/licenses/. The hoodie retains CC BY 4.0; fabric maps retain CC0. Project code and original garment sources are not relicensed by those third-party terms.
