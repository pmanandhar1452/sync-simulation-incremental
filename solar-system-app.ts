import {
    Logging,
    SyncConcept,
} from "./engine/mod.ts";

import { APIConcept } from "./concepts/APIConcept.ts";
import { CelestialBodyConcept } from "./concepts/CelestialBodyConcept.ts";
import { RendererConcept } from "./concepts/RendererConcept.ts";
import { SimulationConcept } from "./concepts/SimulationConcept.ts";
import { CameraConcept } from "./concepts/CameraConcept.ts";
import { createSolarSystemSyncs } from "./syncs/solar-system.ts";

// Create new Sync engine
const Sync = new SyncConcept();
Sync.logging = Logging.TRACE;

// Register concepts
const concepts = {
    API: new APIConcept(),
    CelestialBody: new CelestialBodyConcept(),
    Renderer: new RendererConcept(),
    Simulation: new SimulationConcept(),
    Camera: new CameraConcept(),
};

// All concepts must be instrumented to be reactive and used in a sync
const { API, CelestialBody, Renderer, Simulation, Camera } = Sync.instrument(concepts);

// Create synchronizations
const syncs = createSolarSystemSyncs(API, CelestialBody, Renderer, Simulation, Camera);

// Register syncs
Sync.register(syncs);

// Initialize the solar system
async function initializeSolarSystem() {
    console.log("Initializing Solar System Simulation...");

    // Create the main simulation
    await Simulation.create({ id: "main", time: 0, speed: 1, stepSize: 0.01 });

    // Create the main renderer scene
    await Renderer.createScene({ 
        id: "main", 
        canvas: "canvas", 
        width: 800, 
        height: 600, 
        backgroundColor: "#000011" 
    });

    // Create the main camera
    await Camera.create({ 
        id: "main", 
        scene: "main", 
        position: { x: 0, y: 50, z: 100 }, 
        target: { x: 0, y: 0, z: 0 }, 
        fov: 75, 
        near: 0.1, 
        far: 1000, 
        type: "perspective" 
    });

    // Create the Sun
    await CelestialBody.create({
        id: "sun",
        name: "Sun",
        type: "star",
        mass: 1.989e30,
        radius: 696340,
        distance: 0,
        orbitalPeriod: 0,
        rotationPeriod: 25.05,
        color: "#ffff00",
        parent: ""
    });

    // Create planets (simplified data)
    const planets = [
        { id: "mercury", name: "Mercury", distance: 57.9e6, orbitalPeriod: 88, color: "#8c7853" },
        { id: "venus", name: "Venus", distance: 108.2e6, orbitalPeriod: 224.7, color: "#e7cdcd" },
        { id: "earth", name: "Earth", distance: 149.6e6, orbitalPeriod: 365.25, color: "#0077be" },
        { id: "mars", name: "Mars", distance: 227.9e6, orbitalPeriod: 687, color: "#c1440e" },
        { id: "jupiter", name: "Jupiter", distance: 778.5e6, orbitalPeriod: 4333, color: "#d8ca9d" },
        { id: "saturn", name: "Saturn", distance: 1.434e9, orbitalPeriod: 10759, color: "#ead6b8" },
        { id: "uranus", name: "Uranus", distance: 2.871e9, orbitalPeriod: 30687, color: "#d1e7dd" },
        { id: "neptune", name: "Neptune", distance: 4.495e9, orbitalPeriod: 60190, color: "#4b70dd" }
    ];

    for (const planet of planets) {
        await CelestialBody.create({
            id: planet.id,
            name: planet.name,
            type: "planet",
            mass: 5.97e24, // Simplified mass
            radius: 6371, // Simplified radius
            distance: planet.distance,
            orbitalPeriod: planet.orbitalPeriod,
            rotationPeriod: 1,
            color: planet.color,
            parent: "sun"
        });
    }

    console.log("Solar System initialized successfully!");
}

// Run the simulation
async function runSimulation() {
    console.log("Starting simulation...");
    
    // Run for 100 steps to see the planets move
    for (let i = 0; i < 100; i++) {
        await Simulation.step({ id: "main" });
        
        // Add a small delay to see the movement
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log("Simulation completed!");
}

// Main function
async function main() {
    try {
        await initializeSolarSystem();
        await runSimulation();
    } catch (error) {
        console.error("Error in solar system simulation:", error);
    }
}

// Run the application
if (import.meta.main) {
    main();
}

export { Sync, concepts, API, CelestialBody, Renderer, Simulation, Camera };
