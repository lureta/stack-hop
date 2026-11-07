# Stack Hop

MY INTERACTIVE PORTFOLIO JOURNEY

A playable React + TypeScript portfolio with five themed worlds, Rapier physics, touch checkpoints, persistent respawning, stage teleportation, four portfolio displays, and a replayable rocket finale. Recruiters can also browse a conventional portfolio without playing. Mobile defaults to that view.

## Run locally

Requires Node.js 22.12+ (or a supported newer LTS).

```sh
npm install
npm run dev
```

Open the Local or Network URL printed by Vite. Click inside the 3D world to focus it. Move with WASD or arrows, hold right mouse and drag to look around (left-drag also works), scroll to zoom, jump with Space, interact with E, and close dialogs with Escape. After orbiting, movement follows the camera direction. An opaque startup screen stays visible until shaders are prepared and the character and camera have settled. Teleports and respawns restore the opening camera. If the Local address does not respond to keys, use the working Network URL or reload the Local tab with Command+Shift+R. The five world buttons teleport you to their checkpoints. Touching a checkpoint saves your respawn stage locally. Settings → Restart journey clears progress and resets the launch.

```sh
npm run build
npm run preview
```

`dist/` is the deployable static build. No backend, account, or secret is required.

## Make it yours

- `src/data/portfolio.ts`: name, initials, introduction, education, interests, experience, photo, email, resume, GitHub, and LinkedIn.
- `src/data/showcases.ts`: three intentionally unnamed project placeholders. Replace title, description, technologies, technicalDetails, challenges, image, githubUrl, liveUrl, and optional videoUrl.
- Put photos, screenshots, a PDF resume, or videos in `public/`, then reference them as `/photo.jpg`, `/project-1.png`, or `/resume.pdf`. Full HTTPS URLs also work.
- Empty links render as non-clickable “coming soon” labels. No real project links or achievements are fabricated.
- `src/data/levels.ts` controls stage names, themes, and colors. World geometry is in `src/components/Worlds/`; `PortfolioShowcase` in `Exhibits.tsx` is the reusable 3D display.
- `src/components/Player/Avatar.tsx` contains the personalized rounded 3D character, clothing colors, headphones, backpack, facial expressions, and joint animations. Its `Face` component selects idle, jumping, and falling expressions from controller state. Checkpoint contact lights up the pad and plays a brief glowing ring effect without changing the face.
- `src/components/Player/avatarGeometry.ts` builds shared curved hair locks and accessory shapes once. Hair uses a closed volumetric back shell and 13 thick curved sections, totaling approximately 13,000 triangles. The visual model stays separate from the existing physics capsule.
- `src/styles.css` contains layout, responsive styles, and reduced-motion preferences. `src/components/Portfolio.tsx` renders shared portfolio information.

The game uses a smooth follow camera with a closer, slightly offset view and scene-object clipping checks. Movement follows the camera after mouse rotation; the opening view retains predictable world-aligned movement. Walking speed and jump impulse are in `Player`; obstacle spacing and dimensions are in `src/data/course.ts`. The starting workspace is a safe spawn without a visible checkpoint. Four square touch checkpoints sit at the island centers in Backend, Database, Cloud, and Launch. Spawns and respawns use the island center and each world’s elevation. World base elevations are 0, 33.1, 50.1, 67.1, and 84.1 units. Backend, Database, and Cloud each span 108 units with fifteen varied obstacles, an ascending lift, and an exit bridge. Launch has eleven objects leading to the elevated rocket pad. A fresh Space press can recover a reachable side ledge: the controller checks the top and headroom, lifts clear of the lip, then briefly nudges inward. Assistance is limited to once per airtime and does not allow climbing indefinitely up walls. The active respawn stage is stored under `tech-journey-checkpoint-v1`. Storage being unavailable does not prevent play.

## AWS Amplify Hosting

