# Update 0.8.5 — one continuous human torso contour

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.8.5

The 0.8.4 profile was too flat. The Studio tee now follows a continuous torso envelope: a broad chest flows into the abdomen and lower body, with a gentle upper-back contour. The deformation is shared across the mesh, including inner sleeve roots, so there are no separate chest patches or displaced seam boundaries. Shape-preserving cubic height curves and a smooth lateral cage keep the volume broad and the waist relaxed. No person/avatar geometry is added.

Torso width and vertex heights are retained from 0.8.4. The neck opening, raised shoulder height, outer sleeves/cuffs and level hem remain. Original fabric-atlas UV1 is unchanged. Print UV0 is rebuilt on the final surface. The previous garments, customer artwork files, project settings and vertical-only orbit are retained.

Geometry tests verify a visible but moderate chest-to-abdomen contour, broad rather than paired chest peaks, retained abdomen volume, low print anisotropy and the level lower rim. Actual renderer evidence compares 0.8.4 and 0.8.5 in profile/front and captures a complete eight-angle revolution. See models/tee-studio-human-profile-comparison.jpg, models/tee-studio-turntable.jpg and validation/v0.8.5/.

Rebuild with tools/refine_studio_tee.py (Blender 4.3, --disable-autoexec), then npm test and npm run build. Vite dev on 5183 serves test:studio-turntable; set STUDIO_BASELINE_GLB and STUDIO_BASELINE_JSON to extracted 0.8.4 assets for the immediate comparison. Vite preview on 5182 serves TORSO_AFTER_ONLY=1 npm run test:torso-print.

---

# Update 0.8.4 — continuous profiles and a level lower hem

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.8.4

The 0.8.3 local back-depth patch stopped above the hem and left a protruding lower-back pocket in side view. The front also flared too far, and the original hem rose into a high side cut. Both torso panels now use one implicit depth-fairing solve that includes their hem vertices. There is no lower patch cutoff or polynomial depth target. A harmonic height extension lowers the complete 370-vertex lower rim to its original lowest plane, removing the high side opening while keeping the garment bottom open.

The wide cut, shoulder lift, neck opening and sleeve geometry are retained. Original artist fabric UV1 is unchanged. Torso print UV0 is unwrapped again on the final surface; BrandMock defaults, customer artwork originals, saved settings and vertical-axis-only orbit remain. Other garments retain their original files and hashes.

Geometry regressions verify front/back lower-depth envelopes and every actual lower-rim edge. Browser evidence includes both profiles, front/rear views and an eight-angle turntable, plus native PNG exports and print dragging/saved-project checks. Actual captures are published as models/tee-studio-profile-comparison.jpg and models/tee-studio-turntable.jpg. Evidence is in validation/v0.8.4/.

Rebuild with tools/refine_studio_tee.py (Blender 4.3, --disable-autoexec), then npm test and npm run build. The turntable test uses Vite dev on 5183 and test/fixtures/studio-turntable.html; set STUDIO_BASELINE_GLB and STUDIO_BASELINE_JSON to extracted 0.8.3 assets for the immediate before/after comparison. The production print test uses preview on 5182 with TORSO_AFTER_ONLY=1 npm run test:torso-print.

---

# Update 0.8.3 — print unwrap follows the actual cloth surface

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.8.3

The 0.8.2 flat back projection introduced UV foldovers wherever the cloth turned back in width/height. At a rear angle around 60 degrees, a stroke could smear across a fold while other letters disappeared. A straight upper-back screenshot did not expose this defect. The final fix uses a fresh angle-based surface unwrap for both torso panels, calibrated in actual 3D surface units and anchored at the existing chest/back demo centres. No flat projection is used for Studio torso artwork.

The front, sleeves, collar, shoulder line, garment width/height and original fabric-atlas UV1 are retained. The deep central back groove receives a local depth-only relaxation toward a low-frequency torso contour, following the earlier request for fewer back folds. Back seams and surrounding regions are held fixed. The actual logo files and saved settings are retained. Other print centres may move slightly because they now follow the corrected surface pattern. The relaxed back improves large-print readability; a fold can still naturally occlude artwork at extreme side angles, but must not smear it into an oval.

