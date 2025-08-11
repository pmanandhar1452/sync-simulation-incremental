console.log('🚀 User app JavaScript loading...');

import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';

// Global state
let scene, camera, renderer, controls;
let bodies = new Map();
let currentUser = null;
let currentToken = null;
let isGuest = false;
let simulationData = {};
let isPlaying = true;
let animationSpeed = 1;

// Solar System Configuration Data
const solarSystemConfigs = {
    default: {
        sun: { size: 5, color: 0xffff00, name: 'Sun' },
        planets: [
            { name: 'Mercury', size: 0.8, distance: 10, color: 0x8c7853, speed: 0.04, moons: [] },
            { name: 'Venus', size: 1.2, distance: 15, color: 0xffd700, speed: 0.015, moons: [] },
            { name: 'Earth', size: 1.5, distance: 20, color: 0x0077be, speed: 0.01, moons: [
                { name: 'Moon', size: 0.4, distance: 3, color: 0xcccccc, speed: 0.03 }
            ]},
            { name: 'Mars', size: 1.2, distance: 25, color: 0xff6b35, speed: 0.008, moons: [
                { name: 'Phobos', size: 0.2, distance: 2, color: 0x8b7355, speed: 0.05 },
                { name: 'Deimos', size: 0.15, distance: 2.5, color: 0x696969, speed: 0.04 }
            ]},
            { name: 'Jupiter', size: 3, distance: 35, color: 0xffa500, speed: 0.002, moons: [
                { name: 'Io', size: 0.6, distance: 4, color: 0xffd700, speed: 0.02 },
                { name: 'Europa', size: 0.5, distance: 5, color: 0x87ceeb, speed: 0.015 },
                { name: 'Ganymede', size: 0.7, distance: 6, color: 0x8b4513, speed: 0.012 },
                { name: 'Callisto', size: 0.6, distance: 7, color: 0x696969, speed: 0.01 }
            ]},
            { name: 'Saturn', size: 2.5, distance: 45, color: 0xffd700, speed: 0.0009, moons: [
                { name: 'Titan', size: 0.8, distance: 4, color: 0xffa500, speed: 0.008 },
                { name: 'Enceladus', size: 0.3, distance: 3, color: 0xffffff, speed: 0.015 }
            ]},
            { name: 'Uranus', size: 2, distance: 55, color: 0x40e0d0, speed: 0.0004, moons: [
                { name: 'Miranda', size: 0.2, distance: 3, color: 0x8b7355, speed: 0.02 },
                { name: 'Ariel', size: 0.4, distance: 4, color: 0x87ceeb, speed: 0.015 }
            ]},
            { name: 'Neptune', size: 2, distance: 65, color: 0x4169e1, speed: 0.0001, moons: [
                { name: 'Triton', size: 0.6, distance: 4, color: 0x87ceeb, speed: 0.01 }
            ]}
        ]
    },
    inner: {
        sun: { size: 5, color: 0xffff00, name: 'Sun' },
        planets: [
            { name: 'Mercury', size: 0.8, distance: 10, color: 0x8c7853, speed: 0.04, moons: [] },
            { name: 'Venus', size: 1.2, distance: 15, color: 0xffd700, speed: 0.015, moons: [] },
            { name: 'Earth', size: 1.5, distance: 20, color: 0x0077be, speed: 0.01, moons: [
                { name: 'Moon', size: 0.4, distance: 3, color: 0xcccccc, speed: 0.03 }
            ]},
            { name: 'Mars', size: 1.2, distance: 25, color: 0xff6b35, speed: 0.008, moons: [
                { name: 'Phobos', size: 0.2, distance: 2, color: 0x8b7355, speed: 0.05 },
                { name: 'Deimos', size: 0.15, distance: 2.5, color: 0x696969, speed: 0.04 }
            ]}
        ]
    },
    outer: {
        sun: { size: 5, color: 0xffff00, name: 'Sun' },
        planets: [
            { name: 'Jupiter', size: 3, distance: 35, color: 0xffa500, speed: 0.002, moons: [
                { name: 'Io', size: 0.6, distance: 4, color: 0xffd700, speed: 0.02 },
                { name: 'Europa', size: 0.5, distance: 5, color: 0x87ceeb, speed: 0.015 },
                { name: 'Ganymede', size: 0.7, distance: 6, color: 0x8b4513, speed: 0.012 },
                { name: 'Callisto', size: 0.6, distance: 7, color: 0x696969, speed: 0.01 }
            ]},
            { name: 'Saturn', size: 2.5, distance: 45, color: 0xffd700, speed: 0.0009, moons: [
                { name: 'Titan', size: 0.8, distance: 4, color: 0xffa500, speed: 0.008 },
                { name: 'Enceladus', size: 0.3, distance: 3, color: 0xffffff, speed: 0.015 }
            ]},
            { name: 'Uranus', size: 2, distance: 55, color: 0x40e0d0, speed: 0.0004, moons: [
                { name: 'Miranda', size: 0.2, distance: 3, color: 0x8b7355, speed: 0.02 },
                { name: 'Ariel', size: 0.4, distance: 4, color: 0x87ceeb, speed: 0.015 }
            ]},
            { name: 'Neptune', size: 2, distance: 65, color: 0x4169e1, speed: 0.0001, moons: [
                { name: 'Triton', size: 0.6, distance: 4, color: 0x87ceeb, speed: 0.01 }
            ]}
        ]
    }
};