1. Push this folder to your Git provider and connect the repository in AWS Amplify Hosting.
2. Use the included `amplify.yml`: `npm ci`, then `npm run build`; artifact directory `dist`.
3. Use a Node.js 22 build environment. No environment variables are needed.
4. Deploy. The site uses one HTML entry point and hash anchors, so no client-side route rewrite is required.

For manual static deployment, upload the contents of `dist/`. Keep all bundled assets together, including Rapier's generated runtime assets.

## Verification

`npm run build` checks TypeScript and creates an optimized production bundle.

```sh
npx playwright install chromium
npm test
```

The browser suite covers portfolio access, overlays, all five teleports, persistence, movement, jump, glowing checkpoints, falling/respawn, launch/restart, mobile layout, moving queues, lift exits, curved collision silhouettes, and the complete continuous course. Project links come from the existing portfolio data. Chromium can use its normal GPU selection or software WebGL fallback. The full-route test uses a controlled browser clock to keep input timing deterministic under software rendering; it drives the existing keyboard controller and never teleports through the course. First-time runs require Chromium download. The 3D world loads lazily so the conventional portfolio remains lightweight. WebGL errors show a portfolio fallback.

## The five worlds

- **UI Playground:** a winding 30-unit climb through browser ramps, app objects, two groups of three opening folder covers forming stairs, a faster autonomous curved cursor ride, thin tabs, a push-operated toggle seesaw, a rotating loading carousel, solid HTML brackets, a moving pop-up blocker, a clock, and a proximity-opening dropdown lift. The title screen introduces WASD/arrow-key movement, Space to jump, and E to explore. World navigation has five direct teleport buttons.
- **API Network:** server-rack roofs, queue rollers, opening authentication scanners, curved transport pipes, memory caches, a scaling lift, and a 200 OK exit inside a large server hall.
- **Data Vault:** record grids, layered database stacks, hexagonal shards, linked tables, an index-drawer lift, replica banks, and a commit seal surrounded by oversized filing cabinets.
- **Deployment Sky:** container roofs, object-storage buckets, solar-panel satellites, load balancers, an autoscaling lift, and floating region stations with communication dishes.
- **Production:** eleven artifact, build, test, and release obstacles lead to an elevated rocket pad, launch gantry, cargo crane, and mission control. The finale retains countdown, liftoff, smoke, confetti, and fireworks.

`src/data/course.ts` defines platform positions, sizes, kinds, and motion. `src/components/Worlds/Course.tsx` handles explicit colliders, kinematic motion, timed solidity, and landing feedback. `Scenery.tsx` contains the entry islands; `StackScenes.tsx` and `StackObjects.tsx` contain the expanded worlds and playable objects. `FrontendScenes.tsx` contains the playable app-object models and progress telemetry; `FrontendMechanisms.tsx` contains the cursor shape, opening folder lids, seesaw, carousel, HTML structures, clock, and physical pop-up gate. `Exhibits.tsx` contains reusable portfolio monitors and touch checkpoints. `RocketLaunch.tsx` owns the countdown and celebration. `shared.tsx` caches repeated geometry and materials. Character geometry remains in `src/components/Player/`.

Sound starts muted. The music-note button enables understated synthesized jump, landing, checkpoint, interaction, and launch cues after a user gesture. The preference is saved on this browser. No external audio files are required. Checkpoints light up and emit a small particle burst; they do not change the avatar’s eyes.

The existing `build` command includes TypeScript checking. This project does not define a separate lint command.

The game opens on a title screen with the stack logo and controls. Enter the Stack reveals a view facing the character, then transitions to its follow camera on movement. Respawn and teleport reset position, velocity, heading, and camera focus together; no falling-frame camera data is used after the reset. The bottom teleport dock provides direct access to Frontend, Backend, Database, Cloud, and Launch. The bottom **Press E to read more** prompt opens exhibits; nearby signs pulse in lavender.

### Current Frontend design direction

