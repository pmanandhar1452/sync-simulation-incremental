// Platform JavaScript - Handles user authentication, project management, and simulation selection

class PlatformApp {
    constructor() {
        console.log('PlatformApp constructor called');
        this.currentUser = null;
        this.simulationTypes = [];
        this.userProjects = [];
        this.apiBaseUrl = 'http://localhost:3000/api';
        console.log('PlatformApp initialized with API URL:', this.apiBaseUrl);
        this.init();
    }

    init() {
        console.log('Initializing Platform App...');
        this.setupEventListeners();
        this.loadSimulationTypes();
        this.checkAuthStatus();
        console.log('Platform App initialization complete');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Authentication form submissions
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const guestForm = document.getElementById('guestForm');
        
        console.log('Forms found:', { loginForm: !!loginForm, registerForm: !!registerForm, guestForm: !!guestForm });
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                console.log('Login form submitted');
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                console.log('Register form submitted');
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        if (guestForm) {
            guestForm.addEventListener('submit', (e) => {
                console.log('Guest form submitted');
                e.preventDefault();
                this.handleGuestLogin();
            });
        }
        
        console.log('Event listeners set up complete');
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await this.apiRequest('POST', '/auth/login', { username, password });
            if (response.error) {
                if (response.mode === 'guest-only') {
                    this.showError('User login unavailable. Please use guest access or check database connection.');
                } else {
                    this.showError(response.error);
                }
            } else {
                this.currentUser = { id: response.id, username, isGuest: false, token: response.token };
                this.showSuccess('Login successful!');
                this.onAuthSuccess();
            }
        } catch (error) {
            this.showError('Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await this.apiRequest('POST', '/auth/register', { username, email, password });
            if (response.error) {
                if (response.mode === 'guest-only') {
                    this.showError('User registration unavailable. Please use guest access or check database connection.');
                } else {
                    this.showError(response.error);
                }
            } else {
                this.currentUser = { id: response.id, username, isGuest: false };
                this.showSuccess('Registration successful!');
                this.onAuthSuccess();
            }
        } catch (error) {
            this.showError('Registration failed. Please try again.');
        }
    }

    async handleGuestLogin() {
        console.log('handleGuestLogin called');
        try {
            const response = await this.apiRequest('POST', '/auth/guest', {});
            console.log('Guest login response:', response);
            
            if (response.error) {
                this.showError(response.error);
            } else {
                this.currentUser = { 
                    id: response.id, 
                    username: 'Guest User', 
                    isGuest: true,
                    mode: response.mode || 'session-only'
                };
                
                console.log('Guest user created:', this.currentUser);
                
                if (response.mode === 'session-only') {
                    this.showSuccess('Welcome, Guest! (Session-only mode - data will not be saved)');
                } else {
                    this.showSuccess('Welcome, Guest!');
                }
                
                this.onAuthSuccess();
            }
        } catch (error) {
            console.error('Guest login error:', error);
            this.showError('Guest login failed. Please try again.');
        }
    }

    async loadSimulationTypes() {
        try {
            const response = await this.apiRequest('GET', '/simulation-types', {});
            this.simulationTypes = response || [];
            this.renderSimulationTypes();
        } catch (error) {
            console.error('Failed to load simulation types:', error);
            // Show fallback simulation type
            this.simulationTypes = [{
                id: "solar-system",
                name: "Solar System",
                description: "Interactive solar system simulation with realistic orbital mechanics and inclined orbits",
                category: "astronomy",
                icon: "🌞",
                thumbnail: "/thumbnails/solar-system.jpg",
                is_active: true,
                default_config: {
                    speed: 1.0,
                    showOrbits: true,
                    showLabels: true
                },
                requirements: {
                    threejs: true,
                    webgl: true
                },
                version: "1.0"
            }];
            this.renderSimulationTypes();
            this.showError('Using fallback simulation types. Database connection may be unavailable.');
        }
    }

    async loadUserProjects() {
        if (!this.currentUser || this.currentUser.isGuest) {
            return;
        }

        try {
            const response = await this.apiRequest('GET', '/projects', {}, {
                'user-id': this.currentUser.id
            });
            this.userProjects = response || [];
            this.renderUserProjects();
        } catch (error) {
            console.error('Failed to load user projects:', error);
        }
    }

    renderSimulationTypes() {
        const grid = document.getElementById('simulationTypesGrid');
        
        if (this.simulationTypes.length === 0) {
            grid.innerHTML = '<div class="loading">No simulation types available</div>';
            return;
        }

        grid.innerHTML = this.simulationTypes.map(type => `
            <div class="type-card" onclick="platformApp.selectSimulationType('${type.id}')">
                <div class="type-icon">${type.icon}</div>
                <div class="type-name">${type.name}</div>
                <div class="type-description">${type.description}</div>
                <div class="type-requirements">
                    <strong>Requirements:</strong> ${Object.keys(JSON.parse(type.requirements || '{}')).join(', ')}
                </div>
                <button class="btn">Create New Project</button>
            </div>
        `).join('');
    }

