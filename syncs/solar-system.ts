import {
    actions,
    Frames,
    Vars,
} from "../engine/mod.ts";

// Import the instrumented concepts (these will be provided by the main app)
export const createSolarSystemSyncs = (
    API: any,
    CelestialBody: any,
    Renderer: any,
    Simulation: any,
    Camera: any
) => {
    // When a new celestial body is created, add it to the renderer
    const CreateBodyInRenderer = ({ bodyId, scene }: Vars) => ({
        when: actions(
            [CelestialBody.create, { id: bodyId }, {}],
        ),
        then: actions(
            [Renderer.addBody, { scene, bodyId, mesh: "sphere" }],
        ),
    });

    // When simulation time changes, update all celestial body positions
    const UpdateBodyPositions = ({ time }: Vars) => ({
        when: actions(
            [Simulation.step, {}, {}],
        ),
        where: (frames: Frames): Frames => {
            return frames
                .query(Simulation._getById, { id: "main" }, { time })
                .filter(($) => $[time] !== undefined);
        },
        then: actions(
            [CelestialBody.orbit, { id: "sun", time }],
            [CelestialBody.orbit, { id: "mercury", time }],
            [CelestialBody.orbit, { id: "venus", time }],
            [CelestialBody.orbit, { id: "earth", time }],
            [CelestialBody.orbit, { id: "mars", time }],
            [CelestialBody.orbit, { id: "jupiter", time }],
            [CelestialBody.orbit, { id: "saturn", time }],
            [CelestialBody.orbit, { id: "uranus", time }],
            [CelestialBody.orbit, { id: "neptune", time }],
        ),
    });

    // When a body's position changes, update its renderer object
    const UpdateRendererPosition = ({ bodyId, position, scene }: Vars) => ({
        when: actions(
            [CelestialBody.updatePosition, { id: bodyId, position }, {}],
        ),
        where: (frames: Frames): Frames => {
            return frames
                .query(CelestialBody._getById, { id: bodyId }, { position })
                .filter(($) => $[position] !== undefined);
        },
        then: actions(
            [Renderer.updateBody, { scene, bodyId, position, scale: { x: 1, y: 1, z: 1 } }],
        ),
    });

    // When simulation steps, trigger a render
    const RenderOnStep = ({ scene }: Vars) => ({
        when: actions(
            [Simulation.step, {}, {}],
        ),
        then: actions(
            [Renderer.render, { scene }],
        ),
    });

    // API endpoint to create a new celestial body
    const CreateBodyAPI = ({ request, bodyId, name, type, mass, radius, distance, orbitalPeriod, rotationPeriod, color, parent }: Vars) => ({
        when: actions(
            [API.request, { request, method: "POST", path: "/bodies", input: { bodyId, name, type, mass, radius, distance, orbitalPeriod, rotationPeriod, color, parent } }, {}],
        ),
        then: actions(
            [CelestialBody.create, { id: bodyId, name, type, mass, radius, distance, orbitalPeriod, rotationPeriod, color, parent }],
            [API.response, { request, output: { success: true, bodyId } }],
        ),
    });

    // API endpoint to control simulation
    const ControlSimulationAPI = ({ request, action, value }: Vars) => ({
        when: actions(
            [API.request, { request, method: "POST", path: "/simulation", input: { action, value } }, {}],
        ),
        then: actions(
            [action === "pause" ? Simulation.pause : 
             action === "resume" ? Simulation.resume :
             action === "reset" ? Simulation.reset :
             action === "setSpeed" ? Simulation.setSpeed :
             action === "setTime" ? Simulation.setTime : Simulation.step, 
             action === "setSpeed" ? { id: "main", speed: value } :
             action === "setTime" ? { id: "main", time: value } :
             { id: "main" }],
            [API.response, { request, output: { success: true, action } }],
        ),
    });

    // API endpoint to get simulation state
    const GetSimulationStateAPI = ({ request }: Vars) => ({
        when: actions(
            [API.request, { request, method: "GET", path: "/simulation", input: {} }, {}],
        ),
        where: (frames: Frames): Frames => {
            return frames
                .query(Simulation._getById, { id: "main" }, { time: "time", speed: "speed", paused: "paused" });
        },
        then: actions(
            [API.response, { request, output: { time, speed, paused } }],
        ),
    });

    // API endpoint to get all celestial bodies
    const GetBodiesAPI = ({ request }: Vars) => ({
        when: actions(
            [API.request, { request, method: "GET", path: "/bodies", input: {} }, {}],
        ),
        where: (frames: Frames): Frames => {
            return frames
                .query(CelestialBody._getByType, { type: "planet" }, { id: "id", name: "name", type: "type", position: "position" });
        },
        then: actions(
            [API.response, { request, output: { bodies: [{ id, name, type, position }] } }],
        ),
    });

    return {
        CreateBodyInRenderer,
        UpdateBodyPositions,
        UpdateRendererPosition,
        RenderOnStep,
        CreateBodyAPI,
        ControlSimulationAPI,
        GetSimulationStateAPI,
        GetBodiesAPI,
    };
};
