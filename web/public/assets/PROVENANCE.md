# ConceptArena visual asset provenance

These are **original AI-generated fictional concept renders**, created with the built-in OpenAI `image_gen` tool on 2026-11-19. They are not actual product photographs, real brand packaging, product claims, research observations, or test results. The internal names Sculpt, Veil, and Ritual identify concept alternatives only and do not appear as text in the images.

## Intended experimental constants

All three images show one closed pack plus a matching open pack with the same muted berry-nude lip-colour bullet. Formula, shade, fill size (3.5g), price and refill function are intended to remain constant across the concepts. Only the exterior visual communication and packaging design vary. Product feasibility and physical refill performance have not been tested. Reference-based editing preserved the studio scene, camera, light direction, product baseline and lipstick appearance; generative outputs are illustrative and do not establish exact manufacturing dimensions or colorimetry.

## Files and generation lineage

| Deliverable     | Concept                                                    | Workflow                                                       | Original generated source                                        |
| --------------- | ---------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `concept-a.png` | Sculpt — brushed champagne-metal oval shell, sculpted cap  | New original generation, no image inputs                       | `generator-output/exec-ef9f086d-6c11-4018-9fce-bcde037dd95c.png` |
| `concept-b.png` | Veil — slender deep-plum satin shell                       | Image edit using `concept-a.png` as target and scene reference | `generator-output/exec-4d65db39-aa59-4923-af2d-29dad645bc06.png` |
| `concept-c.png` | Ritual — matte ivory tactile shell with subtle refill seam | Image edit using `concept-a.png` as target and scene reference | `generator-output/exec-ea66abb4-c3aa-4e21-a3ff-17a7b12b027f.png` |

All assets use opaque warm-ivory backgrounds (`transparent_background: false`). Images were copied byte-for-byte into this directory; no code-generated product art, stock photography, compositing, or post-generation image editing was used. The tool returned 1254 × 1254 px square PNGs; the requested 2048 × 2048 output was advisory and was not returned. No logos, visible text, claims, UI heatmaps, or overlays are burned into the assets.

## Inspection

The returned images were visually inspected after generation. Each contains two upright packs, a warm-ivory studio background, soft left-side light, the same berry-nude lipstick exposure, safe outer margins, and a grounded shadow. They are suitable for square cards with `object-fit: contain` or an uncropped square. Sculpt has an organic oval shell and sloping architectural cap; Veil is visibly slimmer and deep plum; Ritual uses a matte ivory shell and a fine lower-body seam. The safe margins preserve all products and shadows when viewed at 400 × 400.

## Exact prompts

### A — Sculpt

```text
Use case: product-mockup.
Asset type: high-resolution square editorial product render for a ConceptArena comparative concept-testing card.
Primary request: Create an ORIGINAL FICTIONAL refillable luxury lip-colour packaging concept called Sculpt internally, with absolutely NO text or logos visible. This is not a real product or a real brand.
Scene/backdrop: seamless warm ivory studio backdrop and ground, approximately #f4efe7, with a subtle soft ground shadow.
Subject: exactly TWO upright objects: ONE fully closed lipstick pack on the left, and ONE matching open lipstick pack on the right revealing a muted berry-nude lipstick bullet. Do not include a loose cap or third object. Both packs share a substantial oval cross-section brushed champagne-metal body; the closed pack has a refined sculpted architectural cap, gently sloped and softly faceted, the open pack shows a simple exposed champagne-metal sleeve and berry-nude bullet with a clean angled tip. Subtle precise seam where the closed cap meets the body. The pack is refillable but no disassembly or exploded parts. All shape and material choices must be original, no known luxury brand trade dress.
Style/medium: exceptionally refined realistic premium beauty studio product photography aesthetic, physically plausible materials, high-detail 3D concept render.
Composition/framing: square 1:1, eye-level slight elevated three-quarter product view, fixed 85mm studio camera; closed pack centered at x=39%, open pack centered at x=64%. Both grounded on the same baseline y=77%. Tallest closed pack reaches y=25%, open pack reaches y=30%. Entire group fits inside generous safe margins for a 400x400 card without clipping. Products occupy around 52% of image height. Clean empty background with no props. Keep axes upright and parallel, packs separated so cap and body regions are easily distinguishable for later UI overlays.
Lighting/mood: soft directional studio key light from upper left, delicate right fill, understated luxury editorial, neutral warm balance, no dramatic glare.
Color palette: warm ivory background, brushed champagne metal, muted berry-nude lipstick (desaturated dusty rose/berry, approximately #975969), same formulation and same exposed bullet dimensions as a normal 3.5g lipstick.
Constraints: zero visible text, zero letters, no branding, no logos, no labels, no watermarks, no badges, no UI, no people, no hands, no flowers, no stones, no claims, no charts, no floating objects. Full object and shadow within safe margins. Output a single finished square image, 2048x2048 if possible.
```