The geometry regression checks signed UV triangle area and the intrinsic 3D-to-UV Jacobian for every torso triangle. It explicitly exposes the flat-projection failure, rather than testing coordinates against the same projection. Browser checks use lower prints, views rotated about 60 degrees, three heights on each side, pointer dragging and saved-project reload. Natural drape is retained, so screen-space horizontal baselines are recorded without requiring an artificially flat result.

Run npm test, npm run build, start Vite preview on port 5182, then STUDIO_BASELINE_GLB=<extracted 0.8.2 GLB> STUDIO_BASELINE_JSON=<matching JSON> BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:torso-print. The default comparison uses the frozen Studio 0.6. Evidence: validation/v0.8.3/.

---

# Update 0.8.2 — softer chest and corrected back print

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.8.2

The two raised chest folds are softened with a depth-only local relaxation; width and height stay fixed. The approved collar width/opening and raised shoulders stay as in 0.8.1; sleeves, hem and back positions are unchanged. Fifteen outer-band samples follow the locally adjusted cloth by at most 0.000101 scene units. A separate metric planar UV0 frame on Print_Back removes the old uneven baseline and stretched lettering. The source normal/sewing atlas on UV1 is unchanged. The old upper-back demo anchor remains at the same physical point, and uploaded artwork files are retained.

The browser comparison uses parent 0.8.1 assets and identical settings. It checks actual PNG exports, back-print horizontal baselines, pointer dragging, saved projects and the vertical orbit lock. Evidence: validation/v0.8.2/. See models/tee-studio-chest-print-comparison.jpg for actual browser before/after crops.

---

# Update 0.8.1 — wider neckband and subtle shoulder lift

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.8.1

The collar band is 2.2 times wider, extending outward over the existing cloth so the approved neck opening stays the same size. The added band rows conform to the existing body surface. A smooth 0.040-unit height adjustment slightly supports the shoulders and upper sleeves. Width, depth, triangles and both UV sets retain their source values. The inner collar rim, central chest, lower body and cuffs stay fixed; back-fold depth and cloth shading remain as approved. The change uses the same Studio model ID and preserves saved projects.

For the latest before/after browser comparison, extract the parent commit's tee-studio.glb and JSON to temporary files and provide their paths as STUDIO_BASELINE_GLB and STUDIO_BASELINE_JSON to the existing test:studio-refinement script. STUDIO_FRONT_ONLY=1 checks front and three-quarter exports. The default test still compares against the frozen 0.6 source.

---

# Update 0.8 — approved Studio 0.6, round collar and quieter back

Published at https://kontora03-ship-it.github.io/garuss-proposals/brandmock/studio/?v=0.8

The user selected T-shirt Studio 0.6 from their screenshot. This release refines that model in place: a rounder, shallower crew neck and gently reduced back-fold depth. Its body fit, front drape outside the neck region, sleeves, hems, original fabric atlas, four print UVs and print dimensions are retained. The separate Heavy experiment remains available at the end of the catalogue.

The new ribbed band follows an exact local replacement of the body's 144-point neckline. Its angular parameter is monotone along the original loop so the band cannot fold back on itself; it has real material thickness. Neck changes blend out within 0.145 scene units. Back depth uses a 25% blend of a relaxed depth field, with every seam boundary held fixed; the maximum measured change is 0.00443 scene units. Back width and height do not change.

The reproducible tool is tools/refine_studio_tee.py. The approved v0.6 baseline is frozen in sources/vendor/tee-studio-v06.glb and its matching JSON; it is never regenerated from the rejected Heavy model. The editable result is sources/tee-studio-refined.blend.

```sh
blender -b --threads 4 --disable-autoexec --python-exit-code 1 --python tools/refine_studio_tee.py
npm test
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 5182
# Another terminal, with an installed Chromium:
BROWSER_EXECUTABLE=/usr/bin/chromium npm run test:studio-refinement
```

Independent checks compare actual source and result GLBs by print UV samples: 27,990 front samples and 17,824 sleeve/hem samples remain fixed, while back changes are restrained and affect depth only outside the neckline. Browser checks render the frozen before and real after with identical fabric, contrasting trim, logo placement and lighting, then verify 1600px PNG exports, the vertical orbit lock and saved-project restoration. Evidence is in validation/v0.8/ and ignored test-artifacts/studio-refinement/.

---

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
