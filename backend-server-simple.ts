import { SyncConcept } from "./engine/mod.ts";
import { DatabaseConcept } from "./concepts/DatabaseConcept.ts";
import { ServerConcept } from "./concepts/ServerConcept.ts";
import { UserConcept } from "./concepts/UserConcept.ts";
import { ProjectConcept } from "./concepts/ProjectConcept.ts";
import { SimulationTypeConcept } from "./concepts/SimulationTypeConcept.ts";
import { APIConcept } from "./concepts/APIConcept.ts";

// Simple environment variable loader that doesn't require external imports
async function loadEnvFile(): Promise<Record<string, string>> {
    const env: Record<string, string> = {};
    
    try {
        const envFile = await Deno.readTextFile(".env");
        const lines = envFile.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const [key, ...valueParts] = trimmedLine.split('=');
                if (key && valueParts.length > 0) {
                    const value = valueParts.join('=').trim();
                    // Remove quotes if present
                    env[key.trim()] = value.replace(/^["']|["']$/g, '');
                }
            }
        }
        console.log("✅ Environment file loaded successfully");
    } catch (error) {
        console.log("⚠️  Could not load .env file, using default values");
        console.log("💡 Create a .env file with your database configuration");
    }
    
    return env;
}

// Load environment variables
const env = await loadEnvFile();

// Initialize the sync engine
const Sync = new SyncConcept();

// Register all concepts
const concepts = {
    Database: new DatabaseConcept(),
    Server: new ServerConcept(),
    User: new UserConcept(),
    Project: new ProjectConcept(),
    SimulationType: new SimulationTypeConcept(),
    API: new APIConcept(),
};

// Instrument concepts for reactivity
const { Database, Server, User, Project, SimulationType, API } = Sync.instrument(concepts);

// Initialize the backend
async function initializeBackend() {
    console.log("🚀 Initializing Simulation Platform Backend...");

    try {
        // Get database configuration from environment variables
        const dbConfig = {
            host: env.DB_HOST || "localhost",
            port: parseInt(env.DB_PORT) || 3306,
            database: env.DB_NAME || "simulations",
            username: env.DB_USERNAME || "root",
            password: env.DB_PASSWORD || ""
        };

        console.log("📊 Database configuration:", {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            username: dbConfig.username,
            password: dbConfig.password ? "***" : "empty"
        });

        // Connect to database
        console.log("📊 Connecting to database...");
        const dbResult = await Database.connect({
            id: "main",
            ...dbConfig
        });

        let databaseConnected = false;
        if (dbResult.error) {
            console.error("❌ Database connection failed:", dbResult.error);
            console.log("⚠️  Continuing without database - guest access only");
            console.log("💡 Please ensure MySQL is running and the database exists");
            console.log("💡 Check your .env file configuration");
            console.log("💡 You can create the database with: CREATE DATABASE simulations;");
        } else {
            console.log("✅ Database connected successfully");
            databaseConnected = true;

            // Initialize database schema
            console.log("🏗️ Initializing database schema...");
            try {
                await Database.initializeSchema({ connection: "main" });
                console.log("✅ Database schema initialized");
            } catch (schemaError) {
                console.error("❌ Schema initialization failed:", schemaError);
                console.log("⚠️  Continuing without database schema - guest access only");
                databaseConnected = false;
            }

            // Set database reference for User concept
            if (databaseConnected) {
                console.log("🔗 Setting up User concept database reference...");
                User.setDatabase(concepts.Database);
                console.log("✅ User concept database reference set");
            }
        }

        // Get server configuration from environment variables
        const serverConfig = {
            port: parseInt(env.SERVER_PORT) || 3000,
            host: env.SERVER_HOST || "localhost"
        };

        // Start HTTP server
        console.log("🌐 Starting HTTP server...");
        const serverResult = Server.start({
            id: "main",
            ...serverConfig,
            config: {
                cors: true,
                bodyParser: true
            }
        });

        if (serverResult.error) {
            console.error("❌ Server start failed:", serverResult.error);
            return;
        }

        console.log(`✅ HTTP server started on http://${serverConfig.host}:${serverConfig.port}`);

        // Create API routes
        console.log("🔗 Creating API routes...");
        Server.createAPIRoutes({ server: "main", database: Database });

        // Register simulation types (only if database is connected)
        if (databaseConnected) {
            console.log("🎮 Registering simulation types...");
            try {
                const simTypeResult = await Database.execute({
                    id: "register_solar_system",
                    connection: "main",
                    sql: `INSERT INTO simulation_types (id, name, description, category, icon, thumbnail, is_active, default_config, requirements, version) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                          ON DUPLICATE KEY UPDATE 
                          name = VALUES(name), 
                          description = VALUES(description),
                          is_active = VALUES(is_active)`,
                    parameters: [
                        "solar-system",
                        "Solar System",
                        "Interactive solar system simulation with realistic orbital mechanics and inclined orbits",
                        "astronomy",
                        "🌞",
                        "/thumbnails/solar-system.jpg",
                        true,
                        JSON.stringify({
                            speed: 1.0,
                            showOrbits: true,
                            showLabels: true
                        }),
                        JSON.stringify({
                            threejs: true,
                            webgl: true
                        }),
                        "1.0"
                    ]
                });

                if (simTypeResult.error) {
                    console.error("❌ Simulation type registration failed:", simTypeResult.error);
                } else {
                    console.log("✅ Simulation types registered");
                }
            } catch (simTypeError) {
                console.error("❌ Simulation type registration failed:", simTypeError);
            }

            // Create a default guest user (only if database is connected)
            console.log("👤 Creating default guest user...");
            try {
                const guestResult = await User.createGuest({ id: "guest_default" });
                if (guestResult.error) {
                    console.error("❌ Guest user creation failed:", guestResult.error);
                } else {
                    console.log("✅ Default guest user created");
                }
            } catch (guestError) {
                console.error("❌ Guest user creation failed:", guestError);
            }
        } else {
            console.log("⚠️  Skipping database operations - guest access only mode");
        }

        console.log("🎉 Backend initialization complete!");
        console.log("📱 Frontend available at: http://localhost:8000/web/platform.html");
        console.log(`🔌 API available at: http://${serverConfig.host}:${serverConfig.port}/api`);
        console.log(`💚 Health check: http://${serverConfig.host}:${serverConfig.port}/api/health`);

    } catch (error) {
        console.error("❌ Backend initialization failed:", error);
        console.log("💡 Make sure you have a .env file with proper database configuration");
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log("\n🛑 Shutting down backend...");
    
    try {
        // Stop server
        Server.stop({ id: "main" });
        console.log("✅ Server stopped");
        
        // Disconnect database
        await Database.disconnect({ id: "main" });
        console.log("✅ Database disconnected");
        
        console.log("👋 Backend shutdown complete");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
    }
});

// Start the backend
initializeBackend();

// Export for use in other modules
export { Sync, Database, Server, User, Project, SimulationType, API };
