import {
    actions,
    Frames,
    SyncConcept,
    Vars,
} from "../engine/mod.ts";

// Import concepts (these will be instrumented)
import { UserConcept } from "../concepts/UserConcept.ts";
import { SessionConcept } from "../concepts/SessionConcept.ts";
import { SimulationStorageConcept } from "../concepts/SimulationStorageConcept.ts";
import { APIConcept } from "../concepts/APIConcept.ts";

// Initialize sync engine
const Sync = new SyncConcept();

// Register concepts
const concepts = {
    User: new UserConcept(),
    Session: new SessionConcept(),
    SimulationStorage: new SimulationStorageConcept(),
    API: new APIConcept(),
};

// Instrument concepts
const { User, Session, SimulationStorage, API } = Sync.instrument(concepts);

// User Registration Sync
const UserRegistration = ({ userId, username, email, password }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/register", input: { username, email, password } }, { request: "req" }],
    ),
    then: actions(
        [User.register, { id: userId, username, email, password }],
    ),
});

// User Registration Response Sync
const UserRegistrationResponse = ({ userId, username, email, password, request }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/register", input: { username, email, password } }, { request }],
        [User.register, { id: userId, username, email, password }, { id: userId }],
    ),
    then: actions(
        [API.response, { request, output: { success: true, userId, message: "User registered successfully" } }],
    ),
});

// User Registration Error Response Sync
const UserRegistrationErrorResponse = ({ username, email, password, request, error }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/register", input: { username, email, password } }, { request }],
        [User.register, { id: "temp", username, email, password }, { error }],
    ),
    then: actions(
        [API.response, { request, output: { success: false, error } }],
    ),
});

// User Login Sync
const UserLogin = ({ username, password, sessionId, token }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/login", input: { username, password } }, { request: "req" }],
    ),
    then: actions(
        [User.login, { username, password }],
    ),
});

// User Login Success Sync
const UserLoginSuccess = ({ username, password, sessionId, token, userId, request }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/login", input: { username, password } }, { request }],
        [User.login, { username, password }, { id: userId, token }],
    ),
    then: actions(
        [Session.create, { id: sessionId, userId, token, duration: 3600 }],
    ),
});

// User Login Success Response Sync
const UserLoginSuccessResponse = ({ sessionId, userId, token, request }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/login" }, { request }],
        [User.login, {}, { id: userId, token }],
        [Session.create, { id: sessionId, userId, token, duration: 3600 }, { id: sessionId }],
    ),
    then: actions(
        [API.response, { request, output: { success: true, userId, token, message: "Login successful" } }],
    ),
});

// User Login Error Response Sync
const UserLoginErrorResponse = ({ username, password, request, error }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/login", input: { username, password } }, { request }],
        [User.login, { username, password }, { error }],
    ),
    then: actions(
        [API.response, { request, output: { success: false, error } }],
    ),
});

// User Logout Sync
const UserLogout = ({ userId, token, request }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/logout", input: { userId, token } }, { request }],
    ),
    then: actions(
        [Session.invalidate, { id: "session", token }],
        [User.logout, { id: userId, token }],
    ),
});

// User Logout Response Sync
const UserLogoutResponse = ({ userId, token, request }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/auth/logout", input: { userId, token } }, { request }],
        [Session.invalidate, { id: "session", token }, { id: "session" }],
        [User.logout, { id: userId, token }, { id: userId }],
    ),
    then: actions(
        [API.response, { request, output: { success: true, message: "Logout successful" } }],
    ),
});

// Save Simulation Sync
const SaveSimulation = ({ userId, name, description, simulationData, isPublic, storageId }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/simulations/save", input: { userId, name, description, simulationData, isPublic } }, { request: "req" }],
    ),
    then: actions(
        [SimulationStorage.save, { id: storageId, userId, name, description, simulationData, isPublic }],
    ),
});

// Save Simulation Response Sync
const SaveSimulationResponse = ({ userId, name, description, simulationData, isPublic, storageId, request }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/simulations/save", input: { userId, name, description, simulationData, isPublic } }, { request }],
        [SimulationStorage.save, { id: storageId, userId, name, description, simulationData, isPublic }, { id: storageId }],
    ),
    then: actions(
        [API.response, { request, output: { success: true, storageId, message: "Simulation saved successfully" } }],
    ),
});

// Save Simulation Error Response Sync
const SaveSimulationErrorResponse = ({ userId, name, description, simulationData, isPublic, request, error }: Vars) => ({
    when: actions(
        [API.request, { method: "POST", path: "/simulations/save", input: { userId, name, description, simulationData, isPublic } }, { request }],
        [SimulationStorage.save, { id: "temp", userId, name, description, simulationData, isPublic }, { error }],
    ),
    then: actions(
        [API.response, { request, output: { success: false, error } }],
    ),
});

// Load Simulation Sync
const LoadSimulation = ({ storageId, userId }: Vars) => ({
    when: actions(
        [API.request, { method: "GET", path: "/simulations/load", input: { storageId, userId } }, { request: "req" }],
    ),
    then: actions(
        [SimulationStorage.load, { id: storageId, userId }],
    ),
});

// Load Simulation Response Sync
const LoadSimulationResponse = ({ storageId, userId, request }: Vars) => ({
    when: actions(
        [API.request, { method: "GET", path: "/simulations/load", input: { storageId, userId } }, { request }],
        [SimulationStorage.load, { id: storageId, userId }, { id: storageId, name: "name", description: "desc", simulationData: "data", isPublic: "public" }],
    ),
    then: actions(
        [API.response, { request, output: { success: true, storageId, name: "name", description: "desc", simulationData: "data", isPublic: "public" } }],
    ),
});

// Load Simulation Error Response Sync
const LoadSimulationErrorResponse = ({ storageId, userId, request, error }: Vars) => ({
    when: actions(
        [API.request, { method: "GET", path: "/simulations/load", input: { storageId, userId } }, { request }],
        [SimulationStorage.load, { id: storageId, userId }, { error }],
    ),
    then: actions(
        [API.response, { request, output: { success: false, error } }],
    ),
});

// Note: Query functions (_getByUserId, _getPublic) are handled directly in the server
// rather than through synchronizations since they are read-only operations

// Register all synchronizations
const syncs = {
    UserRegistration,
    UserRegistrationResponse,
    UserRegistrationErrorResponse,
    UserLogin,
    UserLoginSuccess,
    UserLoginSuccessResponse,
    UserLoginErrorResponse,
    UserLogout,
    UserLogoutResponse,
    SaveSimulation,
    SaveSimulationResponse,
    SaveSimulationErrorResponse,
    LoadSimulation,
    LoadSimulationResponse,
    LoadSimulationErrorResponse,
};

Sync.register(syncs);

export { Sync, User, Session, SimulationStorage, API };
