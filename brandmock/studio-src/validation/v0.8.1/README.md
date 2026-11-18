# Wider neckband and supported shoulders — 0.8.1

The parent 0.8 GLB/JSON were extracted to temporary files and supplied as STUDIO_BASELINE_GLB / STUDIO_BASELINE_JSON to the existing browser workflow with STUDIO_FRONT_ONLY=1. Baseline front/three-quarter images were captured first. After the user's shoulder request, the final model was checked with STUDIO_AFTER_ONLY=1 in a new context under identical rendering settings, retaining the unchanged baseline images. Both result views exported actual 1600px PNGs; orbit lock and saved-project restore pass with no browser errors or failed requests.

The band extends outward by a factor of 2.2 and conforms to the existing cloth. Matching inner-rim samples change by at most 7.45058e-8 scene units, so the approved opening is retained.

A smooth 0.040-unit height adjustment supports the shoulders and upper sleeves, fading out toward the central chest, lower body and cuffs. Direct comparison of the exported parent/result GLBs confirms the five body/sleeve/hem surfaces retain their original width/depth coordinates, triangle indices and both UV arrays. 9,772 height samples lift by up to 0.04000002, while 72,452 stay fixed. Points beyond the conservative shoulder region stay fixed. Normals follow the new local shape. Back-fold depth stays as approved.

The production build and all garment/UV/project/orbit tests pass. Existing source-refinement checks also verify fixed front and lower-sleeve/cuff/hem regions relative to the frozen 0.6 mesh. Latest previews are derived from native PNG exports. tee-studio-band-comparison.jpg shows 0.8 versus the new model, with front and three-quarter rows. The earlier 0.6/0.8 comparison remains unchanged. Other garments retain their hashes; no new third-party assets or textures are introduced.
