export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface CelestialBodyData {
    id: string;
    name: string;
    type: string;
    mass: number;
    radius: number;
    distance: number;
    orbitalPeriod: number;
    rotationPeriod: number;
    color: string;
    parent: string;
    position: Vector3;
    velocity: Vector3;
}

export class CelestialBodyConcept {
    private bodies: Map<string, CelestialBodyData> = new Map();

    create({ id, name, type, mass, radius, distance, orbitalPeriod, rotationPeriod, color, parent }: {
        id: string;
        name: string;
        type: string;
        mass: number;
        radius: number;
        distance: number;
        orbitalPeriod: number;
        rotationPeriod: number;
        color: string;
        parent: string;
    }) {
        const body: CelestialBodyData = {
            id,
            name,
            type,
            mass,
            radius,
            distance,
            orbitalPeriod,
            rotationPeriod,
            color,
            parent,
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 0, y: 0, z: 0 }
        };
        
        this.bodies.set(id, body);
        return { id };
    }

    updatePosition({ id, position }: { id: string; position: Vector3 }) {
        const body = this.bodies.get(id);
        if (body) {
            body.position = position;
        }
        return { id };
    }

    updateVelocity({ id, velocity }: { id: string; velocity: Vector3 }) {
        const body = this.bodies.get(id);
        if (body) {
            body.velocity = velocity;
        }
        return { id };
    }

    orbit({ id, time }: { id: string; time: number }) {
        const body = this.bodies.get(id);
        if (body && body.parent) {
            // Simple circular orbit calculation
            const angle = (2 * Math.PI * time) / body.orbitalPeriod;
            const x = body.distance * Math.cos(angle);
            const z = body.distance * Math.sin(angle);
            
            body.position = { x, y: 0, z };
            
            // Calculate velocity for circular orbit
            const velocity = (2 * Math.PI * body.distance) / body.orbitalPeriod;
            body.velocity = { 
                x: -velocity * Math.sin(angle), 
                y: 0, 
                z: velocity * Math.cos(angle) 
            };
        }
        return { id };
    }

    _getById({ id }: { id: string }): CelestialBodyData[] {
        const body = this.bodies.get(id);
        return body ? [body] : [];
    }

    _getByType({ type }: { type: string }): CelestialBodyData[] {
        return Array.from(this.bodies.values()).filter(body => body.type === type);
    }

    _getChildren({ parent }: { parent: string }): CelestialBodyData[] {
        return Array.from(this.bodies.values()).filter(body => body.parent === parent);
    }
}
