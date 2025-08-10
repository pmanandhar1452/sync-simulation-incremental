import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';

export class ThreeJSRenderer {
    constructor(canvas) {
        console.log('ThreeJSRenderer constructor called with canvas:', canvas);
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        console.log('Scene created with background color');

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 50, 100);
        console.log('Camera created at position:', this.camera.position);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        console.log('Renderer created and configured');

        // Initialize properties
        this.bodies = new Map();
        this.orbits = new Map();
        this.controls = null;
        this.animationId = null;
        this.targetBody = 'sun';
        this.zoomLevel = 1;
        console.log('Properties initialized');

        // Add lighting
        this.setupLighting();
        console.log('Lighting setup complete');

        // Setup orbit controls
        this.setupOrbitControls();
        console.log('Orbit controls setup complete');

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
        console.log('Animation loop started');
    }

    setupOrbitControls() {
        // Create orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure controls
        this.controls.enableDamping = true; // Add smooth damping
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 10; // Minimum zoom distance
        this.controls.maxDistance = 500; // Maximum zoom distance
        this.controls.maxPolarAngle = Math.PI; // Allow full rotation
        
        // Set initial target to origin (sun)
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        
        console.log('Orbit controls configured');
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);
        console.log('Ambient light added');

        // Sun light (point light at origin)
        const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        console.log('Sun light added');

        // Directional light for better overall illumination
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(100, 100, 100);
        this.scene.add(directionalLight);
        console.log('Directional light added');
    }

    createBody(bodyData) {
        console.log('=== CREATING BODY ===');
        console.log('Body data:', bodyData);
        console.log('Current scene children:', this.scene.children.length);
        
        // Create geometry based on body type
        let geometry;
        let material;

        if (bodyData.type === 'star') {
            // Sun - use larger sphere with emissive material
            geometry = new THREE.SphereGeometry(20, 32, 32); // Fixed size for sun
            material = new THREE.MeshBasicMaterial({ 
                color: bodyData.color,
                emissive: bodyData.color,
                emissiveIntensity: 0.5
            });
            console.log('Created sun geometry and material');
        } else {
            // Planets - use visible sizes (not to scale)
            const planetSizes = {
                'mercury': 3,
                'venus': 4,
                'earth': 4.5,
                'mars': 3.5,
                'jupiter': 12,
                'saturn': 10,
                'uranus': 7,
                'neptune': 7
            };
            const size = planetSizes[bodyData.id] || 4;
            geometry = new THREE.SphereGeometry(size, 32, 32);
            material = new THREE.MeshLambertMaterial({ 
                color: bodyData.color,
                transparent: true,
                opacity: 0.9
            });
            console.log(`Created planet geometry and material for ${bodyData.name}, size: ${size}`);
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(bodyData.position.x, bodyData.position.y, bodyData.position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        console.log(`Mesh created for ${bodyData.name} at position:`, mesh.position);

        // Store the mesh
        this.bodies.set(bodyData.id, mesh);
        this.scene.add(mesh);
        console.log(`Added ${bodyData.name} to scene. Scene children: ${this.scene.children.length}`);

        // Create orbit line for planets
        if (bodyData.type === 'planet' && bodyData.parent) {
            this.createOrbit(bodyData);
            console.log(`Created orbit for ${bodyData.name}`);
        }

        console.log(`=== BODY CREATION COMPLETE: ${bodyData.name} ===`);
        return mesh;
    }

    createOrbit(bodyData) {
        const orbitGeometry = new THREE.BufferGeometry();
        const points = [];
        
        // Get inclination in radians
        const inclination = (bodyData.inclination || 0) * Math.PI / 180;
        
        // Create orbit circle with inclination
        const segments = 64;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = bodyData.distance * Math.cos(angle);
            const z = bodyData.distance * Math.sin(angle);
            
            // Apply inclination rotation around X-axis
            const y = z * Math.sin(inclination);
            const z_final = z * Math.cos(inclination);
            
            points.push(new THREE.Vector3(x, y, z_final));
        }
        
        orbitGeometry.setFromPoints(points);
        
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: 0x888888,  // Much brighter gray
            transparent: true,
            opacity: 0.7       // Much more opaque
        });
        
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        this.orbits.set(bodyData.id, orbit);
        this.scene.add(orbit);
        console.log(`Orbit added for ${bodyData.id} with inclination ${bodyData.inclination}°, scene children: ${this.scene.children.length}`);
    }

    updateBodyPosition(bodyId, position, scale) {
        const mesh = this.bodies.get(bodyId);
        if (mesh) {
            mesh.position.set(position.x, position.y, position.z);
            mesh.scale.set(scale.x, scale.y, scale.z);
            console.log(`Updated position for ${bodyId}:`, position);
        } else {
            console.warn(`Mesh not found for body: ${bodyId}`);
        }
    }

    setCameraTarget(bodyId) {
        console.log(`Setting camera target to: ${bodyId}`);
        this.targetBody = bodyId;
        const mesh = this.bodies.get(bodyId);
        if (mesh) {
            // Update orbit controls target to the body's position
            this.controls.target.copy(mesh.position);
            this.controls.update();
            console.log(`Camera target set to ${bodyId} at:`, mesh.position);
        } else {
            console.warn(`Body not found for camera target: ${bodyId}`);
        }
    }

    setZoom(zoom) {
        this.zoomLevel = zoom;
        // Update orbit controls zoom
        const currentDistance = this.camera.position.distanceTo(this.controls.target);
        const newDistance = currentDistance / zoom;
        this.controls.dollyIn(newDistance / currentDistance);
        this.controls.update();
        console.log(`Zoom set to: ${zoom}`);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate bodies on their axes
        this.bodies.forEach((mesh, bodyId) => {
            if (bodyId !== 'sun') {
                mesh.rotation.y += 0.01;
            }
        });

        // Update orbit controls
        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.controls) {
            this.controls.dispose();
        }
        this.renderer.dispose();
    }

    getRenderer() {
        return this.renderer;
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }
}
