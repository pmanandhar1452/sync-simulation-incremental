interface SavedSimulation {
    id: string;
    userId: string;
    name: string;
    description: string;
    simulationData: any;
    createdAt: number;
    updatedAt: number;
    isPublic: boolean;
}

export class SimulationStorageConcept {
    private savedSimulations: Map<string, SavedSimulation> = new Map();

    save(id: string, userId: string, name: string, description: string, simulationData: any, isPublic: boolean): { id: string } | { error: string } {
        // Validate input
        if (!name || name.trim().length === 0) {
            return { error: "Simulation name cannot be empty" };
        }
        if (!simulationData) {
            return { error: "Simulation data cannot be empty" };
        }
        if (!userId) {
            return { error: "User ID is required" };
        }

        const now = Date.now();
        const savedSimulation: SavedSimulation = {
            id,
            userId,
            name: name.trim(),
            description: description || "",
            simulationData,
            createdAt: now,
            updatedAt: now,
            isPublic: isPublic || false
        };

        this.savedSimulations.set(id, savedSimulation);
        return { id };
    }

    update(id: string, userId: string, name: string, description: string, simulationData: any, isPublic: boolean): { id: string } | { error: string } {
        const existing = this.savedSimulations.get(id);
        if (!existing) {
            return { error: "Simulation not found" };
        }

        if (existing.userId !== userId) {
            return { error: "You can only update your own simulations" };
        }

        // Validate input
        if (!name || name.trim().length === 0) {
            return { error: "Simulation name cannot be empty" };
        }
        if (!simulationData) {
            return { error: "Simulation data cannot be empty" };
        }

        const updatedSimulation: SavedSimulation = {
            ...existing,
            name: name.trim(),
            description: description || "",
            simulationData,
            updatedAt: Date.now(),
            isPublic: isPublic || false
        };

        this.savedSimulations.set(id, updatedSimulation);
        return { id };
    }

    delete(id: string, userId: string): { id: string } | { error: string } {
        const simulation = this.savedSimulations.get(id);
        if (!simulation) {
            return { error: "Simulation not found" };
        }

        if (simulation.userId !== userId) {
            return { error: "You can only delete your own simulations" };
        }

        this.savedSimulations.delete(id);
        return { id };
    }

    load(id: string, userId: string): { id: string; name: string; description: string; simulationData: any; isPublic: boolean } | { error: string } {
        const simulation = this.savedSimulations.get(id);
        if (!simulation) {
            return { error: "Simulation not found" };
        }

        // Check if user has access (owns it or it's public)
        if (simulation.userId !== userId && !simulation.isPublic) {
            return { error: "Access denied" };
        }

        return {
            id: simulation.id,
            name: simulation.name,
            description: simulation.description,
            simulationData: simulation.simulationData,
            isPublic: simulation.isPublic
        };
    }

    share(id: string, userId: string, isPublic: boolean): { id: string } | { error: string } {
        const simulation = this.savedSimulations.get(id);
        if (!simulation) {
            return { error: "Simulation not found" };
        }

        if (simulation.userId !== userId) {
            return { error: "You can only share your own simulations" };
        }

        simulation.isPublic = isPublic;
        simulation.updatedAt = Date.now();
        this.savedSimulations.set(id, simulation);

        return { id };
    }

    // Query functions
    _getById(id: string): Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> {
        const simulation = this.savedSimulations.get(id);
        if (!simulation) return [];
        return [{
            id: simulation.id,
            userId: simulation.userId,
            name: simulation.name,
            description: simulation.description,
            simulationData: simulation.simulationData,
            createdAt: simulation.createdAt,
            updatedAt: simulation.updatedAt,
            isPublic: simulation.isPublic
        }];
    }

    _getByUserId(userId: string): Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> {
        const userSimulations: Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> = [];
        
        for (const simulation of this.savedSimulations.values()) {
            if (simulation.userId === userId) {
                userSimulations.push({
                    id: simulation.id,
                    userId: simulation.userId,
                    name: simulation.name,
                    description: simulation.description,
                    simulationData: simulation.simulationData,
                    createdAt: simulation.createdAt,
                    updatedAt: simulation.updatedAt,
                    isPublic: simulation.isPublic
                });
            }
        }
        
        return userSimulations;
    }

    _getPublic(): Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> {
        const publicSimulations: Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> = [];
        
        for (const simulation of this.savedSimulations.values()) {
            if (simulation.isPublic) {
                publicSimulations.push({
                    id: simulation.id,
                    userId: simulation.userId,
                    name: simulation.name,
                    description: simulation.description,
                    simulationData: simulation.simulationData,
                    createdAt: simulation.createdAt,
                    updatedAt: simulation.updatedAt,
                    isPublic: simulation.isPublic
                });
            }
        }
        
        return publicSimulations;
    }

    _searchByName(name: string): Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> {
        const matchingSimulations: Array<{ id: string; userId: string; name: string; description: string; simulationData: any; createdAt: number; updatedAt: number; isPublic: boolean }> = [];
        const searchTerm = name.toLowerCase();
        
        for (const simulation of this.savedSimulations.values()) {
            if (simulation.name.toLowerCase().includes(searchTerm) && simulation.isPublic) {
                matchingSimulations.push({
                    id: simulation.id,
                    userId: simulation.userId,
                    name: simulation.name,
                    description: simulation.description,
                    simulationData: simulation.simulationData,
                    createdAt: simulation.createdAt,
                    updatedAt: simulation.updatedAt,
                    isPublic: simulation.isPublic
                });
            }
        }
        
        return matchingSimulations;
    }
}
