# Solar System Simulation

A 3D solar system simulation built using Three.js and the concept design architecture. This project demonstrates how to build a complex interactive application using concepts and synchronizations.

## Features

- **3D Solar System Visualization**: Real-time 3D rendering of the solar system with the Sun and all 8 planets
- **Accurate Orbital Mechanics**: Planets orbit the Sun with realistic periods and distances
- **Interactive Controls**: 
  - Adjust simulation speed
  - Pause/Resume simulation
  - Reset to beginning
  - Change camera target (follow different planets)
  - Zoom in/out
- **Concept-Based Architecture**: Built using the concept design pattern with independent, modular components

## Architecture

The simulation is built using five main concepts:

1. **CelestialBody**: Manages celestial bodies (planets, sun) with their physical properties and orbital calculations
2. **Renderer**: Handles Three.js rendering and 3D scene management
3. **Simulation**: Controls time, speed, and physics calculations
4. **Camera**: Manages camera positioning and controls
5. **API**: Handles web interface requests and responses

These concepts are connected through synchronizations that define how they interact:

- When a celestial body is created, it's automatically added to the renderer
- When simulation time changes, all planet positions are updated
- When body positions change, the renderer updates the 3D scene
- When simulation steps, the scene is re-rendered

## Running the Simulation

### Web Version (Recommended)

1. **Start a local web server** in the project directory:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Node.js
   npx http-server
   
   # Or using Deno
   deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:8000/web/
   ```

3. **Use the controls** in the top-left panel:
   - **Speed**: Adjust simulation speed (0-10x)
   - **Pause/Resume**: Control simulation playback
   - **Reset**: Return to day 0
   - **Camera Target**: Choose which planet to follow
   - **Zoom**: Adjust camera zoom level

### Command Line Version

You can also run the concept-based version directly:

```bash
deno run --allow-net solar-system-app.ts
```

This will run the simulation in the console, demonstrating the concept interactions.

## Controls

- **Speed Slider**: Control how fast time passes in the simulation
- **Pause/Resume Button**: Stop or continue the simulation
- **Reset Button**: Return all planets to their starting positions
- **Camera Target Dropdown**: Choose which celestial body to follow
- **Zoom Slider**: Adjust the camera zoom level

## Technical Details

### Concept Specifications

The simulation uses concept specifications (`.concept` files) to define the behavior of each component:

- `specs/CelestialBody.concept`: Defines celestial body properties and orbital mechanics
- `specs/Renderer.concept`: Defines 3D rendering capabilities
- `specs/Simulation.concept`: Defines time and physics control
- `specs/Camera.concept`: Defines camera positioning and controls
- `specs/API.concept`: Defines web interface endpoints

### Implementation

- **TypeScript Concepts**: `concepts/` directory contains the TypeScript implementations
- **Synchronizations**: `syncs/solar-system.ts` contains the logic that connects concepts
- **Three.js Renderer**: `web/ThreeJSRenderer.ts` handles the actual 3D rendering
- **Web Interface**: `web/` directory contains the HTML and JavaScript for the web version

### Data

The simulation uses simplified but realistic data:
- **Distances**: Actual astronomical distances (scaled for visualization)
- **Orbital Periods**: Real orbital periods in Earth days
- **Colors**: Representative colors for each planet
- **Sizes**: Scaled for visibility (not to scale)

## Extending the Simulation

You can easily extend the simulation by:

1. **Adding new celestial bodies**: Create new concept instances with different properties
2. **Adding moons**: Extend the orbital calculations to include satellite bodies
3. **Improving physics**: Add gravitational interactions between planets
4. **Adding textures**: Use real planetary textures instead of solid colors
5. **Adding rings**: Special rendering for Saturn's rings
6. **Adding asteroids**: Include asteroid belt objects

## Dependencies

- **Three.js**: 3D graphics library
- **Deno**: Runtime for the concept system
- **Modern Browser**: For WebGL support

## Browser Compatibility

The web version requires:
- WebGL support
- ES6 modules support
- Modern JavaScript features

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