// Initialize the application
function init() {
    console.log('Initializing application...');
    setupThreeJS();
    setupEventListeners();
    loadPublicSimulations();
    console.log('Application initialized successfully');
}

// Setup Three.js scene
function setupThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);

    // Create renderer
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Setup orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create default solar system
    createSolarSystem('default');

    // Start animation loop
    animate();
}

// Create solar system based on configuration
function createSolarSystem(configName) {
    // Clear existing bodies
    bodies.forEach(body => {
        scene.remove(body);
    });
    bodies.clear();

    const config = solarSystemConfigs[configName];
    if (!config) {
        console.error('Invalid configuration:', configName);
        return;
    }

    // Create sun
    const sunGeometry = new THREE.SphereGeometry(config.sun.size, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: config.sun.color });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    bodies.set('sun', sun);

    // Create planets and their moons
    config.planets.forEach(planet => {
        // Create planet
        const planetGeometry = new THREE.SphereGeometry(planet.size, 32, 32);
        const planetMaterial = new THREE.MeshBasicMaterial({ color: planet.color });
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Set initial position
        planetMesh.position.set(planet.distance, 0, 0);
        scene.add(planetMesh);
        bodies.set(planet.name.toLowerCase(), planetMesh);

        // Create moons
        planet.moons.forEach(moon => {
            const moonGeometry = new THREE.SphereGeometry(moon.size, 32, 32);
            const moonMaterial = new THREE.MeshBasicMaterial({ color: moon.color });
            const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
            
            // Set initial position relative to planet
            moonMesh.position.set(planet.distance + moon.distance, 0, 0);
            scene.add(moonMesh);
            bodies.set(moon.name.toLowerCase(), moonMesh);
        });
    });

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Update camera target options
    updateCameraTargetOptions();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (isPlaying) {
        const time = Date.now() * 0.001 * animationSpeed;
        
        // Animate planets and moons
        solarSystemConfigs.default.planets.forEach(planet => {
            const planetMesh = bodies.get(planet.name.toLowerCase());
            if (planetMesh) {
                // Planet orbit
                planetMesh.position.x = Math.cos(time * planet.speed) * planet.distance;
                planetMesh.position.z = Math.sin(time * planet.speed) * planet.distance;
                planetMesh.rotation.y += 0.01;

                // Moon orbits
                planet.moons.forEach(moon => {
                    const moonMesh = bodies.get(moon.name.toLowerCase());
                    if (moonMesh) {
                        const planetPos = planetMesh.position.clone();
                        moonMesh.position.x = planetPos.x + Math.cos(time * moon.speed) * moon.distance;
                        moonMesh.position.z = planetPos.z + Math.sin(time * moon.speed) * moon.distance;
                        moonMesh.rotation.y += 0.02;
                    }
                });
            }
        });
    }

    controls.update();
    renderer.render(scene, camera);
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Speed control
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            animationSpeed = parseFloat(e.target.value);
            speedValue.textContent = animationSpeed + 'x';
        });
    }
    
    // Play/Pause control
    const playPauseBtn = document.getElementById('playPause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    // Reset control
    const resetBtn = document.getElementById('reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSimulation);
    }
    
    // Camera target control
    const cameraTarget = document.getElementById('cameraTarget');
    if (cameraTarget) {
        cameraTarget.addEventListener('change', (e) => {
            focusCamera(e.target.value);
        });
    }
    
    // Zoom control
    const zoomSlider = document.getElementById('zoom');
    const zoomValue = document.getElementById('zoomValue');
    if (zoomSlider && zoomValue) {
        zoomSlider.addEventListener('input', (e) => {
            const zoom = parseFloat(e.target.value);
            camera.position.set(0, 50 * zoom, 100 * zoom);
            zoomValue.textContent = zoom + 'x';
        });
    }
    
    // Configuration controls
    setupConfigurationListeners();
    
    // Setup button listeners
    setupButtonListeners();
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    console.log('Event listeners set up successfully');
}

