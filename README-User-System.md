# User System for Solar System Simulation

This document describes the user management and simulation persistence system added to the solar system simulation platform.

## Overview

The user system allows users to:
- **Register and login** to save their simulations
- **Use the platform as guests** without registration
- **Save and load** simulation configurations
- **Share simulations** publicly or keep them private
- **Browse public simulations** created by other users

## Architecture

The system is built using **concept design principles** with three main concepts:

### 1. User Concept (`UserConcept`)
- **Purpose**: Manage user accounts and authentication
- **Features**:
  - User registration with username, email, and password
  - Secure password hashing using SHA-256
  - User login with session token generation
  - Profile management and password changes
  - Input validation and error handling

### 2. Session Concept (`SessionConcept`)
- **Purpose**: Manage user sessions and authentication tokens
- **Features**:
  - Session creation with expiration times
  - Token validation and session management
  - Automatic session cleanup for expired sessions
  - Secure session invalidation on logout

### 3. SimulationStorage Concept (`SimulationStorageConcept`)
- **Purpose**: Persist and retrieve simulation configurations
- **Features**:
  - Save simulation states with metadata
  - Load simulations with access control
  - List user's private simulations
  - Browse public simulations
  - Search and filter simulations
  - Public/private sharing controls

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Simulation Management
- `POST /api/simulations/save` - Save simulation (requires auth)
- `GET /api/simulations/load` - Load simulation
- `GET /api/simulations/list` - List user simulations (requires auth)
- `GET /api/simulations/public` - List public simulations

## Usage

### Starting the Server
```bash
npm run server
# or
deno run --allow-net --allow-read server.ts
```

The server runs on `http://localhost:8000` and serves the user interface at the root URL.

### User Interface

1. **Guest Mode**: Click "Start as Guest" to use the simulation without registration
2. **Registration**: Fill in username, email, and password to create an account
3. **Login**: Use your credentials to access saved simulations
4. **Simulation Management**: 
   - Save current simulation state with name and description
   - Load previously saved simulations
   - Browse public simulations from other users
   - Make your simulations public or private

### Features

#### Guest Users
- Can explore the solar system simulation
- Can view public simulations
- Cannot save simulations (must register)

#### Registered Users
- All guest features
- Save unlimited simulations
- Load their own simulations
- Share simulations publicly
- Access to private simulation management

#### Simulation Data
Each saved simulation includes:
- Celestial body positions and rotations
- Camera position and target
- Simulation metadata (name, description, timestamps)
- Public/private status

## Security Features

- **Password Hashing**: All passwords are hashed using SHA-256
- **Session Management**: Secure token-based authentication
- **Access Control**: Users can only access their own simulations
- **Input Validation**: Comprehensive validation for all user inputs
- **CORS Support**: Proper CORS headers for web security

## File Structure

```
├── concepts/
│   ├── UserConcept.ts           # User management implementation
│   ├── SessionConcept.ts        # Session management implementation
│   └── SimulationStorageConcept.ts # Simulation persistence
├── specs/
│   ├── User.concept             # User concept specification
│   ├── Session.concept          # Session concept specification
│   └── SimulationStorage.concept # Storage concept specification
├── syncs/
│   └── user-management.ts       # Synchronizations for user system
├── web/
│   ├── user-app.html            # User interface
│   └── user-app.js              # Frontend JavaScript
├── server.ts                    # Deno server with API endpoints
└── README-User-System.md        # This file
```

## Development

### Adding New Features
1. **Concepts**: Add new concept specifications in `specs/`
2. **Implementations**: Create TypeScript implementations in `concepts/`
3. **Synchronizations**: Define behavior in `syncs/`
4. **API**: Add endpoints in `server.ts`
5. **UI**: Update frontend in `web/`

### Testing
The system includes comprehensive error handling and validation. All concepts can be tested independently, and the synchronization system ensures proper data flow between components.

## Future Enhancements

Potential improvements:
- **Database Integration**: Replace in-memory storage with persistent database
- **Advanced Search**: Full-text search for simulation names and descriptions
- **Simulation Categories**: Organize simulations by type or theme
- **Collaboration**: Allow multiple users to work on shared simulations
- **Version Control**: Track changes to simulations over time
- **Export/Import**: Support for sharing simulation files

## Troubleshooting

### Common Issues

1. **Server won't start**: Ensure Deno is installed and you have network permissions
2. **Registration fails**: Check that username and email are unique, password is 6+ characters
3. **Login fails**: Verify username and password are correct
4. **Can't save simulation**: Make sure you're logged in (not in guest mode)
5. **Can't load simulation**: Check that you own the simulation or it's public

### Debug Mode
Enable detailed logging by setting `Sync.logging = "VERBOSE"` in the server code.
