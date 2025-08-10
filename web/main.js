import { ThreeJSRenderer } from './ThreeJSRenderer.js';

// Web-specific concept implementations that interact with Three.js
class WebCelestialBodyConcept {
    constructor(renderer) {
        this.renderer = renderer;
        this.bodies = new Map();
        console.log('WebCelestialBodyConcept initialized');
    }

    create({ id, name, type, mass, radius, distance, orbitalPeriod, inclination, rotationPeriod, color, parent }) {
        console.log(`Creating celestial body: ${name} (${id})`, { type, distance, inclination, color });
        
        const bodyData = {
            id, name, type, mass, radius, distance, orbitalPeriod, inclination, rotationPeriod, color, parent,
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 }
        };
        
        this.bodies.set(id, bodyData);
        console.log(`Calling renderer.createBody for ${name}`);
        this.renderer.createBody(bodyData);
        console.log(`Created ${name} (${id}) at position:`, bodyData.position);
        console.log(`Total bodies: ${this.bodies.size}`);
        return { id };
    }

    updatePosition({ id, position }) {
        const body = this.bodies.get(id);
        if (body) {
            body.position = position;
            this.renderer.updateBodyPosition(id, position, { x: 1, y: 1, z: 1 });
        }
        return { id };
    }

    orbit({ id, time }) {
        const body = this.bodies.get(id);
        if (body && body.parent) {
            const angle = (2 * Math.PI * time) / body.orbitalPeriod;
            const inclination = (body.inclination || 0) * Math.PI / 180; // Convert degrees to radians
            
            // Calculate position in orbital plane
            const x = body.distance * Math.cos(angle);
            const z = body.distance * Math.sin(angle);
            
            // Apply inclination rotation around X-axis
            const y = z * Math.sin(inclination);
            const z_final = z * Math.cos(inclination);
            
            body.position = { x, y, z: z_final };
            this.renderer.updateBodyPosition(id, body.position, { x: 1, y: 1, z: 1 });
        }
        return { id };
    }

    _getById({ id }) {
        const body = this.bodies.get(id);
        return body ? [body] : [];
    }

    _getByType({ type }) {
        return Array.from(this.bodies.values()).filter(body => body.type === type);
    }

    getAllBodies() {
        return Array.from(this.bodies.values());
    }
}

class WebSimulationConcept {
    constructor() {
        this.simulations = new Map();
        this.currentTime = 0;
        this.speed = 1.0;
        this.paused = false;
        this.lastUpdate = Date.now();
        console.log('WebSimulationConcept initialized');
    }

    create({ id, time, speed, paused, stepSize }) {
        console.log(`Creating simulation: ${id}`, { time, speed, paused, stepSize });
        const simData = { id, time, speed, paused, stepSize };
        this.simulations.set(id, simData);
        this.currentTime = time;
        this.speed = speed;
        this.paused = paused;
        return { id };
    }

    setSpeed({ id, speed }) {
        const sim = this.simulations.get(id);
        if (sim) {
            sim.speed = speed;
            this.speed = speed;
        }
        return { id };
    }

    pause({ id }) {
        const sim = this.simulations.get(id);
        if (sim) {
            sim.paused = true;
            this.paused = true;
        }
        return { id };
    }

    resume({ id }) {
        const sim = this.simulations.get(id);
        if (sim) {
            sim.paused = false;
            this.paused = false;
        }
        return { id };
    }

    step({ id }) {
        const sim = this.simulations.get(id);
        if (sim && !sim.paused) {
            sim.time += sim.stepSize * sim.speed;
            this.currentTime = sim.time;
        }
        return { id };
    }

    reset({ id }) {
        const sim = this.simulations.get(id);
        if (sim) {
            sim.time = 0;
            this.currentTime = 0;
        }
        return { id };
    }

    getState() {
        return {
            currentTime: this.currentTime,
            speed: this.speed,
            paused: this.paused
        };
    }
}

class WebCameraConcept {
    constructor(renderer) {
        this.renderer = renderer;
        this.cameras = new Map();
        console.log('WebCameraConcept initialized');
    }

    create({ id, scene, position, target, fov, near, far, type, controlsEnabled, minDistance, maxDistance }) {
        console.log(`Creating camera: ${id}`, { position, target, fov });
        const cameraData = { id, scene, position, target, fov, near, far, type, controlsEnabled, minDistance, maxDistance };
        this.cameras.set(id, cameraData);
        return { id };
    }

    setTarget({ id, target }) {
        const camera = this.cameras.get(id);
        if (camera) {
            camera.target = target;
            this.renderer.setCameraTarget(target);
        }
        return { id };
    }

    setZoom({ id, zoom }) {
        const camera = this.cameras.get(id);
        if (camera) {
            this.renderer.setZoom(zoom);
        }
        return { id };
    }

    getState() {
        return Array.from(this.cameras.values())[0] || {};
    }
}

// Main application class
class SolarSystemApp {
    constructor() {
        this.renderer = new ThreeJSRenderer();
        this.celestialBody = new WebCelestialBodyConcept(this.renderer);
        this.simulation = new WebSimulationConcept();
        this.camera = new WebCameraConcept(this.renderer);
        
        this.animationId = null;
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = Date.now();
        
        console.log('SolarSystemApp initialized');
        this.init();
    }

