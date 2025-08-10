import { Vector3 } from "./CelestialBodyConcept.ts";

export interface CameraData {
    id: string;
    scene: string;
    position: Vector3;
    target: Vector3;
    fov: number;
    near: number;
    far: number;
    type: string;
}

export class CameraConcept {
    private cameras: Map<string, CameraData> = new Map();

    create({ id, scene, position, target, fov, near, far, type }: {
        id: string;
        scene: string;
        position: Vector3;
        target: Vector3;
        fov: number;
        near: number;
        far: number;
        type: string;
    }) {
        const camera: CameraData = {
            id,
            scene,
            position,
            target,
            fov,
            near,
            far,
            type
        };
        
        this.cameras.set(id, camera);
        return { id };
    }

    setPosition({ id, position }: { id: string; position: Vector3 }) {
        const camera = this.cameras.get(id);
        if (camera) {
            camera.position = position;
        }
        return { id };
    }

    setTarget({ id, target }: { id: string; target: Vector3 }) {
        const camera = this.cameras.get(id);
        if (camera) {
            camera.target = target;
        }
        return { id };
    }

    follow({ id, bodyId, distance }: { id: string; bodyId: string; distance: number }) {
        const camera = this.cameras.get(id);
        if (camera) {
            // In a real implementation, this would calculate the camera position
            // to follow the specified body at the given distance
            // For now, we just update the target to the body's position
            camera.target = { x: 0, y: 0, z: 0 }; // This would be the body's position
        }
        return { id };
    }

    orbit({ id, bodyId, distance, angle }: { id: string; bodyId: string; distance: number; angle: number }) {
        const camera = this.cameras.get(id);
        if (camera) {
            // Calculate orbital position around the body
            const x = distance * Math.cos(angle);
            const z = distance * Math.sin(angle);
            camera.position = { x, y: 0, z };
            camera.target = { x: 0, y: 0, z: 0 }; // This would be the body's position
        }
        return { id };
    }

    zoom({ id, factor }: { id: string; factor: number }) {
        const camera = this.cameras.get(id);
        if (camera) {
            // Adjust FOV for zoom effect
            camera.fov = Math.max(10, Math.min(120, camera.fov * factor));
        }
        return { id };
    }

    _getById({ id }: { id: string }): CameraData[] {
        const camera = this.cameras.get(id);
        return camera ? [camera] : [];
    }

    _getByScene({ scene }: { scene: string }): CameraData[] {
        return Array.from(this.cameras.values()).filter(camera => camera.scene === scene);
    }
}
