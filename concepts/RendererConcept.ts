import { Vector3 } from "./CelestialBodyConcept.ts";

export interface SceneData {
    id: string;
    canvas: string;
    width: number;
    height: number;
    backgroundColor: string;
}

export interface ObjectData {
    id: string;
    scene: string;
    bodyId: string;
    mesh: string;
    visible: boolean;
}

export class RendererConcept {
    private scenes: Map<string, SceneData> = new Map();
    private objects: Map<string, ObjectData> = new Map();
    private nextObjectId = 1;

    createScene({ id, canvas, width, height, backgroundColor }: {
        id: string;
        canvas: string;
        width: number;
        height: number;
        backgroundColor: string;
    }) {
        const scene: SceneData = {
            id,
            canvas,
            width,
            height,
            backgroundColor
        };
        
        this.scenes.set(id, scene);
        return { id };
    }

    addBody({ scene, bodyId, mesh }: { scene: string; bodyId: string; mesh: string }) {
        const objectId = `obj_${this.nextObjectId++}`;
        const object: ObjectData = {
            id: objectId,
            scene,
            bodyId,
            mesh,
            visible: true
        };
        
        this.objects.set(objectId, object);
        return { id: objectId };
    }

    removeBody({ scene, bodyId }: { scene: string; bodyId: string }) {
        const objectToRemove = Array.from(this.objects.values())
            .find(obj => obj.scene === scene && obj.bodyId === bodyId);
        
        if (objectToRemove) {
            this.objects.delete(objectToRemove.id);
            return { id: objectToRemove.id };
        }
        
        return { id: "" };
    }

    updateBody({ scene, bodyId, position, scale }: {
        scene: string;
        bodyId: string;
        position: Vector3;
        scale: Vector3;
    }) {
        const object = Array.from(this.objects.values())
            .find(obj => obj.scene === scene && obj.bodyId === bodyId);
        
        if (object) {
            // In a real implementation, this would update the Three.js mesh
            // For now, we just return the object id
            return { id: object.id };
        }
        
        return { id: "" };
    }

    render({ scene }: { scene: string }) {
        // In a real implementation, this would trigger Three.js rendering
        // For now, we just return the scene id
        return { id: scene };
    }

    setVisible({ scene, bodyId, visible }: { scene: string; bodyId: string; visible: boolean }) {
        const object = Array.from(this.objects.values())
            .find(obj => obj.scene === scene && obj.bodyId === bodyId);
        
        if (object) {
            object.visible = visible;
            return { id: object.id };
        }
        
        return { id: "" };
    }

    _getScene({ id }: { id: string }): SceneData[] {
        const scene = this.scenes.get(id);
        return scene ? [scene] : [];
    }

    _getObjects({ scene }: { scene: string }): ObjectData[] {
        return Array.from(this.objects.values()).filter(obj => obj.scene === scene);
    }

    _getBodyObject({ scene, bodyId }: { scene: string; bodyId: string }): ObjectData[] {
        return Array.from(this.objects.values())
            .filter(obj => obj.scene === scene && obj.bodyId === bodyId);
    }
}