The complete Frontend redesign supersedes the earlier scene ideas. Keep the world focused on a spacious ascending route of actual UI objects: browser ramps, thin tabs, 3D apps, a faster curved moving cursor ride, two groups of three opening folders whose hinged covers form stairs, a push-operated toggle seesaw, spinner carousel, blocking pop-ups, and climbable HTML structures. The vertical progression supports later worlds above Frontend. Do not restore the fallen computer, escaping decorative apps, side dock, app shelves, decorative folder diorama, lift scaffolding, surrounding screens, wires, or generic stepping stones. Preserve the character, controls, physics, camera, checkpoints, and portfolio exhibits.

Frontend now spans roughly 200 units, with six opening folders in two stair sections and wider separation between major UI objects. Later world origins move together to preserve their existing internal routes.

Folder covers use shorter 3.2-unit panels. Keep their entire hinge sweep (including tabs) separate from neighboring folders and from both ends of the cursor ride. `tests/frontend-clearance.spec.ts` checks that clearance; the gameplay test also boards the cursor itself instead of standing on a neighboring flap.

`BrowserObjects.tsx` models the browser ramps/windows and solid, shaped tab obstacles. Keep browser controls and tab silhouettes recognizable in 3D; do not restore blank cream slabs or wafer-thin rectangular tab platforms. Tab and dropdown-option colliders match their 3D bodies.

The giant toggle is a 16-unit rocker: advancing pushes its thumb and tips the far end upward for the higher carousel jump. Its fulcrum stays fixed. The dropdown opens beside the course on approach; its options must leave the exit clear.

The music block, tan palette disc, circular save-file disc, and Publish button are removed. The second folder staircase now connects directly to the final browser/tab section; do not restore those removed obstacles.

Frontend models follow actual UI silhouettes and appropriate material thickness: thin folder covers and paper inserts, a segmented loader with an empty center, a hollow settings cog, a camera-shaped icon. Do not add generic box pedestals or filled discs beneath these symbols. Shared geometry in `frontendShapes.ts` defines both visible shapes and collision surfaces; the hollow centers remain open in physics.

The cursor shuttle uses a 4.2-second round trip: 0.9 seconds at each stop and 1.2 seconds per crossing, with no extra hidden pause at the start.

Settings cogs use rounded rectangular teeth, a smooth circular hub, and a larger open center in neutral gray. Keep the first browser ramp and trash lid visibly separated; the nearby cog is offset to preserve space on both sides of the bin.

The taller toggle has a pill-shaped housing, an actual recessed channel, and a raised, rounded pushable thumb. `toggleGeometry.ts` supplies the same cavity and button surfaces to rendering and physics. Keep the thumb inside the channel throughout OFF/ON travel; do not replace the rim with a filled rectangular collider or substitute a painted track for the real recess.

The blocking pop-up says “Uh oh! Popup in the way.” It reverses along its entry path with eased motion, returning to the same parked side; its loop boundary must never teleport it across the course.

Two platforms in the final Frontend section are real 3D checkboxes. They start empty, fill mint green, and pop in a white checkmark after a landing. Checks remain earned after a fall and clear when starting a fresh Frontend journey. Side collisions alone do not check them.

The old scrollbar elevator is now a 3D dropdown: approaching opens its options and turns the chevron. Step onto the selected “Next scene” option to ride to the higher platform. Options unfold down from the selector on the right of the course, leaving the typography platforms and exit clear.

`DropdownLift.tsx` models the selector, unfolding options, rotating chevrons, and selected rideable row. The software-rendered browser checks use a smaller desktop viewport to limit rendering cost.

The final Frontend platform is a native-style 3D color picker with a saturation/value field, rainbow hue slider, selection rings, swatch, and HEX readout. Walking on the field or hue bar changes the selected color; the surrounding world and character keep their own colors.

The Frontend toggle now has a raised, rounded thumb with matching collision geometry. Push against its OFF-facing side to slide it toward ON and raise the seesaw exit by over three units. Walking along the rim or standing on the thumb does not drive the mechanism; the taller fulcrum keeps the full tilt visually clear.


