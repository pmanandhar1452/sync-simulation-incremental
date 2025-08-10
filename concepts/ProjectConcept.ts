interface ProjectData {
    id: string;
    name: string;
    description: string;
    type: string;
    userId: string;
    createdAt: number;
    updatedAt: number;
    isPublic: boolean;
    thumbnail: string;
    config: Record<string, any>;
}

export class ProjectConcept {
    private projects: Map<string, ProjectData> = new Map();

    create({ id, name, description, type, userId, config }: {
        id: string;
        name: string;
        description: string;
        type: string;
        userId: string;
        config: Record<string, any>;
    }) {
        const projectData: ProjectData = {
            id,
            name,
            description,
            type,
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPublic: false,
            thumbnail: '',
            config: config || {}
        };
        
        this.projects.set(id, projectData);
        return { id };
    }

    update({ id, name, description, config }: {
        id: string;
        name: string;
        description: string;
        config: Record<string, any>;
    }) {
        const project = this.projects.get(id);
        if (!project) {
            return { error: 'Project not found' };
        }

        project.name = name;
        project.description = description;
        project.config = { ...project.config, ...config };
        project.updatedAt = Date.now();
        
        return { id };
    }

    delete({ id, userId }: { id: string; userId: string }) {
        const project = this.projects.get(id);
        if (!project) {
            return { error: 'Project not found' };
        }
        if (project.userId !== userId) {
            return { error: 'Permission denied' };
        }

        this.projects.delete(id);
        return { id };
    }

    setPublic({ id, isPublic }: { id: string; isPublic: boolean }) {
        const project = this.projects.get(id);
        if (project) {
            project.isPublic = isPublic;
            project.updatedAt = Date.now();
        }
        return { id };
    }

    updateThumbnail({ id, thumbnail }: { id: string; thumbnail: string }) {
        const project = this.projects.get(id);
        if (project) {
            project.thumbnail = thumbnail;
            project.updatedAt = Date.now();
        }
        return { id };
    }

    _getById({ id }: { id: string }) {
        const project = this.projects.get(id);
        return project ? [project] : [];
    }

    _getByUser({ userId }: { userId: string }) {
        return Array.from(this.projects.values()).filter(project => project.userId === userId);
    }

    _getByType({ type }: { type: string }) {
        return Array.from(this.projects.values()).filter(project => project.type === type);
    }

    _getPublic() {
        return Array.from(this.projects.values()).filter(project => project.isPublic);
    }

    _getRecent({ limit }: { limit: number }) {
        return Array.from(this.projects.values())
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, limit);
    }
}