// Setup configuration event listeners
function setupConfigurationListeners() {
    const systemPreset = document.getElementById('systemPreset');
    const applyConfigBtn = document.getElementById('applyConfigBtn');
    const resetConfigBtn = document.getElementById('resetConfigBtn');
    const customConfig = document.getElementById('customConfig');
    const addPlanetBtn = document.getElementById('addPlanetBtn');
    const addMoonBtn = document.getElementById('addMoonBtn');
    
    if (systemPreset) {
        systemPreset.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customConfig.style.display = 'block';
            } else {
                customConfig.style.display = 'none';
            }
        });
    }
    
    if (applyConfigBtn) {
        applyConfigBtn.addEventListener('click', () => {
            const selectedConfig = systemPreset ? systemPreset.value : 'default';
            createSolarSystem(selectedConfig);
        });
    }
    
    if (resetConfigBtn) {
        resetConfigBtn.addEventListener('click', () => {
            if (systemPreset) {
                systemPreset.value = 'default';
                customConfig.style.display = 'none';
            }
            createSolarSystem('default');
        });
    }
    
    if (addPlanetBtn) {
        addPlanetBtn.addEventListener('click', addCustomPlanet);
    }
    
    if (addMoonBtn) {
        addMoonBtn.addEventListener('click', addCustomMoon);
    }
}

// Add custom planet
function addCustomPlanet() {
    const container = document.getElementById('planets-container');
    if (!container) return;
    
    const planetDiv = document.createElement('div');
    planetDiv.className = 'body-item';
    planetDiv.innerHTML = `
        <div class="body-item-header">
            <span class="body-item-name">New Planet</span>
            <button class="remove-body" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
        <div class="body-controls">
            <label>Name: <input type="text" value="New Planet"></label>
            <label>Size: <input type="range" min="0.1" max="5" value="1" step="0.1"></label>
            <label>Distance: <input type="range" min="5" max="100" value="20" step="1"></label>
            <label>Speed: <input type="range" min="0.001" max="0.1" value="0.01" step="0.001"></label>
        </div>
    `;
    container.appendChild(planetDiv);
}