Tool arguments: `transparent_background: false`. No referenced images.

### B — Veil

```text
Use case: precise-object-edit.
Asset type: square high-resolution concept-testing product stimulus.
Input image 1: EDIT TARGET and composition/lighting/shade reference, the original fictional Sculpt studio concept render.
Primary request: Produce a coordinated sister image, original fictional Veil refillable luxury lip-colour packaging. Change ONLY the two outer pack designs and materials in the reference image. Keep the same warm ivory studio background, camera, perspective, light direction, ground plane, soft shadows, two upright product positions, relative height, exact muted berry-nude lipstick shade, bullet dimensions, and photographic polish.
Design change: the closed pack on the left and matching open pack on the right must now have slender, restrained deep-plum satin shells (#3b2436), straight refined softly rounded cylindrical sides and a flat very subtly softened top. The closed shell is clearly thinner than Sculpt, expressing quiet everyday elegance. No sculpted slanted cap and no champagne outer body. Keep the closed cap seam at the same approximate height, subtle and precise. On the open pack, keep a narrow muted champagne-metal inner sleeve holding the lipstick, but the main lower outer shell is deep plum satin and slender like the matching closed pack. No loose cap, no additional object, no exploded refill mechanism.
Invariants: exactly TWO objects, one closed pack on left and one matching open pack on right. Match the reference overall product scale and approximate group footprint; all objects and ground shadows safely within a square crop suitable at 400x400. Maintain the same closed-pack and open-pack baseline and top positions. The two lipstick concepts represent the exact same formula, 3.5g size, shade, price and refill function; difference is exterior pack communication only. No actual product/brand attribution.
Text: absolutely no text, letters, brands, logos, labels or embossing.
Avoid: no people, no hands, no props, no icons, no watermarks, no badges, no UI overlays, no third object, no disassembly, no aesthetic change to backdrop or lighting. Original AI-generated fictional concept render, premium realistic editorial product photography aesthetic. Output a single square 2048x2048 image if possible.
```

Tool arguments: `referenced_image_paths: ["web/public/assets/concept-a.png"]`, `transparent_background: false`.

### C — Ritual

```text
Use case: precise-object-edit.
Asset type: square high-resolution concept-testing product stimulus.
Input image 1: EDIT TARGET and composition/lighting/shade reference, the original fictional Sculpt studio concept render.
Primary request: Produce a coordinated sister image, original fictional Ritual refillable luxury lip-colour packaging. Change ONLY the two outer pack designs and materials in the reference image. Keep the same warm ivory studio background, camera, perspective, light direction, ground plane, soft shadows, two upright product positions, relative height, exact muted berry-nude lipstick shade, exposed bullet dimensions, and photographic polish.
Design change: the closed pack on the left and matching open pack on the right now have tactile matte warm-ivory shells (#e3d8c9), softly rounded straight cylindrical sides, very subtly softened flat top, understated beautiful ceramic-like surface with microscopic fine texture. The outer shell must read as matte ivory, distinct from the ivory background through gentle shading. The pack should feel quietly purposeful and premium. No slanted sculpted cap and no champagne outer body. Keep a fine precise cap seam near the middle of the closed pack. Add an extremely subtle fine circumferential seam around the lower body, approximately one quarter of the way up from the base, that hints at access for refill; make the same lower-body seam present on both closed and open packs. All parts remain fully assembled, seam flush and thin, NO gaps, NO exploded view and NO extra parts. On the open pack, preserve the reference muted champagne-metal inner sleeve holding the exact same berry-nude lipstick, but make the lower outer main body matte ivory like the matching closed pack.
Invariants: exactly TWO upright objects, one closed pack on left and one matching open pack on right. Match reference overall product scale and group footprint; all objects and ground shadows safely within a square crop suitable at 400x400. Maintain the reference closed-pack and open-pack baseline and top positions. The three concepts represent the exact same formula, 3.5g size, shade, price and refill function; difference is exterior pack communication only. No actual product or brand attribution.
Text: absolutely no text, letters, brands, logos, labels or embossing.
Avoid: no people, no hands, no props, no icons, no watermarks, no badges, no UI overlays, no third object, no disassembly, no aesthetic change to backdrop or lighting. Original AI-generated fictional concept render, premium realistic editorial product photography aesthetic. Output a single square 2048x2048 image if possible.
```

Tool arguments: `referenced_image_paths: ["web/public/assets/concept-a.png"]`, `transparent_background: false`.
