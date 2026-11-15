# LAB 0.7 validation

- TypeScript and Vite production build: PASS.
- Engine and fast analysis tests (`npm test`): PASS. Perspective, silhouette/alpha, preservation of original pixels, repeatability, cylinder and cloth inverse mapping, fine strokes; fast masks, tilted garment axes, shirt/hoodie/polo profiles, print zones, blank rejection.
- CPU SlimSAM on real worn T-shirt and real hoodie from behind: PASS (about 4.1 s / 2.7 s on this machine; not browser timings).
- Chromium WASM point inference on the real T-shirt: PASS, 14.2 s for mask and fitting, about 15.1 s to updated view. No YOLOS download on point refinement. First internet download time and other devices will differ.
- Production browser test at /brandmock/next/: PASS. Three fast garment demos, no ONNX/Transformers/WASM model resource requests, distinct chest/back zones, four PNG effects, ZIP restores mask/profile, automatic fast detection on photo upload, 5.85MP source exports at original size while preview is 1200px. See speed.json for measured times. End-to-end UI timing includes fixed waits in the test and image rendering; the 0.1–0.2s status is contour analysis and fitting only.
- Lockfile install dry run and pinned model SHA-256 checks: PASS.
- Stable app and stable source trees compared to original baseline: unchanged. Stable tree hashes remain 19e3f4a613ec35d9aeea8df482fa8d9ae6f1e870 / bbc79085dffdcaf5abe6aec0bb01f02d6bb83e76.

The fast mode is border/colour segmentation for isolated products, not semantic clothing recognition. Synthetic garment demos are explicitly labelled. Real clothing photos were tested with point-prompted SlimSAM. Deep folds, occlusions and complex backgrounds still need manual review. No photo is sent to an inference API. Previous 0.6 reports are retained separately as history; towels are absent from the current UI and demo folder.