## Immersive stack worlds

`src/data/stackJourney.ts` defines the new routes; `StackObjects.tsx` supplies actual object models, and `StackScenes.tsx` supplies the large surrounding scenes. Frontend keeps its existing UI course. No new dependencies or external assets are needed.

- **Backend:** request gateway, climbable server racks, moving queue conveyors, opening authentication scanners, rounded transport pipes, memory caches, a server-scaling lift, and a 200 OK exit. Large server halls and request belts frame the course.
- **Database:** interactive record grids, layered storage stacks, hexagonal shards, physically linked tables, a rising index drawer, replica banks, and a commit seal. Oversized filing cabinets, an open record drawer, and a central vault form the surrounding archive.
- **Cloud:** ribbed containers, tapered object-storage buckets, solar-panel satellites, load balancers, an autoscaling lift, and region rooftops. Floating data centers, communication dishes, cloud foundations, and container clusters surround the route; cloud scenery remains exclusive to this world.
- **Launch:** artifact packages, build rollers, touch-activated test badges, release gates, a cargo crane, and an elevated deployment pad. The rocket uses its existing countdown, liftoff, and celebration inside a larger launch gantry, with mission control beside it. Deploy is only available within range of the final pad.

Objects light up after a real top landing. Gates open on approach; record tables track the player's row. Elevator rides reuse the existing moving-platform controller with a 3.2-unit rise. `stackGeometry.ts` shares curved pipe, bucket, and shard geometry with their colliders. Large decorative structures sit beside the path. Distant course visuals and scenes are culled while collision bodies remain stable. Checkpoint IDs, saved-stage storage, avatar, camera controls, and Frontend movement are retained.

Run `npm exec playwright test tests/stack-layout.spec.ts` for jump-clearance and shape checks. `STACK_ONLY=1 npm exec playwright test tests/course.spec.ts -- --grep "play the continuous"` starts the physical traversal at Backend and continues through the rocket finale; omit the environment flag to include Frontend.

## Backend Data Factory

Backend now has a collectable JWT, a physical authentication laser gate, a validation pad, three endpoint choices, a rate-limit conveyor that cools down after contact, and a server repaired by walking over three separate switches. Its 200 OK exit only unlocks when token, validation, correct endpoint, and all three repairs are complete. Puzzle progress survives a fall and clears on a fresh journey. The original Backend checkpoint and Database transition stay in place.

`backendFactory.ts` holds puzzle state, dashboard content, and proximity checks. `BackendFactory.tsx` adds barriers, token and switch visuals, rack-mounted fans, instanced signals inside conduits, processing arms, container/cache/queue/microservice machines, a load balancer, WebSocket towers, and live simulated monitoring. Existing belts carry glowing JSON parcels in Backend. Approaching the four technology dashboards exposes the normal E prompt; the existing accessible modal presents the content and pauses movement. Project descriptions distinguish documented FastAPI work from illustrative architecture concepts.

`BACKEND_ONLY=1 npm exec playwright test tests/course.spec.ts -- --grep "play the continuous"` checks all four panels, token pickup, endpoint selection, repair switches, finish unlock, and the Database checkpoint using actual movement. `tests/backend-factory.spec.ts` covers unlock prerequisites, reset behavior, and dashboard proximity.

The color picker sits near the start of Frontend, with checkboxes near the end. One opening browser ramp leads to a larger color-picker platform; the second opening browser platform is removed. The first folder steps are spaced to keep the new jumps reachable. Each browser has one active tab, and the narrow hop tabs retain their original single silhouette. `FrontendBackdrop.tsx` frames the route with an open desktop-shell landscape, oversized keyboards, open file folders, and component clusters; these landmarks sit outside the playable path. No clouds or surrounding text screens are added.

