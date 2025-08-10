import { actions, Frames, Vars } from "../engine/mod.ts";

// Platform synchronizations for user management, project management, and simulation types

// User registration and login synchronizations
const UserRegistration = ({ userId, username, email, password }: Vars) => ({
    when: actions(
        [API.request, { method: "user_register", username, email, password }, {}],
    ),
    then: actions(
        [User.register, { id: userId, username, email, password }],
    ),
});

const UserLogin = ({ userId, username, password }: Vars) => ({
    when: actions(
        [API.request, { method: "user_login", username, password }, {}],
    ),
    then: actions(
        [User.login, { username, password }],
    ),
});

const GuestLogin = ({ userId }: Vars) => ({
    when: actions(
        [API.request, { method: "guest_login" }, {}],
    ),
    then: actions(
        [User.createGuest, { id: userId }],
    ),
});

// Project management synchronizations
const CreateProject = ({ projectId, name, description, type, userId, config }: Vars) => ({
    when: actions(
        [API.request, { method: "create_project", name, description, type, config }, {}],
        [User._getById, { id: userId }, {}],
    ),
    then: actions(
        [Project.create, { id: projectId, name, description, type, userId, config }],
    ),
});

const LoadProject = ({ projectId }: Vars) => ({
    when: actions(
        [API.request, { method: "load_project", projectId }, {}],
    ),
    then: actions(
        [Project._getById, { id: projectId }],
    ),
});

const SaveProject = ({ projectId, name, description, config }: Vars) => ({
    when: actions(
        [API.request, { method: "save_project", projectId, name, description, config }, {}],
    ),
    then: actions(
        [Project.update, { id: projectId, name, description, config }],
    ),
});

const DeleteProject = ({ projectId, userId }: Vars) => ({
    when: actions(
        [API.request, { method: "delete_project", projectId }, {}],
        [User._getById, { id: userId }, {}],
    ),
    then: actions(
        [Project.delete, { id: projectId, userId }],
    ),
});

// Simulation type management synchronizations
const GetSimulationTypes = () => ({
    when: actions(
        [API.request, { method: "get_simulation_types" }, {}],
    ),
    then: actions(
        [SimulationType._getActive],
    ),
});

const GetProjectsByUser = ({ userId }: Vars) => ({
    when: actions(
        [API.request, { method: "get_user_projects", userId }, {}],
    ),
    then: actions(
        [Project._getByUser, { userId }],
    ),
});

const GetPublicProjects = () => ({
    when: actions(
        [API.request, { method: "get_public_projects" }, {}],
    ),
    then: actions(
        [Project._getPublic],
    ),
});

// Solar system specific synchronizations
const InitializeSolarSystemProject = ({ projectId, userId }: Vars) => ({
    when: actions(
        [Project.create, { id: projectId, name: "Solar System", description: "Interactive solar system simulation", type: "solar-system", userId, config: {} }, {}],
    ),
    then: actions(
        [Simulation.create, { id: "sim_main", time: 0, speed: 1.0, paused: false, stepSize: 1 }],
        [Renderer.createScene, { id: "scene_main", canvas: "canvas", width: 800, height: 600, backgroundColor: "#000011", controlsEnabled: true }],
        [Camera.create, { id: "camera_main", scene: "scene_main", position: { x: 0, y: 100, z: 100 }, target: { x: 0, y: 0, z: 0 }, fov: 75, near: 0.1, far: 1000, type: "perspective", controlsEnabled: true, minDistance: 10, maxDistance: 500 }],
    ),
});

export const platformSyncs = {
    UserRegistration,
    UserLogin,
    GuestLogin,
    CreateProject,
    LoadProject,
    SaveProject,
    DeleteProject,
    GetSimulationTypes,
    GetProjectsByUser,
    GetPublicProjects,
    InitializeSolarSystemProject,
};
