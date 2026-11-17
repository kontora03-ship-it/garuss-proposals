# Studio 0.8 local refinement validation

The user explicitly identified Studio 0.6 as the preferred base. Its exact GLB and JSON from the parent commit are frozen under sources/vendor/tee-studio-v06.*. Heavy geometry is not used in this refinement.

The new exported mesh is independently compared with the frozen source by print UV samples. All four print surfaces retain their triangle counts, UVs and native artist atlas. 27,990 front samples outside the neck region and 17,824 sleeve/hem samples are fixed. 28,470 back samples have a restrained depth-only adjustment, with maximum change 0.004429 scene units. Back width/height and the source print dimensions remain fixed. The collar is independently rebuilt with a shallow round crew contour, a monotone loop parameter and actual rib-band thickness.

The production browser test renders the baseline and result in separate fresh contexts with the same slate colour, pale contrast trim, centred BrandMock chest sample and lighting. Baseline model requests alone are routed to the frozen source; result requests use the real production files. Actual 1600px front/back/three-quarter PNGs are downloaded for both. The result also passes vertical orbit lock and saved-project restoration, retaining logo coordinates and trim colour. No page errors or failed requests occur.

tee-studio-look.jpg, the catalogue thumbnail and tee-studio-comparison.jpg are derived from actual browser exports. Full screenshots and PNGs remain in ignored test-artifacts/studio-refinement/. The comparison is arranged before/after in columns and front/back in rows. No generative image processing is used.

TypeScript/Vite build, all garment geometry checks, Heavy closed-shell checks, artist UV checks, project migrations and real OrbitControls checks pass. checks.json records the exact baseline, updated files and unchanged models' hashes. These are desktop correctness checks, not a cross-device performance benchmark.
