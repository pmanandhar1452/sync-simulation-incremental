import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: number;
    lastLogin: number;
}

export class UserConcept {
    private users: Map<string, User> = new Map();

    private async hashPassword(password: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        const computedHash = await this.hashPassword(password);
        return computedHash === hash;
    }

    private generateToken(): string {
        return crypto.randomUUID();
    }

    async register(id: string, username: string, email: string, password: string): Promise<{ id: string } | { error: string }> {
        // Check if username or email already exists
        for (const user of this.users.values()) {
            if (user.username === username) {
                return { error: "Username already exists" };
            }
            if (user.email === email) {
                return { error: "Email already exists" };
            }
        }

        // Validate input
        if (!username || username.trim().length < 3) {
            return { error: "Username must be at least 3 characters long" };
        }
        if (!email || !email.includes('@')) {
            return { error: "Invalid email address" };
        }
        if (!password || password.length < 6) {
            return { error: "Password must be at least 6 characters long" };
        }

        const passwordHash = await this.hashPassword(password);
        
        const user: User = {
            id,
            username: username.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            createdAt: Date.now(),
            lastLogin: 0
        };

        this.users.set(id, user);
        return { id };
    }

    async login(username: string, password: string): Promise<{ id: string; token: string } | { error: string }> {
        // Find user by username
        let user: User | undefined;
        for (const u of this.users.values()) {
            if (u.username === username) {
                user = u;
                break;
            }
        }

        if (!user) {
            return { error: "Invalid username or password" };
        }

        // Verify password
        const isValid = await this.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return { error: "Invalid username or password" };
        }

        // Update last login
        user.lastLogin = Date.now();
        this.users.set(user.id, user);

        const token = this.generateToken();
        return { id: user.id, token };
    }

    async logout(id: string, token: string): Promise<{ id: string } | { error: string }> {
        // In a real implementation, you would invalidate the token in the Session concept
        // For now, we just return success
        if (!this.users.has(id)) {
            return { error: "User not found" };
        }
        return { id };
    }

    async updateProfile(id: string, username: string, email: string): Promise<{ id: string } | { error: string }> {
        const user = this.users.get(id);
        if (!user) {
            return { error: "User not found" };
        }

        // Check for conflicts with other users
        for (const u of this.users.values()) {
            if (u.id !== id) {
                if (u.username === username) {
                    return { error: "Username already exists" };
                }
                if (u.email === email) {
                    return { error: "Email already exists" };
                }
            }
        }

        // Validate input
        if (!username || username.trim().length < 3) {
            return { error: "Username must be at least 3 characters long" };
        }
        if (!email || !email.includes('@')) {
            return { error: "Invalid email address" };
        }

        user.username = username.trim();
        user.email = email.trim().toLowerCase();
        this.users.set(id, user);

        return { id };
    }

    async changePassword(id: string, oldPassword: string, newPassword: string): Promise<{ id: string } | { error: string }> {
        const user = this.users.get(id);
        if (!user) {
            return { error: "User not found" };
        }

        // Verify old password
        const isValid = await this.verifyPassword(oldPassword, user.passwordHash);
        if (!isValid) {
            return { error: "Incorrect old password" };
        }

        // Validate new password
        if (!newPassword || newPassword.length < 6) {
            return { error: "New password must be at least 6 characters long" };
        }

        // Hash and update password
        const newPasswordHash = await this.hashPassword(newPassword);
        user.passwordHash = newPasswordHash;
        this.users.set(id, user);

        return { id };
    }

    // Query functions
    _getById(id: string): Array<{ id: string; username: string; email: string; createdAt: number; lastLogin: number }> {
        const user = this.users.get(id);
        if (!user) return [];
        return [{
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        }];
    }

    _getByUsername(username: string): Array<{ id: string; username: string; email: string; passwordHash: string; createdAt: number; lastLogin: number }> {
        for (const user of this.users.values()) {
            if (user.username === username) {
                return [{
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    passwordHash: user.passwordHash,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }];
            }
        }
        return [];
    }

    _getByEmail(email: string): Array<{ id: string; username: string; email: string; createdAt: number; lastLogin: number }> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return [{
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }];
            }
        }
        return [];
    }

    _validateToken(id: string, token: string): Array<{ id: string; username: string; email: string }> {
        // In a real implementation, this would validate against the Session concept
        // For now, we just check if the user exists
        const user = this.users.get(id);
        if (!user) return [];
        return [{
            id: user.id,
            username: user.username,
            email: user.email
        }];
    }
}
