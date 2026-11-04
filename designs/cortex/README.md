# BRAIN Lab: Cortex design study

Open `index.html` for the homepage with the research film, or `review.html` to compare Home, Members, and Projects at desktop, 390px, or 320px widths, in light and dark appearances. **Research film** is the default; the earlier **Particle brain**, **Flowing surface**, and **Still** studies remain available. Direct comparison links: `review.html?motion=film`, `review.html?motion=brain`, and `review.html?motion=surface`. This folder is an isolated mockup. The original three pages, shared assets, and earlier design studies are unchanged.

## Design read

An AI research lab for researchers, students, and collaborators. The revised direction uses a cinematic research hero, self-hosted General Sans, crisp white reading surfaces, original research figures, and real people. The film connects learning, model architecture, perception, and medical imaging.

Design variance 7 / motion intensity 4 / visual density 3. Native HTML and CSS, no framework or added dependency. This is Apple-inspired web design, not an implementation of Apple's native UI system.

## Audit and response

| Before | After | Why |
| --- | --- | --- |
| Neural background, orbiting logo, gradients, terminal, and card tilt compete | One signature hero visual, a clear mission, one main action | Gives the homepage a recognizable focus |
| Twelve equal topic cards | Four grouped research themes with native disclosure | Makes the research easier to scan without an overwhelming grid |
| Dense repeated profile cards | Original portraits, role filters and directory search | Gives people and their work more space |
| Project copy differs from the source | Full original titles and TL;DRs alongside uncropped figures and paper/code links | Preserves the lab’s research descriptions |
| Enlarged system text, compressed semibold headings, pale panels and pills | General Sans with lighter display weights, sharper controls and a clearer content hierarchy | Gives the lab a more deliberate visual identity |
| Several continuous decorative effects | One optional animated hero with a pause control; short press/hover feedback | Gives motion a clear focal point |

## Hero motion studies

The default is now a 24-second edited research film (`assets/montage/hero.mp4`). This homepage copy preserves the clean video stream and removes the unused audio track. Grain is a separate 180px SVG texture on the webpage, with a 1.2px backdrop blur and a directional dark scrim. The video/treatment sit below the sharp headline, links, pause button, and official logo. The hero still fills the viewport. Mobile removes the old space reserved for the sculpture and uses a stronger full-width scrim.

The film loads only when the hero is visible and motion preferences allow playback. It pauses offscreen, in a background tab, and when manually paused. Reduced motion and playback failure keep a static poster; blocked autoplay offers manual playback. Increased contrast or reduced transparency removes the grain/blur. No new runtime dependency is required. The separate source-review film retains its optional audio.

The film contains external research references, not BRAIN Lab results; the model-layer inserts are original illustrative animation. Source credits and transformations are available through the homepage footer in `assets/montage/credits.html`. External footage clearance is still pending before public release.