// Add custom moon
function addCustomMoon() {
    const container = document.getElementById('moons-container');
    if (!container) return;
    
    const moonDiv = document.createElement('div');
    moonDiv.className = 'body-item';
    moonDiv.innerHTML = `
        <div class="body-item-header">
            <span class="body-item-name">New Moon</span>
            <button class="remove-body" onclick="this.parentElement.parentElement.remove()">Remove</button>
        </div>
        <div class="body-controls">
            <label>Name: <input type="text" value="New Moon"></label>
            <label>Size: <input type="range" min="0.1" max="2" value="0.5" step="0.1"></label>
            <label>Distance: <input type="range" min="1" max="10" value="3" step="0.5"></label>
            <label>Speed: <input type="range" min="0.001" max="0.1" value="0.02" step="0.001"></label>
        </div>
    `;
    container.appendChild(moonDiv);
}

// Update camera target options based on available bodies
function updateCameraTargetOptions() {
    const cameraTarget = document.getElementById('cameraTarget');
    if (!cameraTarget) return;
    
    // Clear existing options
    cameraTarget.innerHTML = '';
    
    // Add sun option
    const sunOption = document.createElement('option');
    sunOption.value = 'sun';
    sunOption.textContent = 'Sun';
    cameraTarget.appendChild(sunOption);
    
    // Add planet options
    solarSystemConfigs.default.planets.forEach(planet => {
        const planetOption = document.createElement('option');
        planetOption.value = planet.name.toLowerCase();
        planetOption.textContent = planet.name;
        cameraTarget.appendChild(planetOption);
    });
}

// Setup button event listeners
function setupButtonListeners() {
    console.log('Setting up button listeners...');
    
    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab') || e.target.textContent.toLowerCase().replace(/\s+/g, '');
            if (e.target.closest('#auth-panel')) {
                showTab(tabName);
            } else if (e.target.closest('#simulation-panel')) {
                showSimTab(tabName);
            }
        });
    });

    // Guest button
    const guestBtn = document.getElementById('startGuestBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', startAsGuest);
    }

    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }

    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', register);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Save simulation button
    const saveBtn = document.getElementById('saveSimulationBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSimulation);
    }

    // Search input
    const searchInput = document.getElementById('loadSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', searchSimulations);
    }

    console.log('Button listeners set up successfully');
}

// Focus camera on target
function focusCamera(target) {
    const body = bodies.get(target);
    if (body) {
        controls.target.copy(body.position);
        controls.update();
    }
}

// Toggle play/pause
function togglePlayPause() {
    const btn = document.getElementById('playPause');
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        btn.textContent = 'Pause';
    } else {
        btn.textContent = 'Play';
    }
}

// Reset simulation
function resetSimulation() {
    // Reset camera position
    camera.position.set(0, 50, 100);
    controls.target.set(0, 0, 0);
    controls.update();
    
    // Reset simulation state
    createSolarSystem('default');
    
    // Reset controls
    const speedSlider = document.getElementById('speed');
    const speedValue = document.getElementById('speedValue');
    if (speedSlider && speedValue) {
        speedSlider.value = 1;
        speedValue.textContent = '1x';
        animationSpeed = 1;
    }
    
    const zoomSlider = document.getElementById('zoom');
    const zoomValue = document.getElementById('zoomValue');
    if (zoomSlider && zoomValue) {
        zoomSlider.value = 1;
        zoomValue.textContent = '1x';
    }
    
    const cameraTarget = document.getElementById('cameraTarget');
    if (cameraTarget) {
        cameraTarget.value = 'sun';
    }
    
    const systemPreset = document.getElementById('systemPreset');
    if (systemPreset) {
        systemPreset.value = 'default';
    }
    
    const customConfig = document.getElementById('customConfig');
    if (customConfig) {
        customConfig.style.display = 'none';
    }
}

// Tab management
function showTab(tabName) {
    console.log('Showing tab:', tabName);
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');
    console.log('Tab switched to:', tabName);
}

function showSimTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('#simulation-panel .tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('#simulation-panel .tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    event.target.classList.add('active');

    // Load data for specific tabs
    if (tabName === 'load' && currentUser) {
        loadUserSimulations();
    } else if (tabName === 'public') {
        loadPublicSimulations();
    }
}

