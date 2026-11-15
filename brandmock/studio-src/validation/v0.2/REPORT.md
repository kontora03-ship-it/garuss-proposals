# Studio 0.2 validation

Tested locally in Chromium with WebGL SwiftShader, 1600×1100 viewport. The complete workflow also passes from the production subdirectory /brandmock/studio/.

- Production TypeScript/Vite build succeeds.
- All three generated GLBs load and render. Four actual print materials and finite UV coordinates are checked in each file.
- Physical logo aspect ratio is preserved across four UV zones, four source aspect ratios, and rotations −90°, −45°, 0°, 45°, 90°, 180°. Sleeve wrap hit testing crosses the UV seam.
- Two distinct original SVGs can be uploaded together. Each has independent colour and rotation; recolouring retains every alpha value, including interior holes and fine strokes.
- The same project contains five independent logos across chest, back and both sleeves. Duplication, deletion, selection and surface dragging work, including grabbing a sleeve logo without a position jump.
- 1024×1024 PNG has actual opaque subject pixels and transparent background pixels. Exports in editing and orbit modes are byte-identical: selection helpers never enter exported files.
- ZIP version 2 stores all original source bytes unchanged. Restore and IndexedDB page reload recover all layers. A real Studio 0.1 ZIP opens through migration.
- No page errors or external network requests occur during the workflow.

`left-sleeve.png` and `right-sleeve.png` are real browser screenshots. `multi-edit.png` is an actual transparent PNG export, not an interface screenshot. `studio-project-v2.zip` is a reopenable multi-logo project.

Models are original static procedural geometry. The revised armholes, collars, sleeves, hood and pocket improve the previous prototype; this validation does not establish photorealistic commercial-library quality or production-ready sewing patterns. Sleeve scale uses the prepared UV pattern; taper, curvature and camera perspective naturally affect apparent dimensions. Cross-device GPU bitwise identity is not promised.
