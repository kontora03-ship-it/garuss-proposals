# Studio 0.8.2 validation

Baseline: published 0.8.1, commit dfbaa502f264b5f950e472073e52f986305cafd7. Actual before/after captures use identical slate cloth, pale contrasting trim, lighting, camera and artwork settings. The public comparison consists only of resized/cropped browser PNG exports and labels.

Chest: 11,754 front samples receive depth-only local relaxation, max 0.0300001 scene units. Every front width/height coordinate and front print/fabric UV is unchanged. All back, sleeve and hem positions are byte-identical to 0.8.1. The wide collar retains its dimensions and inner rim; 15 outer-band samples follow the cloth, max 0.0001002 units per axis.

Back: Print_Back UV0 is affine in garment width/height, keeping the old upper-back logo anchor. Print width remains 1.083. Original artist normal atlas UV1 and texture bytes are unchanged. Numeric geometry checks verify the exported metric mapping. A real rendered rectangular SVG calibration checks horizontal baselines, then the test drags that uploaded artwork on the actual surface. Production browser tests also check PNG exports, locked vertical orbit and saved-project restoration. Canvas measurements are taken after screenshot/frame synchronization so software-rendered resize buffers cannot supply stale pointer coordinates.

Other garment hashes and original logo source bytes are unchanged. Build: npm run build. Unit/geometry: npm test. Browser: STUDIO_AFTER_ONLY=1 BROWSER_EXECUTABLE=/usr/bin/chromium node test/studio-refinement.cjs against Vite preview on port 5182. Before capture additionally sets STUDIO_BASELINE_GLB and STUDIO_BASELINE_JSON to extracted 0.8.1 assets. Browser images are under ignored test-artifacts/studio-refinement/.
