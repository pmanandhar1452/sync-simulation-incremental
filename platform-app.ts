import { SyncConcept } from "./engine/mod.ts";
import { UserConcept } from "./concepts/UserConcept.ts";
import { ProjectConcept } from "./concepts/ProjectConcept.ts";
import { SimulationTypeConcept } from "./concepts/SimulationTypeConcept.ts";
import { APIConcept } from "./concepts/APIConcept.ts";
import { CelestialBodyConcept } from "./concepts/CelestialBodyConcept.ts";
import { RendererConcept } from "./concepts/RendererConcept.ts";
import { SimulationConcept } from "./concepts/SimulationConcept.ts";
import { CameraConcept } from "./concepts/CameraConcept.ts";

// Initialize the sync engine
const Sync = new SyncConcept();

// Register all concepts
const concepts = {
    User: new UserConcept(),
    Project: new ProjectConcept(),
    SimulationType: new SimulationTypeConcept(),
    API: new APIConcept(),
    CelestialBody: new CelestialBodyConcept(),
    Renderer: new RendererConcept(),
    Simulation: new SimulationConcept(),
    Camera: new CameraConcept(),
};

// Instrument concepts for reactivity
const { User, Project, SimulationType, API, CelestialBody, Renderer, Simulation, Camera } = Sync.instrument(concepts);

// Initialize the platform
function initializePlatform() {
    console.log("Initializing Simulation Platform...");

    // Register simulation types
    SimulationType.register({
        id: "solar-system",
        name: "Solar System",
        description: "Interactive solar system simulation with realistic orbital mechanics",
        category: "astronomy",
        icon: "🌞",
        thumbnail: "/thumbnails/solar-system.jpg",
        defaultConfig: {
            speed: 1.0,
            showOrbits: true,
            showLabels: true
        },
        requirements: {
            threejs: true,
            webgl: true
        },
        version: "1.0"
    });

    // Create a default guest user
    User.createGuest({ id: "guest_default" });

    console.log("Platform initialized successfully!");
}

// Run the platform
initializePlatform();

// Export for use in web interface
export { Sync, User, Project, SimulationType, API, CelestialBody, Renderer, Simulation, Camera };
