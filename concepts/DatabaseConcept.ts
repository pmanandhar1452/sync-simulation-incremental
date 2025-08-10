import mysql from 'mysql2/promise';

interface ConnectionData {
    id: string;
    host: string;
    port: number;
    database: string;
    username: string;
    isConnected: boolean;
    lastUsed: number;
    connection?: mysql.Connection;
}

interface QueryData {
    id: string;
    connection: string;
    sql: string;
    parameters: any[] | Record<string, any>;
    result: any;
    executedAt: number;
}

export class DatabaseConcept {
    private connections: Map<string, ConnectionData> = new Map();
    private queries: Map<string, QueryData> = new Map();

    async connect({ id, host, port, database, username, password }: {
        id: string;
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
    }) {
        try {
            const connection = await mysql.createConnection({
                host,
                port,
                user: username,
                password,
                database
            });

            const connectionData: ConnectionData = {
                id,
                host,
                port,
                database,
                username,
                isConnected: true,
                lastUsed: Date.now(),
                connection
            };

            this.connections.set(id, connectionData);
            console.log(`Database connected: ${id} to ${host}:${port}/${database}`);
            return { id };
        } catch (error) {
            console.error(`Database connection failed: ${error}`);
            return { error: `Connection failed: ${error}` };
        }
    }

    async disconnect({ id }: { id: string }) {
        const connectionData = this.connections.get(id);
        if (connectionData && connectionData.connection) {
            try {
                await connectionData.connection.end();
                connectionData.isConnected = false;
                console.log(`Database disconnected: ${id}`);
            } catch (error) {
                console.error(`Database disconnect error: ${error}`);
            }
        }
        return { id };
    }

    async execute({ id, connection, sql, parameters }: {
        id: string;
        connection: string;
        sql: string;
        parameters: any[] | Record<string, any>;
    }) {
        const connectionData = this.connections.get(connection);
        if (!connectionData || !connectionData.connection) {
            return { error: 'Database connection not found' };
        }

        try {
            // Convert object parameters to array if needed for MySQL2
            let paramArray: any[];
            if (Array.isArray(parameters)) {
                paramArray = parameters;
            } else {
                // Extract values from object in order they appear in SQL
                paramArray = Object.values(parameters);
            }

            const [rows] = await connectionData.connection.execute(sql, paramArray);
            connectionData.lastUsed = Date.now();

            const queryData: QueryData = {
                id,
                connection,
                sql,
                parameters,
                result: { rows },
                executedAt: Date.now()
            };

            this.queries.set(id, queryData);
            console.log(`Query executed: ${id}`, { sql, parameters: paramArray });
            return { id, result: { rows } };
        } catch (error) {
            console.error(`Query execution failed: ${error}`);
            return { error: `Query failed: ${error}` };
        }
    }

    async beginTransaction({ connection }: { connection: string }) {
        const connectionData = this.connections.get(connection);
        if (!connectionData || !connectionData.connection) {
            return { error: 'Database connection not found' };
        }

        try {
            await connectionData.connection.beginTransaction();
            const transactionId = `tx_${Date.now()}`;
            console.log(`Transaction started: ${transactionId}`);
            return { transactionId };
        } catch (error) {
            console.error(`Transaction start failed: ${error}`);
            return { error: `Transaction failed: ${error}` };
        }
    }

    async commitTransaction({ connection, transactionId }: { connection: string; transactionId: string }) {
        const connectionData = this.connections.get(connection);
        if (!connectionData || !connectionData.connection) {
            return { error: 'Database connection not found' };
        }

        try {
            await connectionData.connection.commit();
            console.log(`Transaction committed: ${transactionId}`);
            return { transactionId };
        } catch (error) {
            console.error(`Transaction commit failed: ${error}`);
            return { error: `Commit failed: ${error}` };
        }
    }

    async rollbackTransaction({ connection, transactionId }: { connection: string; transactionId: string }) {
        const connectionData = this.connections.get(connection);
        if (!connectionData || !connectionData.connection) {
            return { error: 'Database connection not found' };
        }

        try {
            await connectionData.connection.rollback();
            console.log(`Transaction rolled back: ${transactionId}`);
            return { transactionId };
        } catch (error) {
            console.error(`Transaction rollback failed: ${error}`);
            return { error: `Rollback failed: ${error}` };
        }
    }

    _getConnection({ id }: { id: string }) {
        const connection = this.connections.get(id);
        if (connection) {
            const { connection: _, ...connectionInfo } = connection;
            return [connectionInfo];
        }
        return [];
    }

    _getActiveConnections() {
        return Array.from(this.connections.values()).map(conn => {
            const { connection: _, ...connectionInfo } = conn;
            return connectionInfo;
        }).filter(conn => conn.isConnected);
    }

    _getQuery({ id }: { id: string }) {
        const query = this.queries.get(id);
        return query ? [query] : [];
    }

    // Helper method to initialize database schema
    async initializeSchema({ connection }: { connection: string }) {
        console.log("Creating database tables...");
        
        const schema = `
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at BIGINT NOT NULL,
                last_login BIGINT,
                is_guest BOOLEAN DEFAULT FALSE,
                preferences JSON
            );

            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                created_at BIGINT NOT NULL,
                updated_at BIGINT NOT NULL,
                is_public BOOLEAN DEFAULT FALSE,
                thumbnail TEXT,
                config JSON,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS simulation_types (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(255),
                icon VARCHAR(255),
                thumbnail TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                default_config JSON,
                requirements JSON,
                version VARCHAR(255)
            );
        `;

        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
                try {
                    console.log(`Executing schema statement ${i + 1}/${statements.length}...`);
                    const result = await this.execute({
                        id: `schema_${i}_${Date.now()}`,
                        connection,
                        sql: statement,
                        parameters: [] // Changed from {} to [] for MySQL2 compatibility
                    });
                    
                    if (result.error) {
                        console.error(`Schema statement ${i + 1} failed:`, result.error);
                        throw new Error(`Schema initialization failed at statement ${i + 1}: ${result.error}`);
                    }
                } catch (error) {
                    console.error(`Schema statement ${i + 1} failed:`, error);
                    throw error;
                }
            }
        }

        console.log('✅ Database schema initialized successfully');
    }
}