// Authentication functions
function startAsGuest() {
    console.log('Starting as guest...');
    isGuest = true;
    currentUser = { username: 'Guest' };
    showUserInterface();
    console.log('Guest mode activated');
}

async function register() {
    console.log('📝 Attempting registration...');
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const messageDiv = document.getElementById('registerMessage');

    console.log('Registration attempt for username:', username, 'email:', email);

    if (!username || !email || !password) {
        showMessage(messageDiv, 'Please fill in all fields', 'error');
        return;
    }

    try {
        console.log('Making registration API request...');
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response data:', data);

        if (data.success) {
            console.log('✅ Registration successful - User ID:', data.userId);
            showMessage(messageDiv, 'Registration successful! Please login.', 'success');
            showTab('login');
        } else {
            console.log('❌ Registration failed:', data.error);
            showMessage(messageDiv, data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(messageDiv, `Network error: ${error.message}`, 'error');
    }
}

async function login() {
    console.log('🔐 Attempting login...');
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    console.log('Login attempt for username:', username);

    if (!username || !password) {
        showMessage(messageDiv, 'Please enter username and password', 'error');
        return;
    }

    try {
        console.log('Making login API request...');
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);

        if (data.success) {
            currentUser = { id: data.userId, username };
            currentToken = data.token;
            console.log('✅ Login successful - User ID:', data.userId, 'Token:', data.token);
            showMessage(messageDiv, 'Login successful!', 'success');
            showUserInterface();
            loadUserSimulations();
        } else {
            console.log('❌ Login failed:', data.error);
            showMessage(messageDiv, data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(messageDiv, `Network error: ${error.message}`, 'error');
    }
}

function logout() {
    currentUser = null;
    currentToken = null;
    isGuest = false;
    showAuthInterface();
}

// UI management
function showUserInterface() {
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('user-panel').style.display = 'block';
    document.getElementById('userDisplayName').textContent = currentUser.username;
}

function showAuthInterface() {
    document.getElementById('auth-panel').style.display = 'block';
    document.getElementById('user-panel').style.display = 'none';
}

// Simulation management
async function saveSimulation() {
    console.log('🔄 Attempting to save simulation...');
    console.log('Current user:', currentUser);
    console.log('Is guest:', isGuest);
    console.log('Current token:', currentToken ? 'Present' : 'Missing');

    if (isGuest) {
        showMessage(document.getElementById('saveMessage'), 'Please login to save simulations', 'error');
        return;
    }

    if (!currentUser || !currentToken) {
        showMessage(document.getElementById('saveMessage'), 'Please login to save simulations', 'error');
        return;
    }

    const name = document.getElementById('saveName').value;
    const description = document.getElementById('saveDescription').value;
    const isPublic = document.getElementById('savePublic').checked;
    const messageDiv = document.getElementById('saveMessage');

    console.log('Save parameters:', { name, description, isPublic });

    if (!name) {
        showMessage(messageDiv, 'Please enter a simulation name', 'error');
        return;
    }

    // Capture current simulation state
    const simulationState = {
        bodies: Array.from(bodies.entries()).map(([name, body]) => ({
            name,
            position: body.position.toArray(),
            rotation: body.rotation.toArray(),
            scale: body.scale.toArray()
        })),
        camera: {
            position: camera.position.toArray(),
            target: controls.target.toArray()
        },
        timestamp: Date.now()
    };

    console.log('Simulation state captured:', simulationState);

    const requestBody = {
        userId: currentUser.id,
        name,
        description,
        simulationData: simulationState,
        isPublic
    };

    console.log('Request body:', requestBody);

    try {
        console.log('Making API request to /api/simulations/save...');
        const response = await fetch('/api/simulations/save', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            showMessage(messageDiv, 'Simulation saved successfully!', 'success');
            document.getElementById('saveName').value = '';
            document.getElementById('saveDescription').value = '';
            document.getElementById('savePublic').checked = false;
            loadUserSimulations();
        } else {
            showMessage(messageDiv, data.error || 'Failed to save simulation', 'error');
        }
    } catch (error) {
        console.error('Save simulation error:', error);
        showMessage(messageDiv, `Network error: ${error.message}`, 'error');
    }
}

async function loadUserSimulations() {
    if (!currentUser) return;

    try {
        const response = await fetch(`/api/simulations/list?userId=${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });

        const data = await response.json();
        displaySimulations(data.simulations || [], 'userSimulations');
    } catch (error) {
        console.error('Failed to load user simulations:', error);
    }
}

async function loadPublicSimulations() {
    try {
        const response = await fetch('/api/simulations/public');
        const data = await response.json();
        displaySimulations(data.simulations || [], 'publicSimulations');
    } catch (error) {
        console.error('Failed to load public simulations:', error);
    }
}

function displaySimulations(simulations, containerId) {
    const container = document.getElementById(containerId);
    
    if (simulations.length === 0) {
        container.innerHTML = '<p>No simulations found.</p>';
        return;
    }

    container.innerHTML = simulations.map(sim => `
        <div class="simulation-item" onclick="loadSimulation('${sim.id}')">
            <h4>${sim.name}</h4>
            <p>${sim.description || 'No description'}</p>
            <p><small>Created: ${new Date(sim.createdAt).toLocaleDateString()}</small></p>
        </div>
    `).join('');
}

async function loadSimulation(simulationId) {
    try {
        const response = await fetch(`/api/simulations/load?storageId=${simulationId}&userId=${currentUser?.id || 'guest'}`, {
            headers: currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}
        });

        const data = await response.json();
        if (data.success) {
            applySimulationState(data.simulationData);
            showMessage(document.getElementById('saveMessage'), 'Simulation loaded successfully!', 'success');
        } else {
            showMessage(document.getElementById('saveMessage'), data.error || 'Failed to load simulation', 'error');
        }
    } catch (error) {
        showMessage(document.getElementById('saveMessage'), 'Network error. Please try again.', 'error');
    }
}

function applySimulationState(simulationData) {
    // Apply body positions and rotations
    simulationData.bodies.forEach(bodyData => {
        const body = bodies.get(bodyData.name);
        if (body) {
            body.position.fromArray(bodyData.position);
            body.rotation.fromArray(bodyData.rotation);
            body.scale.fromArray(bodyData.scale);
        }
    });

    // Apply camera position and target
    if (simulationData.camera) {
        camera.position.fromArray(simulationData.camera.position);
        controls.target.fromArray(simulationData.camera.target);
        controls.update();
    }
}

function searchSimulations() {
    const searchTerm = document.getElementById('loadSearch').value.toLowerCase();
    const simulationItems = document.querySelectorAll('#userSimulations .simulation-item');
    
    simulationItems.forEach(item => {
        const title = item.querySelector('h4').textContent.toLowerCase();
        const description = item.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Utility functions
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = type;
    setTimeout(() => {
        element.textContent = '';
        element.className = '';
    }, 5000);
}



// Add error handler
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
});

// Add a test function to verify everything is working
window.testButtons = () => {
    console.log('🧪 Testing buttons...');
    console.log('showTab function:', typeof showTab);
    console.log('startAsGuest function:', typeof startAsGuest);
    console.log('login function:', typeof login);
    console.log('register function:', typeof register);
    console.log('logout function:', typeof logout);
    console.log('saveSimulation function:', typeof saveSimulation);
    
    // Test if elements exist
    console.log('startGuestBtn element:', document.getElementById('startGuestBtn'));
    console.log('loginBtn element:', document.getElementById('loginBtn'));
    console.log('registerBtn element:', document.getElementById('registerBtn'));
    console.log('logoutBtn element:', document.getElementById('logoutBtn'));
    console.log('saveSimulationBtn element:', document.getElementById('saveSimulationBtn'));
    
    console.log('✅ Button test complete');
};

// Initialize the application
init();
