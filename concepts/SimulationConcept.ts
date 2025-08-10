export interface SimulationData {
    id: string;
    time: number;
    speed: number;
    paused: boolean;
    stepSize: number;
}

export class SimulationConcept {
    private simulations: Map<string, SimulationData> = new Map();

    create({ id, time, speed, stepSize }: {
        id: string;
        time: number;
        speed: number;
        stepSize: number;
    }) {
        const simulation: SimulationData = {
            id,
            time,
            speed,
            paused: false,
            stepSize
        };
        
        this.simulations.set(id, simulation);
        return { id };
    }

    setTime({ id, time }: { id: string; time: number }) {
        const simulation = this.simulations.get(id);
        if (simulation) {
            simulation.time = time;
        }
        return { id };
    }

    setSpeed({ id, speed }: { id: string; speed: number }) {
        const simulation = this.simulations.get(id);
        if (simulation) {
            simulation.speed = speed;
        }
        return { id };
    }

    pause({ id }: { id: string }) {
        const simulation = this.simulations.get(id);
        if (simulation) {
            simulation.paused = true;
        }
        return { id };
    }

    resume({ id }: { id: string }) {
        const simulation = this.simulations.get(id);
        if (simulation) {
            simulation.paused = false;
        }
        return { id };
    }

    step({ id }: { id: string }) {
        const simulation = this.simulations.get(id);
        if (simulation && !simulation.paused) {
            simulation.time += simulation.stepSize * simulation.speed;
        }
        return { id };
    }

    reset({ id }: { id: string }) {
        const simulation = this.simulations.get(id);
        if (simulation) {
            simulation.time = 0;
        }
        return { id };
    }

    _getById({ id }: { id: string }): SimulationData[] {
        const simulation = this.simulations.get(id);
        return simulation ? [simulation] : [];
    }

    _getActive({ id }: { id: string }): SimulationData[] {
        const simulation = this.simulations.get(id);
        return simulation && !simulation.paused ? [simulation] : [];
    }
}