    init() {
        console.log('Initializing Solar System App...');
        
        // Initialize the solar system
        this.initializeSolarSystem();
        
        // Set up UI controls
        this.setupUIControls();
        
        // Start the simulation loop
        this.startSimulation();
        
        console.log('Solar System App initialization complete');
    }

    initializeSolarSystem() {
        console.log('Creating solar system...');
        
        // Create main simulation
        this.simulation.create({
            id: 'sim_main',
            time: 0,
            speed: 1.0,
            paused: false,
            stepSize: 1
        });

        // Create Sun
        console.log('Creating Sun...');
        this.celestialBody.create({
            id: 'sun',
            name: 'Sun',
            type: 'star',
            mass: 1.989e30,
            radius: 696340,
            distance: 0,
            orbitalPeriod: 0,
            inclination: 0,
            rotationPeriod: 25,
            color: '#ffff00',
            parent: null
        });

        // Create planets
        const planets = [
            { id: 'mercury', name: 'Mercury', distance: 30, orbitalPeriod: 88, inclination: 7.0, color: '#8c7853' },
            { id: 'venus', name: 'Venus', distance: 50, orbitalPeriod: 224.7, inclination: 3.4, color: '#e7cdcd' },
            { id: 'earth', name: 'Earth', distance: 70, orbitalPeriod: 365.25, inclination: 0.0, color: '#0077be' },
            { id: 'mars', name: 'Mars', distance: 90, orbitalPeriod: 687, inclination: 1.9, color: '#c1440e' },
            { id: 'jupiter', name: 'Jupiter', distance: 120, orbitalPeriod: 4333, inclination: 1.3, color: '#d8ca9d' },
            { id: 'saturn', name: 'Saturn', distance: 150, orbitalPeriod: 10759, inclination: 2.5, color: '#ead6b8' },
            { id: 'uranus', name: 'Uranus', distance: 180, orbitalPeriod: 30687, inclination: 0.8, color: '#d1e7dd' },
            { id: 'neptune', name: 'Neptune', distance: 210, orbitalPeriod: 60190, inclination: 1.8, color: '#4b70dd' }
        ];

        for (const planet of planets) {
            console.log(`Creating planet: ${planet.name}`);
            this.celestialBody.create({
                id: planet.id,
                name: planet.name,
                type: 'planet',
                mass: 5.97e24,
                radius: 6371,
                distance: planet.distance,
                orbitalPeriod: planet.orbitalPeriod,
                inclination: planet.inclination,
                rotationPeriod: 1,
                color: planet.color,
                parent: 'sun'
            });
        }

        // Set initial camera target to Sun
        this.camera.setTarget({ id: 'camera_main', target: 'sun' });
    }

    setupUIControls() {
        console.log('Setting up UI controls...');
        
        // Speed control
        const speedControl = document.getElementById('speedControl');
        const speedValue = document.getElementById('speedValue');
        
        speedControl.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.simulation.setSpeed({ id: 'sim_main', speed });
            speedValue.textContent = `${speed.toFixed(1)}x`;
        });

        // Play/Pause button
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.addEventListener('click', () => {
            if (this.simulation.paused) {
                this.simulation.resume({ id: 'sim_main' });
                playPauseBtn.textContent = '⏸️ Pause';
            } else {
                this.simulation.pause({ id: 'sim_main' });
                playPauseBtn.textContent = '▶️ Play';
            }
        });

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => {
            this.simulation.reset({ id: 'sim_main' });
        });

        // Camera target selection
        const cameraTarget = document.getElementById('cameraTarget');
        cameraTarget.addEventListener('change', (e) => {
            this.camera.setTarget({ id: 'camera_main', target: e.target.value });
        });

        // Zoom control
        const zoomControl = document.getElementById('zoomControl');
        const zoomValue = document.getElementById('zoomValue');
        
        zoomControl.addEventListener('input', (e) => {
            const zoom = parseInt(e.target.value);
            this.camera.setZoom({ id: 'camera_main', zoom });
            zoomValue.textContent = `${zoom}%`;
        });
    }

    startSimulation() {
        console.log('Starting simulation loop...');
        this.animate();
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            this.updateInfoDisplay();
        }

        // Step simulation
        this.simulation.step({ id: 'sim_main' });

        // Update planet positions
        const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        for (const planetId of planets) {
            this.celestialBody.orbit({ id: planetId, time: this.simulation.currentTime });
        }

        // Render the scene
        this.renderer.animate();
    }

    updateInfoDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        const fpsDisplay = document.getElementById('fpsDisplay');
        const objectsDisplay = document.getElementById('objectsDisplay');

        if (timeDisplay) {
            const days = Math.floor(this.simulation.currentTime);
            timeDisplay.textContent = `${days} days`;
        }

        if (fpsDisplay) {
            fpsDisplay.textContent = this.fps;
        }

        if (objectsDisplay) {
            objectsDisplay.textContent = this.celestialBody.bodies.size;
        }
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.renderer.dispose();
    }
}

// Initialize the application
console.log('Starting Solar System Application...');
try {
    window.solarSystemApp = new SolarSystemApp();
    console.log('Solar System Application started successfully');
} catch (error) {
    console.error('Failed to start Solar System Application:', error);
}
