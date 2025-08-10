interface UserData {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: number;
    lastLogin: number;
    isGuest: boolean;
    preferences: Record<string, any>;
}

export class UserConcept {
    private database: any;

    constructor(database?: any) {
        this.database = database;
        console.log('UserConcept initialized with database:', !!database);
    }

    setDatabase(database: any) {
        this.database = database;
    }

    async create({ id, username, email, password, passwordHash, createdAt, lastLogin, isGuest, preferences }: {
        id: string;
        username: string;
        email: string;
        password?: string;
        passwordHash?: string;
        createdAt?: number;
        lastLogin?: number;
        isGuest?: boolean;
        preferences?: Record<string, any>;
    }) {
        if (!this.database) {
            console.error('Database not available for user creation');
            return { error: 'Database not available' };
        }

        try {
            const finalPasswordHash = passwordHash || await this.hashPassword(password || '');
            const finalCreatedAt = createdAt || Date.now();
            const finalLastLogin = lastLogin || Date.now();
            const finalIsGuest = isGuest || false;
            const finalPreferences = preferences || {};

            await this.database.execute({
                id: `create_user_${Date.now()}`,
                connection: 'main',
                sql: 'INSERT INTO users (id, username, email, password_hash, created_at, last_login, is_guest, preferences) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                parameters: [id, username, email, finalPasswordHash, finalCreatedAt, finalLastLogin, finalIsGuest, JSON.stringify(finalPreferences)]
            });

            console.log(`User created: ${username} (${id})`);
            return { id };
        } catch (error) {
            console.error('User creation failed:', error);
            return { error: `User creation failed: ${error}` };
        }
    }

    async register({ id, username, email, password }: {
        id: string;
        username: string;
        email: string;
        password: string;
    }) {
        if (!this.database) {
            return { error: 'Database not available' };
        }

        try {
            // Check if username or email already exists
            const existingUser = await this.database.execute({
                id: `check_user_${Date.now()}`,
                connection: 'main',
                sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
                parameters: [username, email]
            });

            if (existingUser.error) {
                return { error: existingUser.error };
            }

            if (existingUser.result.rows.length > 0) {
                return { error: 'Username or email already exists' };
            }

            return await this.create({ id, username, email, password, isGuest: false });
        } catch (error) {
            console.error('User registration failed:', error);
            return { error: `Registration failed: ${error}` };
        }
    }

    async login({ username, password }: { username: string; password: string }) {
        if (!this.database) {
            return { error: 'Database not available' };
        }

        try {
            const result = await this.database.execute({
                id: `login_user_${Date.now()}`,
                connection: 'main',
                sql: 'SELECT id, username, password_hash FROM users WHERE username = ?',
                parameters: [username]
            });

            if (result.error) {
                return { error: result.error };
            }

            if (result.result.rows.length === 0) {
                return { error: 'Invalid credentials' };
            }

            const user = result.result.rows[0];
            const isValidPassword = await this.verifyPassword(password, user.password_hash);

            if (!isValidPassword) {
                return { error: 'Invalid credentials' };
            }

            // Update last login
            await this.database.execute({
                id: `update_login_${Date.now()}`,
                connection: 'main',
                sql: 'UPDATE users SET last_login = ? WHERE id = ?',
                parameters: [Date.now(), user.id]
            });

            const token = this.generateToken(user.id);
            console.log(`User logged in: ${username} (${user.id})`);
            return { id: user.id, token };
        } catch (error) {
            console.error('User login failed:', error);
            return { error: `Login failed: ${error}` };
        }
    }

    async createGuest({ id }: { id: string }) {
        return await this.create({
            id,
            username: `guest_${Date.now()}`,
            email: `guest_${Date.now()}@example.com`,
            passwordHash: await this.hashPassword('guest_password'),
            isGuest: true
        });
    }

