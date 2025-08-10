import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

interface ServerData {
    id: string;
    port: number;
    host: string;
    isRunning: boolean;
    startTime: number;
    config: Record<string, any>;
    app?: express.Application;
    server?: any;
}

interface RouteData {
    id: string;
    server: string;
    method: string;
    path: string;
    handler: Function;
    middleware: Function[];
}

interface RequestData {
    id: string;
    server: string;
    method: string;
    path: string;
    headers: Record<string, any>;
    body: any;
    timestamp: number;
    response: any;
}

export class ServerConcept {
    private servers: Map<string, ServerData> = new Map();
    private routes: Map<string, RouteData> = new Map();
    private requests: Map<string, RequestData> = new Map();

    start({ id, port, host, config }: {
        id: string;
        port: number;
        host: string;
        config: Record<string, any>;
    }) {
        try {
            const app = express();
            
            // Default middleware
            app.use(cors());
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({ extended: true }));

            // Custom middleware from config
            if (config.middleware) {
                config.middleware.forEach((middleware: Function) => {
                    app.use(middleware);
                });
            }

            const server = app.listen(port, host, () => {
                console.log(`Server started: ${id} on ${host}:${port}`);
            });

            const serverData: ServerData = {
                id,
                port,
                host,
                isRunning: true,
                startTime: Date.now(),
                config,
                app,
                server
            };

            this.servers.set(id, serverData);
            return { id };
        } catch (error) {
            console.error(`Server start failed: ${error}`);
            return { error: `Server start failed: ${error}` };
        }
    }

    stop({ id }: { id: string }) {
        const serverData = this.servers.get(id);
        if (serverData && serverData.server) {
            try {
                serverData.server.close();
                serverData.isRunning = false;
                console.log(`Server stopped: ${id}`);
            } catch (error) {
                console.error(`Server stop error: ${error}`);
            }
        }
        return { id };
    }

    addRoute({ id, server, method, path, handler, middleware }: {
        id: string;
        server: string;
        method: string;
        path: string;
        handler: Function;
        middleware: Function[];
    }) {
        const serverData = this.servers.get(server);
        if (!serverData || !serverData.app) {
            return { error: 'Server not found' };
        }

        try {
            const routeHandler = async (req: Request, res: Response, next: NextFunction) => {
                const requestId = `req_${Date.now()}`;
                const requestData: RequestData = {
                    id: requestId,
                    server,
                    method: req.method,
                    path: req.path,
                    headers: req.headers,
                    body: req.body,
                    timestamp: Date.now(),
                    response: null
                };

                this.requests.set(requestId, requestData);

                try {
                    const result = await handler(req, res, next);
                    requestData.response = result;
                    return result;
                } catch (error) {
                    requestData.response = { error: error.message };
                    throw error;
                }
            };

            const routeMiddleware = middleware.map(m => m as express.RequestHandler);
            
            switch (method.toLowerCase()) {
                case 'get':
                    serverData.app.get(path, ...routeMiddleware, routeHandler);
                    break;
                case 'post':
                    serverData.app.post(path, ...routeMiddleware, routeHandler);
                    break;
                case 'put':
                    serverData.app.put(path, ...routeMiddleware, routeHandler);
                    break;
                case 'delete':
                    serverData.app.delete(path, ...routeMiddleware, routeHandler);
                    break;
                case 'patch':
                    serverData.app.patch(path, ...routeMiddleware, routeHandler);
                    break;
                default:
                    return { error: `Unsupported HTTP method: ${method}` };
            }

            const routeData: RouteData = {
                id,
                server,
                method: method.toLowerCase(),
                path,
                handler,
                middleware
            };

            this.routes.set(id, routeData);
            console.log(`Route added: ${method.toUpperCase()} ${path} to server ${server}`);
            return { id };
        } catch (error) {
            console.error(`Route addition failed: ${error}`);
            return { error: `Route addition failed: ${error}` };
        }
    }

    handleRequest({ id, server, method, path, headers, body }: {
        id: string;
        server: string;
        method: string;
        path: string;
        headers: Record<string, any>;
        body: any;
    }) {
        const requestData: RequestData = {
            id,
            server,
            method,
            path,
            headers,
            body,
            timestamp: Date.now(),
            response: null
        };

        this.requests.set(id, requestData);

        // This would typically be handled by the Express server
        // For now, we'll just log the request
        console.log(`Request handled: ${method} ${path} on server ${server}`);
        
        return { id, response: { status: 200, message: 'Request logged' } };
    }

    setMiddleware({ id, server, middleware }: {
        id: string;
        server: string;
        middleware: Function[];
    }) {
        const serverData = this.servers.get(server);
        if (!serverData || !serverData.app) {
            return { error: 'Server not found' };
        }

        try {
            middleware.forEach(m => {
                serverData.app.use(m as express.RequestHandler);
            });
            
            serverData.config.middleware = middleware;
            console.log(`Middleware set for server: ${server}`);
            return { id };
        } catch (error) {
            console.error(`Middleware setting failed: ${error}`);
            return { error: `Middleware setting failed: ${error}` };
        }
    }

    _getServer({ id }: { id: string }) {
        const server = this.servers.get(id);
        if (server) {
            const { app, server: _, ...serverInfo } = server;
            return [serverInfo];
        }
        return [];
    }

    _getRunningServers() {
        return Array.from(this.servers.values()).map(server => {
            const { app, server: _, ...serverInfo } = server;
            return serverInfo;
        }).filter(server => server.isRunning);
    }

    _getRoutes({ server }: { server: string }) {
        return Array.from(this.routes.values()).filter(route => route.server === server);
    }

    _getRequest({ id }: { id: string }) {
        const request = this.requests.get(id);
        return request ? [request] : [];
    }

    // Helper method to create standard API routes
    createAPIRoutes({ server, database }: { server: string; database: any }) {
        // Health check route
        this.addRoute({
            id: 'health_check',
            server,
            method: 'GET',
            path: '/api/health',
            handler: async (req: Request, res: Response) => {
                res.json({ status: 'ok', timestamp: Date.now() });
            },
            middleware: []
        });

        // User registration route
        this.addRoute({
            id: 'user_register',
            server,
            method: 'POST',
            path: '/api/auth/register',
            handler: async (req: Request, res: Response) => {
                try {
                    const { username, email, password } = req.body;
                    
                    // Check if user already exists
                    const existingUser = await database.execute({
                        id: `check_user_${Date.now()}`,
                        connection: 'main',
                        sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
                        parameters: [username, email]
                    });

                    if (existingUser.error) {
                        return res.status(500).json({ error: existingUser.error });
                    }

                    if (existingUser.result.rows.length > 0) {
                        return res.status(400).json({ error: 'Username or email already exists' });
                    }

                    // Create new user
                    const userId = `user_${Date.now()}`;
                    const passwordHash = await this.hashPassword(password);
                    
                    await database.execute({
                        id: `create_user_${Date.now()}`,
                        connection: 'main',
                        sql: 'INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
                        parameters: [userId, username, email, passwordHash, Date.now()]
                    });

                    res.status(201).json({ id: userId, username });
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            },
            middleware: []
        });

        // User login route
        this.addRoute({
            id: 'user_login',
            server,
            method: 'POST',
            path: '/api/auth/login',
            handler: async (req: Request, res: Response) => {
                try {
                    const { username, password } = req.body;
                    
                    const result = await database.execute({
                        id: `login_user_${Date.now()}`,
                        connection: 'main',
                        sql: 'SELECT id, username, password_hash FROM users WHERE username = ?',
                        parameters: [username]
                    });

                    if (result.error) {
                        return res.status(500).json({ error: result.error });
                    }

                    if (result.result.rows.length === 0) {
                        return res.status(401).json({ error: 'Invalid credentials' });
                    }

                    const user = result.result.rows[0];
                    const isValidPassword = await this.verifyPassword(password, user.password_hash);

                    if (!isValidPassword) {
                        return res.status(401).json({ error: 'Invalid credentials' });
                    }

                    // Update last login
                    await database.execute({
                        id: `update_login_${Date.now()}`,
                        connection: 'main',
                        sql: 'UPDATE users SET last_login = ? WHERE id = ?',
                        parameters: [Date.now(), user.id]
                    });

                    const token = this.generateToken(user.id);
                    res.json({ id: user.id, token });
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            },
            middleware: []
        });

        // Guest login route
        this.addRoute({
            id: 'guest_login',
            server,
            method: 'POST',
            path: '/api/auth/guest',
            handler: async (req: Request, res: Response) => {
                try {
                    const userId = `guest_${Date.now()}`;
                    
                    await database.execute({
                        id: `create_guest_${Date.now()}`,
                        connection: 'main',
                        sql: 'INSERT INTO users (id, username, email, password_hash, created_at, is_guest) VALUES (?, ?, ?, ?, ?, ?)',
                        parameters: [userId, `guest_${Date.now()}`, '', '', Date.now(), true]
                    });

                    res.json({ id: userId });
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            },
            middleware: []
        });

        // Get simulation types route
        this.addRoute({
            id: 'get_simulation_types',
            server,
            method: 'GET',
            path: '/api/simulation-types',
            handler: async (req: Request, res: Response) => {
                try {
                    const result = await database.execute({
                        id: `get_types_${Date.now()}`,
                        connection: 'main',
                        sql: 'SELECT * FROM simulation_types WHERE is_active = TRUE',
                        parameters: []
                    });

                    if (result.error) {
                        return res.status(500).json({ error: result.error });
                    }

                    res.json(result.result.rows);
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            },
            middleware: []
        });

        // Create project route
        this.addRoute({
            id: 'create_project',
            server,
            method: 'POST',
            path: '/api/projects',
            handler: async (req: Request, res: Response) => {
                try {
                    const { name, description, type, config } = req.body;
                    const userId = req.headers['user-id'] as string;
                    
                    if (!userId) {
                        return res.status(401).json({ error: 'User ID required' });
                    }

                    const projectId = `proj_${Date.now()}`;
                    const now = Date.now();
                    
                    await database.execute({
                        id: `create_project_${Date.now()}`,
                        connection: 'main',
                        sql: 'INSERT INTO projects (id, name, description, type, user_id, created_at, updated_at, config) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        parameters: [projectId, name, description, type, userId, now, now, JSON.stringify(config || {})]
                    });

                    res.status(201).json({ id: projectId });
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            },
            middleware: []
        });

        // Get user projects route
        this.addRoute({
            id: 'get_user_projects',
            server,
            method: 'GET',
            path: '/api/projects',
            handler: async (req: Request, res: Response) => {
                try {
                    const userId = req.headers['user-id'] as string;
                    
                    if (!userId) {
                        return res.status(401).json({ error: 'User ID required' });
                    }

                    const result = await database.execute({
                        id: `get_projects_${Date.now()}`,
                        connection: 'main',
                        sql: 'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
                        parameters: [userId]
                    });

                    if (result.error) {
                        return res.status(500).json({ error: result.error });
                    }

                    res.json(result.result.rows);
                } catch (error) {
                    res.status(500).json({ error: error.message });
                }
            },
            middleware: []
        });

        console.log('API routes created for server:', server);
    }

    private async hashPassword(password: string): Promise<string> {
        // Simple hash for demo - in production use bcrypt
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
        // Simple token generation for demo
        return btoa(userId + '_' + Date.now());
    }
}