The Frontend seesaw is now a longer 16-unit pastel-rose control with a seven-unit support. Its maximum tilt is 0.65 radians, giving almost five units of lift without an excessively steep walking surface. The blue loading spinner is raised to y=16.3 and positioned just beyond the raised end; its height above the unraised knob exceeds four units, so pushing the slider is required. The spinner uses twelve fading, rounded pill segments with an empty center. `loadingBarGeometry` supplies the same rounded surfaces to rendering and convex collision shapes. `tests/seesaw-loader.spec.ts` checks the height relationship and rounded ends; `FRONTEND_ONLY=1` runs the actual Frontend traversal.

Frontend backdrop now uses recognizable UI widgets: search fields with carets, an open theme dropdown, animated appearance sliders, saved/notification toasts, a selectable-looking color palette, profile cards, and a calendar. The abstract component columns and oversized decorative boards are removed. Existing keyboard and file-folder landmarks remain, and all background components stay outside the playable path.

## Playable UI additions

Frontend includes two oversized rounded `<button>` controls. A real top landing depresses their kinematic caps, changes their color, and triggers an expanding ripple and eight sparks; leaving releases the cap. Fixed bases remain in place. The `<div>` platform is removed from the main course; the expanded popup connects the spinner to the clock. The optional `<section>` platform is also removed.

The typography side path has three actual extruded glyph platforms in sans, serif, and display typefaces. Their triangle colliders preserve the letter silhouettes and holes. Landing on a glyph changes the floating Aa preview and highlights the selected style. This path branches off the main giant button and reconnects to the dropdown area, with an extra button available on the side path. Optional objects do not inflate main-route progress. Font subsets and their licenses are bundled locally (`uiTypefaces.json`, `UI-TYPEFACE-LICENSES.txt`); no font service or new dependency is required.

`UIPlayground.tsx` contains the visual models, button effects, fixed bases, and typography preview. `uiPlaygroundGeometry.ts` shares rounded button and extruded letter geometry with physics. The existing character controller, checkpoints, and other worlds are retained. `tests/ui-playground.spec.ts` checks the geometry and route content; the Frontend playthrough checks actual button depression and selection of all three fonts.


The extra side-path button is removed. The camera obstacle is replaced by the pink second button, so both buttons now belong to the main route. The dropdown is one inline menu with a protruding final “Next scene” option as its actual physics lift; there is no detached selected-field platform or separate menu beside it. Approaching starts a repeating ten-second cycle: two seconds down, three retracting upward, two at the top, and three dropping back down. The panel and upper options expand with the same moving last row. Timing pauses with the game and the cycle continues without needing another landing. `dropdownRide` and `tests/dropdown-cycle.spec.ts` define and verify its smooth, repeated timing.

Frontend is now titled Creative Workshop. Its background workstations anchor the UI displays with warm wooden benches, storage shelves, task lamps, pencil cups, rulers, wireframe sketchbooks, color-swatch trays, and typography pieces. `CreativeWorkshop.tsx` supplies the reusable scenery; tabletop colliders match the visible work surfaces. All stations remain beside the main route.

Dropdown options now appear and disappear in a staggered spring animation with uniform scaling and a slight tilt, preserving the text and card proportions. The panel also pops as a whole instead of stretching vertically. Reduced-motion mode switches visibility directly. The rideable option has an 0.8-unit body, a wider top bezel, and a matching deeper collider; its top height and ride cycle are unchanged.

The workshop desks and attached lamps, tools, shelves, and tabletop colliders are removed. Frontend keeps its Creative Workshop title and its UI-component background scenery.

The existing world-display dialogs now include five My Journey chapters based on the portfolio’s supplied experience and project information. Frontend connects teaching and interface work; Backend connects Omal, Oracle, and API work; Database connects Studyday and Oracle data work; Cloud connects UMIACS infrastructure experience; the launch completion dialog closes with robotics research and ongoing learning. `journey.ts` holds the editable chapter content, and `JourneyChapter.tsx` renders it. Existing project details remain available, and no additional scenery boards are introduced.

### Interactive journey and background UI

