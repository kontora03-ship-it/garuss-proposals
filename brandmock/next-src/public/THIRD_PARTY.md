# BrandMock LAB: third-party assets

- Transformers.js 3.8.1 — Apache-2.0, https://github.com/huggingface/transformers.js . License included in licenses/Apache-2.0.txt.
- YOLOS-tiny ONNX Q8: https://huggingface.co/Xenova/yolos-tiny , derived from https://huggingface.co/hustvl/yolos-tiny (Apache-2.0). Exact upstream revision: e2f9c7673f0fa61849efe2b56a0d7774779ebb9d. Model card included. Used only for cup detection; COCO classes do not provide precise apparel or fabric geometry.
- SlimSAM-77-uniform ONNX Q8: https://huggingface.co/Xenova/slimsam-77-uniform (Apache-2.0), revision 5850ab45f587c112167512ffef949107115e26a0. Model card and Apache license included. Derived from SlimSAM / Segment Anything. Used for point-prompted segmentation; not a 3D reconstruction model.
- ONNX Runtime Web 1.22.0-dev.20250409-89f8206ba4 — MIT, https://github.com/microsoft/onnxruntime . License included in licenses/ONNX-RUNTIME-LICENSE.txt. WASM binaries copied from the installed npm package.
- OpenCV.js — Apache-2.0, https://opencv.org/ . Existing distribution and notices retained from stable version.
- Mug photo: https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&q=90 , https://unsplash.com/license . An illustrative photograph, not user-provided content. The unaltered JPG is public/demo/mug.jpg and the test fixture.
- Shirt and towel demos: generated deterministically with Pillow/Numpy by test/create-fabric.py; synthetic test images, no generative model. Original test marks/logos come from the BrandMock project.

Model file digests and source URLs are in models/manifest.json. No hosted inference API is used. User-uploaded images are not sent to these providers.

Other original demo source notices: samples/SOURCES.md.
