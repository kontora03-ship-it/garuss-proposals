# BrandMock 3D prototype — asset provenance

All three garment geometries were constructed for this project with tools/build_garments.py using author-defined cutting outlines, surface functions, sewn boundary strips, thickness, seams, collar/hood/pocket and drawcord meshes. The front/back UVs follow the original two-dimensional pattern coordinates. Sources are stored as .blend files in the source repository; browser models are self-contained GLB files.

No commercial Brand Mockups files, product photographs, purchased meshes or third-party garment models are included. The referenced store was studied only for general presentation and workflow. Preview images are CPU Cycles renders of these original models. No generative AI image or model API was used. The tiny demo logo is original sample SVG; user logos retain their original source bytes in saved projects.

The browser fabric normal pattern and soft ground shadow are generated deterministically by the application. The shadow is a presentation approximation, not an offline area-light simulation. Lighting environment uses Three.js RoomEnvironment, covered by the Three.js licence in licenses/THREE-LICENSE.txt.

Dependencies retain their respective licences: Three.js (MIT), React/React DOM (MIT), JSZip (MIT or GPLv3, distributed here under MIT), Lucide (ISC). Licence texts are in licenses/. Runtime model files and hashes are listed in models/manifest.json.