The course includes 18 small E story markers across the five worlds. Each connects the nearby obstacle to a specific example from Lily’s projects, teaching, research, or engineering experience. Markers follow moving platforms and turn green after reading. Existing entrance stories and backend technical panels remain available.

Frontend side scenery is clickable: keyboard keys depress, folders open and close, search fields type a greeting, theme menus select options, sliders adjust, palette swatches select, calendar dates highlight, profile cards toggle their demo follow state, and notifications dismiss and restore. Hovering a nearby widget also exposes its related E story. These are local visual interactions and add no physics colliders or external account actions.

### Journey signs (current)

The 18 route-side story markers are now physical, automatically readable signs rather than E interactions. Each uses a short example checked against LilyUreta_2027 (2).pdf, including Omal, Coding With Kids, Technica, SisterToSister, Oracle, UMIACS, robotics research, and Zoo Baby. Signs sit outside the jumping route, stay stationary beside moving obstacles, and face the camera horizontally for readability. They add no physics colliders. Background widgets still respond to clicks; hovering them no longer opens an E story prompt. Original portfolio entrance interactions and technical panels remain available.

### Cleaner world scenery

Backend no longer renders the full-length conduits, floating packet trails, wall traces, overhead wiring, or decorative wireframe cages. Server racks are grouped into three spaced exhibits. Database cabinets are spaced into two paired scenes; isolated exit props are removed. Cloud keeps its region stations, satellite, and world-specific clouds while dropping the loose crate stack. Launch replaces the dangling crane with a compact artifact display. The four worlds share softer pastel materials; playable platform geometry, puzzle barriers, checkpoints, and movement are unchanged.

### Compact journey popups (current)

Journey signs now use small route-side cards labeled with the example name and “Press E to read.” On the associated obstacle, the existing bottom E control opens a popup with the company/project name first, followed by its date/context and resume-backed description. The large text boards are removed. Prompts follow live obstacle positions without adding colliders. Portfolio entrance and backend technical-panel prompts keep their priority.

### Tile surface depth fix

Trash and Settings app tiles use a recessed shell whose top is 0.1 units below the colored inset. Previously both top faces occupied y=0, causing camera-dependent depth fighting. The shell bottom, inset height, glyphs, and physics collider stay in place. The unused HTML tile model received the same surface separation.

Journey prompts now name their local concept (for example, BROWSER → REACT, COLOR → BRANDING, and AUTH GATE → SIGN-IN) and use actions such as “Explore UI design” or “Follow an API request.” Each popup explicitly connects that component to the named resume example before its detailed description.

Journey prompt cards now use world-anchored HTML with scene occlusion rather than solid 3D boards. Their anchors sit 2.5 units beyond the platform edge and 2.5 units above the surface; nearby scenery hides a blocked prompt. They only mount near the player, do not capture pointer input, and stay below HUD/modal layers. The bottom E control remains available even when a world card is occluded.

The four legacy Backend explanation boards (FastAPI, REST APIs, Docker architecture, and Authentication) and their proximity/E handlers are removed. Compact resume journey popups replace them; live puzzle instructions and gate status displays remain.

The third portfolio project and Cloud-world exhibit now feature Capital One Banking Demo (https://github.com/lureta/capital-one-demo). Copy was checked against its README, App.jsx, and bankApi.js: React, Cognito/OIDC, API Gateway, account creation, balance loading, deposits, withdrawals, and integer-cent requests. No live deployment URL is supplied by the repository, so the entry links to GitHub only.

### Current journey interaction design

Compact 3D sign prompts are restored. Each reserves space for the whole sign, checks nearby visible mesh bounds, and chooses a clear side/height; a sign hides if no candidate is clear while its bottom E control remains available. World geometry uses normal depth testing. The HTML prompt overlays are removed. Story popups retain the example name first, remove the introductory analogy paragraph, and provide two fuller paragraphs about the work and its connection to that world. Cloud also includes the Capital One Banking Demo example.
