interface Session {
    id: string;
    userId: string;
    token: string;
    createdAt: number;
    expiresAt: number;
    active: boolean;
}

export class SessionConcept {
    private sessions: Map<string, Session> = new Map();

    create(id: string, userId: string, token: string, duration: number): { id: string } | { error: string } {
        if (!userId || !token || duration <= 0) {
            return { error: "Invalid session parameters" };
        }

        const now = Date.now();
        const session: Session = {
            id,
            userId,
            token,
            createdAt: now,
            expiresAt: now + (duration * 1000), // Convert seconds to milliseconds
            active: true
        };

        this.sessions.set(id, session);
        return { id };
    }

    validate(id: string, token: string): { id: string; userId: string } | { error: string } {
        const session = this.sessions.get(id);
        if (!session) {
            return { error: "Session not found" };
        }

        if (!session.active) {
            return { error: "Session is inactive" };
        }

        if (session.token !== token) {
            return { error: "Invalid token" };
        }

        const now = Date.now();
        if (now > session.expiresAt) {
            // Mark session as inactive
            session.active = false;
            this.sessions.set(id, session);
            return { error: "Session has expired" };
        }

        return { id: session.id, userId: session.userId };
    }

    invalidate(id: string, token: string): { id: string } | { error: string } {
        const session = this.sessions.get(id);
        if (!session) {
            return { error: "Session not found" };
        }

        if (session.token !== token) {
            return { error: "Invalid token" };
        }

        session.active = false;
        this.sessions.set(id, session);
        return { id };
    }

    refresh(id: string, token: string, duration: number): { id: string } | { error: string } {
        const session = this.sessions.get(id);
        if (!session) {
            return { error: "Session not found" };
        }

        if (!session.active) {
            return { error: "Session is inactive" };
        }

        if (session.token !== token) {
            return { error: "Invalid token" };
        }

        const now = Date.now();
        if (now > session.expiresAt) {
            session.active = false;
            this.sessions.set(id, session);
            return { error: "Session has expired" };
        }

        // Extend the session
        session.expiresAt = now + (duration * 1000);
        this.sessions.set(id, session);
        return { id };
    }

    cleanup(currentTime: number): void {
        const expiredSessions: string[] = [];
        
        for (const [id, session] of this.sessions.entries()) {
            if (currentTime > session.expiresAt) {
                expiredSessions.push(id);
            }
        }

        // Remove expired sessions
        for (const id of expiredSessions) {
            this.sessions.delete(id);
        }
    }

    // Query functions
    _getById(id: string): Array<{ id: string; userId: string; token: string; createdAt: number; expiresAt: number; active: boolean }> {
        const session = this.sessions.get(id);
        if (!session) return [];
        return [{
            id: session.id,
            userId: session.userId,
            token: session.token,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            active: session.active
        }];
    }

    _getByToken(token: string): Array<{ id: string; userId: string; token: string; createdAt: number; expiresAt: number; active: boolean }> {
        for (const session of this.sessions.values()) {
            if (session.token === token) {
                return [{
                    id: session.id,
                    userId: session.userId,
                    token: session.token,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    active: session.active
                }];
            }
        }
        return [];
    }

    _getByUserId(userId: string): Array<{ id: string; userId: string; token: string; createdAt: number; expiresAt: number; active: boolean }> {
        const userSessions: Array<{ id: string; userId: string; token: string; createdAt: number; expiresAt: number; active: boolean }> = [];
        
        for (const session of this.sessions.values()) {
            if (session.userId === userId && session.active) {
                userSessions.push({
                    id: session.id,
                    userId: session.userId,
                    token: session.token,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    active: session.active
                });
            }
        }
        
        return userSessions;
    }

    _getExpired(currentTime: number): Array<{ id: string; userId: string; token: string; createdAt: number; expiresAt: number; active: boolean }> {
        const expiredSessions: Array<{ id: string; userId: string; token: string; createdAt: number; expiresAt: number; active: boolean }> = [];
        
        for (const session of this.sessions.values()) {
            if (currentTime > session.expiresAt) {
                expiredSessions.push({
                    id: session.id,
                    userId: session.userId,
                    token: session.token,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    active: session.active
                });
            }
        }
        
        return expiredSessions;
    }
}