    async updatePreferences({ id, preferences }: { id: string; preferences: Record<string, any> }) {
        if (!this.database) {
            return { error: 'Database not available' };
        }

        try {
            await this.database.execute({
                id: `update_preferences_${Date.now()}`,
                connection: 'main',
                sql: 'UPDATE users SET preferences = ? WHERE id = ?',
                parameters: [JSON.stringify(preferences), id]
            });

            return { id };
        } catch (error) {
            console.error('Preferences update failed:', error);
            return { error: `Preferences update failed: ${error}` };
        }
    }

    async logout({ id }: { id: string }) {
        // In a real implementation, this would invalidate the session token
        console.log(`User logged out: ${id}`);
        return { id };
    }

    async _getById({ id }: { id: string }) {
        if (!this.database) {
            return [];
        }

        try {
            const result = await this.database.execute({
                id: `get_user_${Date.now()}`,
                connection: 'main',
                sql: 'SELECT * FROM users WHERE id = ?',
                parameters: [id]
            });

            if (result.error || result.result.rows.length === 0) {
                return [];
            }

            const user = result.result.rows[0];
            return [{
                id: user.id,
                username: user.username,
                email: user.email,
                passwordHash: user.password_hash,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isGuest: user.is_guest,
                preferences: user.preferences ? JSON.parse(user.preferences) : {}
            }];
        } catch (error) {
            console.error('Get user by ID failed:', error);
            return [];
        }
    }

    async _getByUsername({ username }: { username: string }) {
        if (!this.database) {
            return [];
        }

        try {
            const result = await this.database.execute({
                id: `get_user_by_username_${Date.now()}`,
                connection: 'main',
                sql: 'SELECT * FROM users WHERE username = ?',
                parameters: [username]
            });

            if (result.error || result.result.rows.length === 0) {
                return [];
            }

            const user = result.result.rows[0];
            return [{
                id: user.id,
                username: user.username,
                email: user.email,
                passwordHash: user.password_hash,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isGuest: user.is_guest,
                preferences: user.preferences ? JSON.parse(user.preferences) : {}
            }];
        } catch (error) {
            console.error('Get user by username failed:', error);
            return [];
        }
    }

    async _getByEmail({ email }: { email: string }) {
        if (!this.database) {
            return [];
        }

        try {
            const result = await this.database.execute({
                id: `get_user_by_email_${Date.now()}`,
                connection: 'main',
                sql: 'SELECT * FROM users WHERE email = ?',
                parameters: [email]
            });

            if (result.error || result.result.rows.length === 0) {
                return [];
            }

            const user = result.result.rows[0];
            return [{
                id: user.id,
                username: user.username,
                email: user.email,
                passwordHash: user.password_hash,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isGuest: user.is_guest,
                preferences: user.preferences ? JSON.parse(user.preferences) : {}
            }];
        } catch (error) {
            console.error('Get user by email failed:', error);
            return [];
        }
    }

    async _getGuests() {
        if (!this.database) {
            return [];
        }

        try {
            const result = await this.database.execute({
                id: `get_guests_${Date.now()}`,
                connection: 'main',
                sql: 'SELECT * FROM users WHERE is_guest = TRUE',
                parameters: []
            });

            if (result.error) {
                return [];
            }

            return result.result.rows.map((user: any) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                passwordHash: user.password_hash,
                createdAt: user.created_at,
                lastLogin: user.last_login,
                isGuest: user.is_guest,
                preferences: user.preferences ? JSON.parse(user.preferences) : {}
            }));
        } catch (error) {
            console.error('Get guests failed:', error);
            return [];
        }
    }

    private async hashPassword(password: string): Promise<string> {
        // Simple hash for demo purposes - in production use bcrypt or similar
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
        const newHash = await this.hashPassword(password);
        return newHash === hash;
    }

    private generateToken(userId: string): string {
        // Simple token generation for demo purposes
        return btoa(userId + '_' + Date.now());
    }
}
