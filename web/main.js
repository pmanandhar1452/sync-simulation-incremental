import { ThreeJSRenderer } from './ThreeJSRenderer.js';

// Simple concept implementations for the web
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
}

class WebSimulationConcept {
    constructor() {
        this.simulations = new Map();
        this.isRunning = true;
        this.time = 0;
        this.speed = 1;
        this.stepSize = 0.01;
        console.log('WebSimulationConcept initialized');
    }

    create({ id, time, speed, stepSize }) {
        this.time = time;
        this.speed = speed;
        this.stepSize = stepSize;
        console.log(`Simulation created: ${id}`, { time, speed, stepSize });
        return { id };
    }

    step({ id }) {
        if (this.isRunning) {
            this.time += this.stepSize * this.speed;
        }
        return { id };
    }

    pause({ id }) {
        this.isRunning = false;
        console.log('Simulation paused');
        return { id };
    }

    resume({ id }) {
        this.isRunning = true;
        console.log('Simulation resumed');
        return { id };
    }

    setSpeed({ id, speed }) {
        this.speed = speed;
        console.log(`Simulation speed set to: ${speed}`);
        return { id };
    }

    reset({ id }) {
        this.time = 0;
        console.log('Simulation reset');
        return { id };
    }

    _getById({ id }) {
        return [{
            id,
            time: this.time,
            speed: this.speed,
            paused: !this.isRunning,
            stepSize: this.stepSize
        }];
    }
}

class WebCameraConcept {
    constructor(renderer) {
        this.renderer = renderer;
        this.cameras = new Map();
        console.log('WebCameraConcept initialized');
    }

    create({ id, scene, position, target, fov, near, far, type }) {
        const camera = { id, scene, position, target, fov, near, far, type };
        this.cameras.set(id, camera);
        console.log(`Camera created: ${id}`, { position, target });
        return { id };
    }

    follow({ id, bodyId, distance }) {
        console.log(`Camera following: ${bodyId} at distance: ${distance}`);
        this.renderer.setCameraTarget(bodyId);
        return { id };
    }

    zoom({ id, factor }) {
        console.log(`Camera zoom: ${factor}`);
        this.renderer.setZoom(factor);
        return { id };
    }
}

// Main application class
class SolarSystemApp {
    constructor() {
        console.log('SolarSystemApp constructor called');
        
        this.canvas = document.getElementById('canvas');
        console.log('Canvas element:', this.canvas);
        
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        console.log('Creating ThreeJSRenderer...');
        this.renderer = new ThreeJSRenderer(this.canvas);
        console.log('ThreeJSRenderer created');
        
        // Initialize concepts
        console.log('Initializing concepts...');
        this.celestialBody = new WebCelestialBodyConcept(this.renderer);
        this.simulation = new WebSimulationConcept();
        this.camera = new WebCameraConcept(this.renderer);
        console.log('Concepts initialized');
        
        this.setupControls();
        this.initializeSolarSystem();
        this.startSimulation();
    }

    setupControls() {
        console.log('Setting up controls...');
        const speedSlider = document.getElementById('speed');
        const speedValue = document.getElementById('speedValue');
        const playPauseBtn = document.getElementById('playPause');
        const resetBtn = document.getElementById('reset');
        const cameraSelect = document.getElementById('cameraTarget');
        const zoomSlider = document.getElementById('zoom');
        const zoomValue = document.getElementById('zoomValue');

        // Speed control
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed + 'x';
            this.simulation.setSpeed({ id: 'main', speed });
        });

        // Play/Pause control
        playPauseBtn.addEventListener('click', () => {
            if (this.simulation.isRunning) {
                this.simulation.pause({ id: 'main' });
                playPauseBtn.textContent = 'Resume';
                document.getElementById('status').textContent = 'Paused';
            } else {
                this.simulation.resume({ id: 'main' });
                playPauseBtn.textContent = 'Pause';
                document.getElementById('status').textContent = 'Running';
            }
        });

        // Reset control
        resetBtn.addEventListener('click', () => {
            this.simulation.reset({ id: 'main' });
        });

        // Camera target control
        cameraSelect.addEventListener('change', (e) => {
            this.camera.follow({ id: 'main', bodyId: e.target.value, distance: 50 });
        });

        // Zoom control
        zoomSlider.addEventListener('input', (e) => {
            const zoom = parseFloat(e.target.value);
            zoomValue.textContent = zoom + 'x';
            this.camera.zoom({ id: 'main', factor: zoom });
        });
        
        console.log('Controls setup complete');
    }

    async initializeSolarSystem() {
        console.log('=== INITIALIZING SOLAR SYSTEM ===');

        // Create simulation
        console.log('Creating simulation...');
        this.simulation.create({ id: 'main', time: 0, speed: 1, stepSize: 0.01 });

        // Create camera
        console.log('Creating camera...');
        this.camera.create({
            id: 'main',
            scene: 'main',
            position: { x: 0, y: 50, z: 100 },
            target: { x: 0, y: 0, z: 0 },
            fov: 75,
            near: 0.1,
            far: 1000,
            type: 'perspective'
        });

        // Create the Sun
        console.log('Creating Sun...');
        this.celestialBody.create({
            id: 'sun',
            name: 'Sun',
            type: 'star',
            mass: 1.989e30,
            radius: 696340,
            distance: 0,
            orbitalPeriod: 0,
            rotationPeriod: 25.05,
            color: '#ffff00',
            parent: ''
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

        // Set initial camera position to see the sun
        console.log('Setting camera to follow sun...');
        this.camera.follow({ id: 'main', bodyId: 'sun', distance: 100 });

        console.log('=== SOLAR SYSTEM INITIALIZATION COMPLETE ===');
        console.log('Bodies created:', this.celestialBody.bodies.size);
        console.log('All bodies:', Array.from(this.celestialBody.bodies.keys()));
    }

    startSimulation() {
        console.log('Starting simulation loop...');
        
        const updateInfo = () => {
            const simData = this.simulation._getById({ id: 'main' })[0];
            if (simData) {
                document.getElementById('time').textContent = Math.floor(simData.time) + ' days';
                document.getElementById('status').textContent = simData.paused ? 'Paused' : 'Running';
            }
        };

        const simulationLoop = () => {
            // Step simulation
            this.simulation.step({ id: 'main' });
            
            // Update all planet positions
            const simData = this.simulation._getById({ id: 'main' })[0];
            if (simData) {
                const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
                planets.forEach(planetId => {
                    this.celestialBody.orbit({ id: planetId, time: simData.time });
                });
            }

            // Update info display
            updateInfo();

            // Continue loop
            if (this.simulation.isRunning) {
                requestAnimationFrame(simulationLoop);
            }
        };

        // Start the simulation loop
        simulationLoop();
        console.log('Simulation loop started');
    }
}

// Initialize the application when the page loads
window.addEventListener('load', () => {
    console.log('=== PAGE LOADED ===');
    console.log('Starting Solar System App...');
    try {
        new SolarSystemApp();
        console.log('SolarSystemApp created successfully');
    } catch (error) {
        console.error('Error starting Solar System App:', error);
    }
});
