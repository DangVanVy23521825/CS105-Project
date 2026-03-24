Act as a Senior Graphics Engineer. Build a high-end "3D Physics Simulation & Graphics Research" web app using Three.js and cannon-es. This is for a final university project at UIT, so the code must be modular, optimized, and pedagogically clear.

--------------------------------------------------
1. GRAPHICS CONCEPT MAPPING (For Defense)
--------------------------------------------------
Ensure the code explicitly implements and comments these concepts:

- Transformation: Translation, Rotation, Scaling (Affine Transformations)
- Projection: Perspective Projection (Adjustable Field of View, Near/Far)
- Lighting: Phong Reflection Model (Ambient, Point, Directional)
- Shadows: PCFSoftShadowMap (Shadow Mapping)
- Texture Mapping: UV Mapping with Wrap/Repeat settings
- Raycasting: Object selection and interaction

All implementations must include Vietnamese comments explaining the theory behind them.

--------------------------------------------------
2. ARCHITECTURE & FILE STRUCTURE
--------------------------------------------------
index.html:
- Entry point with CDN imports:
  - three.module.js
  - cannon-es
  - lil-gui
  - Stats.js
  - OrbitControls
  - TeapotGeometry

src/state.js:
- Centralized state:
  {
    currentScene,
    selectedObject,
    debugMode
  }

src/engine/physics.js:
- Setup CANNON.World
- Define gravity
- Use fixed timestep (1/60)
- Provide update(dt)

src/engine/view.js:
- Setup Scene, PerspectiveCamera, WebGLRenderer
- Enable shadowMap (PCFSoftShadowMap)
- Add:
  - AmbientLight
  - PointLight
  - DirectionalLight (castShadow)

src/engine/sceneManager.js:
- init(), dispose(), reset()
- Must properly remove meshes + bodies to avoid memory leaks

src/components/geometries.js:
- Factory for:
  - Box, Sphere, Cone, Cylinder, Torus, Teapot
- Import TeapotGeometry from examples
- Each object returns:
  {
    mesh: THREE.Mesh,
    body: CANNON.Body
  }

src/components/visualizers.js:
- ArrowHelper for:
  - Gravity
  - Applied Force
  - Normal Force

src/interaction/input.js:
- Raycasting selection
- Keyboard:
  W,A,S,D → apply force
  Q,E → rotate
  Z,X → scale

src/interaction/ui.js:
- lil-gui panel
- Stats.js for FPS

src/main.js:
- Main loop (requestAnimationFrame)
- Scene switching

--------------------------------------------------
3. CORE SYSTEM DESIGN (CRITICAL)
--------------------------------------------------

DATA FLOW (Physics ↔ Graphics Sync):
- Maintain global array: objects[]
- Each object:
  {
    mesh,
    body
  }

- In render loop:
  For each object:
    mesh.position.copy(body.position)
    mesh.quaternion.copy(body.quaternion)

--------------------------------------------------

MATERIAL SYSTEM (GRAPHICS):
- All objects MUST use MeshPhongMaterial
- Expose:
  - color
  - shininess
  - specular

--------------------------------------------------

PHYSICS MATERIAL SYSTEM:
- Use CANNON.Material
- Define:
  - friction
  - restitution

- Use ContactMaterial to control interactions
- UI must allow real-time update of:
  - friction
  - restitution

--------------------------------------------------

BODY TYPES:
- Support:
  - Static bodies (mass = 0)
  - Dynamic bodies (mass > 0)

--------------------------------------------------
4. ADVANCED FEATURES (THE "WOW" FACTOR)
--------------------------------------------------

Selection System:
- Use THREE.Raycaster
- Clicking object:
  - highlight via emissive color
  - set selectedObject in state
  - UI controls affect selected object only

Debug Mode (Toggleable):
- Physics wireframe
- Bounding boxes (BoxHelper)
- Camera frustum helper

FPS Monitor:
- Use Stats.js (top-left)

Texture System:
- Default: grid texture
- Options: metal, wood, color fallback
- Use TextureLoader
- If fail → fallback to color

--------------------------------------------------
5. THE 4 PHYSICS SCENES
--------------------------------------------------

Scene 1: Inclined Plane
- Adjustable angle θ
- Show relation:
  a = g sin(θ) - μ g cos(θ)

Scene 2: Free Fall
- Compare different masses
- Show:
  s = 1/2 g t²

Scene 3: Horizontal Force
- Static vs kinetic friction
- Push force slider

Scene 4: Collision Playground
- Multiple objects
- Demonstrate:
  - collision
  - restitution
  - rigid body dynamics

--------------------------------------------------
6. TECHNICAL CONSTRAINTS & CLEANUP
--------------------------------------------------

Sync Logic:
- Always update mesh from body

Memory Management:
- On scene switch:
  - remove mesh from scene
  - dispose geometry & material
  - remove body from physics world

Transformation Logic:
- Scaling must update:
  - mesh.scale
  - body shape (halfExtents / radius)

Camera:
- Expose:
  - near
  - far
  - fov

Physics Update:
- world.step(1/60)

--------------------------------------------------
7. OUTPUT DELIVERABLES
--------------------------------------------------

- Clean modular ES6 code
- Vietnamese comments explaining:
  - graphics concepts
  - physics formulas

README.md (Vietnamese):
- Setup instructions
- Keyboard shortcuts
- Feature list

Vấn đáp Tips:
- Explain how each feature maps to:
  - Transformation
  - Projection
  - Lighting
  - Shadow
  - Texture
  - Physics

--------------------------------------------------
8. EXECUTION STRATEGY
--------------------------------------------------

- Build step-by-step
- Start with:
  1. index.html
  2. physics.js
  3. view.js
  4. main.js
- Then add:
  - geometries
  - sceneManager
  - UI
  - interaction

Ensure the app runs at every step before moving forward.