    renderUserProjects() {
        const section = document.getElementById('projectsSection');
        const grid = document.getElementById('projectsGrid');

        if (this.currentUser.isGuest || this.currentUser.mode === 'session-only') {
            section.style.display = 'block';
            grid.innerHTML = '<div class="info-message">📝 Guest mode: Projects are not saved. Create a user account to save your work.</div>';
            return;
        }

        section.style.display = 'block';

        if (this.userProjects.length === 0) {
            grid.innerHTML = '<div class="loading">No projects yet. Create your first simulation!</div>';
            return;
        }

        grid.innerHTML = this.userProjects.map(project => `
            <div class="project-card" onclick="platformApp.loadProject('${project.id}')">
                <div class="project-name">${project.name}</div>
                <div class="project-description">${project.description}</div>
                <div class="project-meta">
                    <span>Type: ${project.type}</span>
                    <span>${new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    async selectSimulationType(typeId) {
        if (!this.currentUser) {
            this.showError('Please login or continue as guest first.');
            return;
        }

        const type = this.simulationTypes.find(t => t.id === typeId);
        if (!type) {
            this.showError('Simulation type not found.');
            return;
        }

        // Check if user is in session-only mode (no database)
        if (this.currentUser.mode === 'session-only' || this.currentUser.isGuest) {
            // For guest users or session-only mode, launch directly without creating a project
            this.showSuccess('Launching simulation in guest mode...');
            this.launchSimulation(typeId, `guest_${Date.now()}`);
            return;
        }

        try {
            const response = await this.apiRequest('POST', '/projects', {
                name: `New ${type.name} Project`,
                description: `A new ${type.name.toLowerCase()} simulation`,
                type: typeId,
                config: JSON.parse(type.default_config || '{}')
            }, {
                'user-id': this.currentUser.id
            });

            if (response.error) {
                if (response.mode === 'guest-only') {
                    // If project creation fails due to database issues, launch in guest mode
                    this.showSuccess('Launching simulation in guest mode (database unavailable)...');
                    this.launchSimulation(typeId, `guest_${Date.now()}`);
                } else {
                    this.showError(response.error);
                }
            } else {
                this.showSuccess('Project created successfully!');
                this.loadUserProjects();
                
                // Launch the simulation
                this.launchSimulation(typeId, response.id);
            }
        } catch (error) {
            // If API request fails, launch in guest mode
            this.showSuccess('Launching simulation in guest mode...');
            this.launchSimulation(typeId, `guest_${Date.now()}`);
        }
    }

    async loadProject(projectId) {
        try {
            const response = await this.apiRequest('GET', `/projects/${projectId}`, {});
            if (response.error) {
                this.showError(response.error);
            } else {
                this.launchSimulation(response.type, projectId);
            }
        } catch (error) {
            this.showError('Failed to load project. Please try again.');
        }
    }

    launchSimulation(typeId, projectId) {
        // For now, we'll redirect to the solar system simulation
        // In the future, this could be dynamic based on the simulation type
        if (typeId === 'solar-system') {
            window.location.href = `index.html?project=${projectId}`;
        } else {
            this.showError('Simulation type not yet implemented.');
        }
    }

    onAuthSuccess() {
        // Hide auth section and show main content
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('userInfo').classList.add('active');
        document.getElementById('mainContent').classList.add('active');

        // Update user display
        document.getElementById('userDisplayName').textContent = this.currentUser.username;

        // Load user-specific data
        this.loadUserProjects();

        // Store user info in session storage
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    checkAuthStatus() {
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.onAuthSuccess();
        }
    }

    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        
        // Show auth section and hide main content
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('userInfo').classList.remove('active');
        document.getElementById('mainContent').classList.remove('active');

        // Clear forms
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();

        this.showSuccess('Logged out successfully!');
    }

    async apiRequest(method, endpoint, data = {}, headers = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        console.log(`Making API request: ${method} ${url}`, { data, headers });
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data && Object.keys(data).length > 0) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            console.log(`API response status: ${response.status}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('API response data:', result);
            return result;
        } catch (error) {
            console.error(`API Request failed: ${method} ${endpoint}`, error);
            throw error;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function showTab(tabName) {
    // Hide all tabs and forms
    document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    // Show selected tab and form
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Form`).classList.add('active');
}

function logout() {
    platformApp.logout();
}

// Initialize the platform app
const platformApp = new PlatformApp();
