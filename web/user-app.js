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

    // Create basic solar system
    createBasicSolarSystem();

    // Start animation loop
    animate();
}

// Create a basic solar system
function createBasicSolarSystem() {
    // Sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    bodies.set('sun', sun);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ color: 0x0077be });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(20, 0, 0);
    scene.add(earth);
    bodies.set('earth', earth);

    // Add some lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 1, 1000);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate bodies
    const earth = bodies.get('earth');
    if (earth) {
        earth.rotation.y += 0.01;
        earth.position.x = Math.cos(Date.now() * 0.001) * 20;
        earth.position.z = Math.sin(Date.now() * 0.001) * 20;
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
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed + 'x';
            // Update simulation speed here
        });
    }

    // Zoom control
    const zoomSlider = document.getElementById('zoom');
    const zoomValue = document.getElementById('zoomValue');
    if (zoomSlider && zoomValue) {
        zoomSlider.addEventListener('input', (e) => {
            const zoom = parseFloat(e.target.value);
            zoomValue.textContent = zoom + 'x';
            camera.position.setLength(100 / zoom);
        });
    }

    // Camera target
    const cameraTarget = document.getElementById('cameraTarget');
    if (cameraTarget) {
        cameraTarget.addEventListener('change', (e) => {
            const target = e.target.value;
            focusCamera(target);
        });
    }

    // Play/Pause button
    const playPauseBtn = document.getElementById('playPause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // Reset button
    const resetBtn = document.getElementById('reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSimulation);
    }

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Setup button event listeners
    setupButtonListeners();
    
    console.log('Event listeners set up successfully');
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
    if (btn.textContent === 'Pause') {
        btn.textContent = 'Play';
        // Pause simulation
    } else {
        btn.textContent = 'Pause';
        // Resume simulation
    }
}

// Reset simulation
function resetSimulation() {
    // Reset all bodies to initial positions
    const earth = bodies.get('earth');
    if (earth) {
        earth.position.set(20, 0, 0);
        earth.rotation.set(0, 0, 0);
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