The earlier [QDT reference](https://dribbble.com/shots/26272489-QDT-AI-Landing-Page-Design) uses a dense, undulating surface. The optional canvas studies use original drawing inspired by that material quality; no QDT video or artwork is copied. The header overlays the hero, which fills at least the entire viewport; the research section starts below the opening screen. Short screens can scroll without clipping the content.

- **Particle brain:** a gently shifting relief sampled from the existing conceptual brain artwork. More specific to the lab's identity.
- **Flowing surface:** a wide, shaded fold with fine surface texture and a clear reading area for the headline. Closer to the reference's abstract feel.
- **Still:** the existing sculpture, for direct comparison.

The canvas alternatives cap painting at 30fps and pixel density at 1.5. They suspend while offscreen or in a background tab. Reduced-motion preferences show a still frame; forced colors show the original image. Pause/resume preserves animation position. These alternatives do not load the film. The artwork used for sampling is an 800px WebP, 94,282 bytes; the original PNG remains as a source asset.

Online alternatives researched: [Brain Network](https://lottiefiles.com/free-animation/brain-network-gLvf32vvTj) advertises a 1.7KB optimized dotLottie, and [Brain Particles](https://lottiefiles.com/free-animation/brain-particles-CvSiWdMKLQ) advertises a 186.4KB dotLottie. Both list the [Lottie Simple License](https://lottiefiles.com/page/license). Those download sizes exclude a player runtime. They were not downloaded or incorporated: the former is closer to an icon, and neither matched the chosen material direction as closely as the custom canvas studies.

## People and projects concepts

People preserves all 49 source profiles in the original section and member order: one director, eight postdoctoral/graduate-section profiles, 31 undergraduate/visiting/external-section profiles, and nine alumni. This intentionally preserves the original section/category inconsistencies. The three non-director sections show four profiles initially with View more; search reveals every matching profile. Both current and alumni entries for Almaan Khan are retained. Names, roles, affiliations, photos and links match the source. Individual portraits retain the user-preferred cover framing; group carousel photos fit in full, in original 4–3–2–1 order.

Projects offers method-based filtering across all six existing projects, showing their full original titles and TL;DRs. Paper figures are preserved and can be opened at full size. Original paper, repository, project, and model links remain available. No anatomical brain regions are assigned to research fields.

## Appearance controls

The header on Home, People, and Projects has a light/dark mode button. The choice is saved locally, applied before the page renders, and carried across internal links without interrupting the film. Explicit `appearance=light` or `appearance=dark` URLs override the saved preference; otherwise the saved choice or system appearance is used. The button still works if browser storage is unavailable. The header divider and public-facing “Design study” footer labels are removed. The film-credit link is retained for third-party source attribution.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#ffffff` | `#101722` |
| Secondary surface | `#f1f3f7` | `#171f2c` |
| Primary text | `#10182b` | `#edf1f7` |
| Secondary text | `#586174` | `#aab5c7` |
| Accent | `#1a2a6c` | `#c2d0ec` |
| Dividers | `#dce1e8` | `#313d50` |

General Sans uses 42-96px display text at weight 400, 36-56px section headings, 15-18px body copy, and 12-14px utility text. Actions use 6px corners; images use 8px. The hero and closing invitation use `#08101d`. Body content remains opaque. Reduced motion disables movement; increased contrast strengthens text and dividers.

## References applied

- Local `design-taste-frontend` skill: audit first, brand preservation, hierarchy, copy and layout checks.
- [dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill): accessibility, layout, typography, color, branding, motion, design principles, and cross-platform guidance. Applied web-relevant principles, not native app conventions.
- [emilkowalski/skills](https://github.com/emilkowalski/skills): installed `emil-design-eng`, `review-animations`, and `apple-design` (directory `emil-apple-design`). Used for purposeful motion, clear feedback, short transitions, and pointer/reduced-motion handling.
- Ponytail: native controls and existing content, no added packages or production-site migration.

## Asset provenance

`assets/brain-sculpture.png` was created using built-in ImageGen. Prompt: a complete anatomically recognizable brain in three-quarter view, matte porcelain folded cortex transitioning to densely woven navy-indigo filaments, soft studio lighting, transparent background, no labels, glow, particles, or plinth. It is conceptual artwork, not medically validated imagery. All portraits, group photography, and research figures come from the existing website.

Keep people's photos in their original colors, per user preference; no desaturation or darkening filters. Headers and footers on all three pages use the official website's full BRAIN Lab logo, with its existing light/dark variants.

General Sans is downloaded unchanged from [Fontshare](https://www.fontshare.com/fonts/general-sans). The 38KB variable WOFF2 is self-hosted; the official ITF FFL terms and provenance are stored in `assets/fonts/LICENSE-GeneralSans.txt`. No font conversion or subsetting was performed. `assets/pulse-framework.webp` is an optimized copy of the existing PULSE figure; the full-resolution original remains linked from the project page.

## Checks and limits

Run `node designs/cortex/check.mjs` from the repository root. It checks complete roster coverage against the original page, profile fields and links, role filters, combined search/filter behavior, empty groups, reset/count behavior, appearance/motion propagation, fragment preservation, external-link handling, renderer coordinates, and the animation lifecycle (pause, reduced motion, forced colors, offscreen/background suspension, page restoration). The film checks cover deferred loading, manual pause persistence, reduced motion, forced colors, offscreen/background suspension, playback failure, and blocked-autoplay recovery. Local asset paths, anchor destinations, unique IDs, alt attributes, and text contrast were checked separately.

Browser checks covered all three pages at 320px, light and dark appearance, keyboard project filtering, full project titles, and topic selection. No horizontal overflow was found at 320px. Screenshots are in `screenshots/`.

Both hero variants were also visually reviewed on desktop and at 320px, with light/dark desktop checks and an actual pause/resume check. No browser console errors were reported. Motion screenshots use the `motion-` prefix. Renderer performance on physical phones has not been profiled.

The typography revision was checked on all three pages at desktop and 320px. The revised Home was also reviewed through its research, project, team, and footer sections, plus a dark reading surface. The current screenshots use the `refined-` prefix; `motion-` screenshots retain the earlier direction for comparison. The current muted text pairings exceed 4.5:1 contrast. Local paths, image alt attributes, and unique IDs pass; project/member filtering and offscreen material caching checks pass.

The full-screen revision was checked at 662px and 897px viewport heights: the hero ended exactly at the viewport edge, with the research section starting there and the pause control visible. At 320px width, the hero grows to fit its content and has no horizontal overflow. The complete directory retains all 49 profiles, alumni filtering returns nine, and searching Almaan returns both requested entries. All portrait filters remain `none`. Screenshots of that revision: `fullscreen-home.jpg` and `complete-members.jpg`.

This remains a review mockup. The member directory is complete relative to the current source; publications and announcements elsewhere remain selected content. Source membership totals and some classifications conflict, so no unique lab-wide headcount is presented. Publication and membership claims were reused from the site, not independently reverified. Lighthouse, assistive-technology testing, and physical-device testing are not completed. Large original research images should be optimized before production.

The film integration was visually checked at desktop, 390px, and 320px widths. The hero fills the initial viewport with no horizontal overflow; text and logo remain above the visible grain/blur. A frozen frame from the brightest excerpt was checked for readability. Pause/resume and offscreen suspension were verified in the browser. The clean 24-second background file is 7.42 MB and has no audio stream. Latest screenshots: `film-hero-desktop.png` and `film-hero-mobile.png`.

The header stays visible while scrolling on all three pages. Home uses a fixed overlay to preserve the full-screen hero; the inner pages use normal-flow sticky positioning. After 12px of scrolling, a six-layer progressive backdrop blur appears with a fully transparent background and no divider. Blur is strongest at the top and fades to zero 96px below the header (80px on mobile), inspired by the React Bits Gradual Blur and Framer Smooth Scroll Blur references. Navigation stays on a separate sharp layer; no React or animation dependency is added. In light mode, the homepage logo and navigation switch to dark ink as they reach the light reading sections. Anchor offsets account for the header, and reduced-transparency/high-contrast preferences use solid backgrounds.

The header retains the original glass capsules, gradient highlights and inset shadows, with pill highlights for the current page and Contact. The theme toggle uses sun/moon outline icons with a 44px touch target, an accessible action label and a matching tooltip. The header itself remains unfilled. Body primary actions use consistent 4px corners and tighter arrow spacing; text links, filters and utility controls use restrained color or underline feedback instead of scaling. The six progressive blur layers now range from 0.6px to 22px, with wider overlapping fades. This is a CSS web interpretation of liquid glass, not native Apple material or simulated optical refraction.

The People intro holds each of the four original group photos for four seconds, then swipes to the next in 450ms with a quick start and a smooth, non-bouncing settle, with previous/next controls and a pause button. A hidden-from-assistive-technology copy of the first image closes the loop seamlessly. Photos fit in full without color filters. Motion pauses offscreen, in background tabs and during keyboard interaction; reduced-motion visitors start paused. Pause/resume retains the exact position. Numbered pagination and clickable dot indicators are generated from the original photo list; the current dot becomes a pill. Their state follows the animation timeline at photo boundaries, without per-frame polling or a new dependency. Dots and arrows animate from the live rendered position using the same 450ms ease-out as autoplay; a new click interrupts and retargets the current swipe. Reduced-motion navigation stays immediate. Manual swipes pause offscreen and in hidden tabs, and preserve both loop directions. The graduate/postdoc, undergraduate/visiting/external and past-member sections initially show four profiles each with text-only View more / View less controls centered below each group. Search reveals all matching profiles regardless of collapse, while the directory count reports the total matches. Checked desktop and mobile layouts; no horizontal overflow. Latest preview: `screenshots/refined-controls-people.png`.

The hero's research action now uses text and a fine underline rather than a filled rectangle. Its video control is a circular pause/play icon with a dynamic accessible label and tooltip. Theme icons crossfade over 220ms with a restrained 35-degree rotation; reduced-motion preferences disable those transitions. The restored glass header surfaces are unchanged. Hero controls were checked on desktop and at 320px, including actual video pause/resume and theme switching. Preview: `screenshots/editorial-hero-controls.png`.

All remaining filled `.button` calls to action have been replaced with visible contact details on Home, People and Projects. Header Contact links and the director's contact link reach the local `#join` section. The original email address and KFUPM location are visible and selectable, with plain-text Copy email, Gmail and Outlook actions; joining/collaboration subjects are retained. Clicking the address still supports a configured mail app, while browser compose links and copying provide alternatives. No submission form or mail backend is implied. Copy success is announced only after clipboard writing succeeds; unavailable clipboard access gives a manual-selection fallback. The People contact section retains the CV/research-statement guidance. Contact navigation, copying, and desktop/320px layouts were checked; external email-provider sign-in and sending were not exercised. Latest preview: `screenshots/contact-people-desktop.png`.

## Fork review deployment

The shareable redesign lives at `https://a1maan.github.io/BRAIN-Lab-AI.github.io/designs/cortex/`. GitHub Pages serves the `main` branch root of **A1maan/BRAIN-Lab-AI.github.io**. The original site files remain at the root for comparison; no changes are pushed to the upstream lab repository. Preview pages request no indexing. Local screenshots and editor settings are excluded from the commit.

## iPhone edge and mobile film update

The iOS/WebKit header supplies a small unfiltered color strip at the viewport edge for Safari’s toolbar color sampling, then fades that strip into the existing transparent material. Navigation dimensions, glass capsules, and the progressive lower blur are unchanged. This follows the edge-sampling behavior described by WebKit in https://bugs.webkit.org/show_bug.cgi?id=301756. Actual iPhone toolbar rendering still requires device verification; a desktop responsive viewport cannot reproduce Safari’s chrome.

At widths up to 767px the hero retains its full-screen minimum height and presents the entire 16:9 film below the copy, avoiding the severe portrait crop. Short screens can scroll to retain readable text. The poster uses the same framing, and grain/blur remain separate CSS layers. A 640×360, 24-second silent H.264 copy (`hero-mobile.mp4`, 1,498,936 bytes) is selected before the first download on phones; desktop keeps the existing film. Pause, reduced motion and deferred loading remain intact. Responsive layouts were checked at 320px, 390px, 440px and landscape; no horizontal overflow was found.
