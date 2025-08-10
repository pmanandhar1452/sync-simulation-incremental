interface SimulationTypeData {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    thumbnail: string;
    isActive: boolean;
    defaultConfig: Record<string, any>;
    requirements: Record<string, any>;
    version: string;
}

export class SimulationTypeConcept {
    private types: Map<string, SimulationTypeData> = new Map();

    register({ id, name, description, category, icon, thumbnail, defaultConfig, requirements, version }: {
        id: string;
        name: string;
        description: string;
        category: string;
        icon: string;
        thumbnail: string;
        defaultConfig: Record<string, any>;
        requirements: Record<string, any>;
        version: string;
    }) {
        const typeData: SimulationTypeData = {
            id,
            name,
            description,
            category,
            icon,
            thumbnail,
            isActive: true,
            defaultConfig: defaultConfig || {},
            requirements: requirements || {},
            version
        };
        
        this.types.set(id, typeData);
        return { id };
    }

    update({ id, name, description, category, icon, thumbnail, defaultConfig, requirements, version }: {
        id: string;
        name: string;
        description: string;
        category: string;
        icon: string;
        thumbnail: string;
        defaultConfig: Record<string, any>;
        requirements: Record<string, any>;
        version: string;
    }) {
        const type = this.types.get(id);
        if (type) {
            type.name = name;
            type.description = description;
            type.category = category;
            type.icon = icon;
            type.thumbnail = thumbnail;
            type.defaultConfig = defaultConfig;
            type.requirements = requirements;
            type.version = version;
        }
        return { id };
    }

    activate({ id }: { id: string }) {
        const type = this.types.get(id);
        if (type) {
            type.isActive = true;
        }
        return { id };
    }

    deactivate({ id }: { id: string }) {
        const type = this.types.get(id);
        if (type) {
            type.isActive = false;
        }
        return { id };
    }

    updateDefaultConfig({ id, defaultConfig }: { id: string; defaultConfig: Record<string, any> }) {
        const type = this.types.get(id);
        if (type) {
            type.defaultConfig = { ...type.defaultConfig, ...defaultConfig };
        }
        return { id };
    }

    _getById({ id }: { id: string }) {
        const type = this.types.get(id);
        return type ? [type] : [];
    }

    _getActive() {
        return Array.from(this.types.values()).filter(type => type.isActive);
    }

    _getByCategory({ category }: { category: string }) {
        return Array.from(this.types.values()).filter(type => type.category === category);
    }

    _getFeatured() {
        // For now, return all active types. In the future, this could be based on popularity or admin selection
        return this._getActive();
    }
}
