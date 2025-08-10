# Simulation Platform Setup Guide

This guide will help you set up the Simulation Platform with all necessary components.

## Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Deno** (v1.30 or higher) - [Download here](https://deno.land/)
- **MySQL** (v8.0 or higher) - See installation instructions below

### MySQL Installation

#### macOS (using Homebrew)
```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure the installation (set root password)
mysql_secure_installation

# Create the database
mysql -u root -p -e "CREATE DATABASE simulations;"
```

#### macOS (using MySQL Installer)
1. Download MySQL Community Server from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
2. Run the installer and follow the setup wizard
3. Remember the root password you set during installation
4. Open Terminal and create the database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE simulations;"
   ```

#### Linux (Ubuntu/Debian)
```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure the installation
sudo mysql_secure_installation

# Create the database
sudo mysql -u root -p -e "CREATE DATABASE simulations;"
```

#### Windows
1. Download MySQL Community Server from [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
2. Run the installer and follow the setup wizard
3. Remember the root password you set during installation
4. Open Command Prompt and create the database:
   ```cmd
   mysql -u root -p -e "CREATE DATABASE simulations;"
   ```

## Environment Configuration

### 1. Create Environment File
```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your database credentials
nano .env
```

### 2. Configure Database Settings
Edit your `.env` file with the following values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=simulations
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here

# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=3000

# Optional: Frontend Configuration
FRONTEND_PORT=8000
FRONTEND_HOST=localhost

# Optional: Security Configuration
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here

# Optional: Development Configuration
NODE_ENV=development
LOG_LEVEL=info
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Use a strong password for your MySQL root user
- In production, create a dedicated database user with limited permissions

## Backend Setup

### 1. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Verify Deno installation
deno --version
```

### 2. Start the Backend Server

#### Option A: Simple Backend (Recommended)
```bash
# Start the simple backend server (no external imports)
npm run dev:simple
```

#### Option B: Enhanced Backend
```bash
# Start the enhanced backend server
npm run dev
```

### 3. Verify Backend is Running
You should see output similar to:
```
🚀 Initializing Simulation Platform Backend...
✅ Environment file loaded successfully
📊 Database configuration: { host: 'localhost', port: 3306, ... }
📊 Connecting to database...
✅ Database connected successfully
🏗️ Initializing database schema...
✅ Database schema initialized
✅ HTTP server started on http://localhost:3000
✅ Simulation types registered
✅ Default guest user created
🎉 Backend initialization complete!
```

### 4. Test the API
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test simulation types endpoint
curl http://localhost:3000/api/simulation-types
```

## Frontend Setup

### 1. Start the Frontend Server
```bash
# In a new terminal window
npm run frontend
```

### 2. Access the Platform
Open your browser and navigate to:
- **Platform Interface**: http://localhost:8000/web/platform.html
- **Solar System Simulation**: http://localhost:8000/web/index.html

## Testing the Complete System

### 1. Test User Registration
1. Go to http://localhost:8000/web/platform.html
2. Click "Register" and create a new account
3. Verify the user appears in the database

### 2. Test Guest Access
1. Click "Continue as Guest"
2. Verify you can access the simulation platform

### 3. Test Simulation Creation
1. Select "Solar System" simulation type
2. Create a new project
3. Launch the simulation

## Troubleshooting

### Database Connection Issues

#### "MySQL not accessible" Error
```bash
# Check if MySQL is running
brew services list | grep mysql

# Start MySQL if not running
brew services start mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"
```

#### "Access denied" Error
```bash
# Reset MySQL root password
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

#### "Database doesn't exist" Error
```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE simulations;"
```

### Environment File Issues

#### "Could not load .env file" Error
```bash
# Check if .env file exists
ls -la .env

# Create .env file if missing
cp env.example .env

# Edit with correct database credentials
nano .env
```

#### "Database configuration failed" Error
1. Verify your `.env` file has the correct format
2. Check that MySQL is running and accessible
3. Verify the database credentials are correct

### Server Issues

#### "Port already in use" Error
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change the port in .env
SERVER_PORT=3001
```

#### "CORS errors" in browser
1. Ensure the backend is running on the correct port
2. Check that CORS is enabled in the server configuration
3. Verify the frontend is making requests to the correct backend URL

### Frontend Issues

#### "Cannot load Three.js" Error
1. Ensure the frontend server is running on port 8000
2. Check that all JavaScript files are accessible
3. Verify browser console for specific error messages

#### "API requests failing" Error
1. Ensure the backend server is running
2. Check that the API endpoints are accessible
3. Verify the frontend is making requests to the correct backend URL

## File Structure

```
sync-simulation-incremental/
├── backend-server.ts          # Main backend server (enhanced)
├── backend-server-simple.ts   # Simple backend server (recommended)
├── .env                       # Environment variables (create from env.example)
├── env.example               # Environment template
├── package.json              # Project dependencies and scripts
├── setup.md                  # This setup guide
├── concepts/                 # Concept implementations
│   ├── DatabaseConcept.ts
│   ├── ServerConcept.ts
│   ├── UserConcept.ts
│   └── ...
├── specs/                    # Concept specifications
│   ├── Database.concept
│   ├── Server.concept
│   └── ...
├── web/                      # Frontend files
│   ├── platform.html         # Main platform interface
│   ├── platform.js           # Platform JavaScript
│   ├── index.html            # Solar system simulation
│   └── main.js               # Simulation JavaScript
└── engine/                   # Synchronization engine
    ├── mod.ts
    └── ...
```

## Production Deployment

### Environment Variables
- Use environment variables for all sensitive data
- Never hardcode database passwords or API keys
- Use strong, unique passwords for production databases

### Database Security
- Create a dedicated database user with limited permissions
- Use SSL connections for database communication
- Regularly backup your database

### Server Security
- Use HTTPS in production
- Implement proper authentication and authorization
- Set up monitoring and logging

### Scaling Considerations
- Use connection pooling for database connections
- Implement caching for frequently accessed data
- Consider using a CDN for static assets

## Support

If you encounter issues not covered in this guide:

1. Check the console output for error messages
2. Verify all prerequisites are installed and running
3. Ensure your `.env` file is properly configured
4. Check that all required ports are available
5. Review the troubleshooting section above

For additional help, please check the project documentation or create an issue in the repository.
