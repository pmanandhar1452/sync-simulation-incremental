interface SessionData {
    id: string;
    userId: string;
    currentProject: string;
    currentView: string;
    navigationHistory: string[];
    preferences: Record<string, any>;
    createdAt: number;
    lastActivity: number;
    isActive: boolean;
}

export class SessionConcept {
    private sessions: Map<string, SessionData> = new Map();

    create({ id, userId }: { id: string; userId: string }) {
        const sessionData: SessionData = {
            id,
            userId,
            currentProject: "",
            currentView: "menu",
            navigationHistory: ["menu"],
            preferences: {},
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isActive: true
        };

        this.sessions.set(id, sessionData);
        return { id };
    }

    setCurrentProject({ id, projectId }: { id: string; projectId: string }) {
        const session = this.sessions.get(id);
        if (session) {
            session.currentProject = projectId;
            session.lastActivity = Date.now();
        }
        return { id };
    }

    setCurrentView({ id, view }: { id: string; view: string }) {
        const session = this.sessions.get(id);
        if (session) {
            session.currentView = view;
            session.navigationHistory.push(view);
            session.lastActivity = Date.now();
        }
        return { id };
    }

    navigateTo({ id, view, projectId }: { id: string; view: string; projectId?: string }) {
        const session = this.sessions.get(id);
        if (session) {
            session.currentView = view;
            if (projectId) {
                session.currentProject = projectId;
            }
            session.navigationHistory.push(view);
            session.lastActivity = Date.now();
        }
        return { id };
    }

    updatePreferences({ id, preferences }: { id: string; preferences: Record<string, any> }) {
        const session = this.sessions.get(id);
        if (session) {
            session.preferences = { ...session.preferences, ...preferences };
            session.lastActivity = Date.now();
        }
        return { id };
    }

    updateActivity({ id }: { id: string }) {
        const session = this.sessions.get(id);
        if (session) {
            session.lastActivity = Date.now();
        }
        return { id };
    }

    end({ id }: { id: string }) {
        const session = this.sessions.get(id);
        if (session) {
            session.isActive = false;
        }
        return { id };
    }

    _getById({ id }: { id: string }) {
        const session = this.sessions.get(id);
        return session ? [session] : [];
    }

    _getByUser({ userId }: { userId: string }) {
        return Array.from(this.sessions.values()).filter(session => session.userId === userId);
    }

    _getActive() {
        return Array.from(this.sessions.values()).filter(session => session.isActive);
    }

    _getByProject({ projectId }: { projectId: string }) {
        return Array.from(this.sessions.values()).filter(session => session.currentProject === projectId);
    }
}
