import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

// Import concepts directly
import { UserConcept } from "./concepts/UserConcept.ts";
import { SessionConcept } from "./concepts/SessionConcept.ts";
import { SimulationStorageConcept } from "./concepts/SimulationStorageConcept.ts";

// Initialize concepts
const User = new UserConcept();
const Session = new SessionConcept();
const SimulationStorage = new SimulationStorageConcept();

// Generate unique IDs
function generateId(): string {
    return crypto.randomUUID();
}

// Parse JSON request body
async function parseJsonBody(request: Request): Promise<any> {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

// Extract token from Authorization header
function extractToken(request: Request): string | null {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7);
    }
    return null;
}

// Validate user session
async function validateSession(token: string): Promise<{ userId: string; username: string } | null> {
    if (!token) return null;

    // Find session by token
    const sessions = Session._getByToken(token);
    if (sessions.length === 0) return null;

    const session = sessions[0];
    if (!session.active) return null;

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
        Session.invalidate(session.id, token);
        return null;
    }

    // Get user info
    const users = User._getById(session.userId);
    if (users.length === 0) return null;

    return {
        userId: users[0].id,
        username: users[0].username
    };
}

// Handle API requests
async function handleApiRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    console.log(`${method} ${path}`);

    // Handle authentication endpoints
    if (path === "/api/auth/register" && method === "POST") {
        const body = await parseJsonBody(request);
        const { username, email, password } = body;

        console.log(`🔐 Registration attempt: ${username} (${email})`);

        const userId = generateId();
        const result = await User.register(userId, username, email, password);

        if ("error" in result) {
            console.log(`❌ Registration failed: ${result.error}`);
            return new Response(JSON.stringify({ success: false, error: result.error }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log(`✅ Registration successful: ${username} -> ${result.id}`);
        return new Response(JSON.stringify({ 
            success: true, 
            userId: result.id, 
            message: "User registered successfully" 
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "/api/auth/login" && method === "POST") {
        const body = await parseJsonBody(request);
        const { username, password } = body;

        console.log(`🔑 Login attempt: ${username}`);

        const result = await User.login(username, password);

        if ("error" in result) {
            console.log(`❌ Login failed: ${result.error}`);
            return new Response(JSON.stringify({ success: false, error: result.error }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log(`✅ Login successful: ${username} -> ${result.id}`);

        // Create session
        const sessionId = generateId();
        const sessionResult = Session.create(sessionId, result.id, result.token, 3600);

        if ("error" in sessionResult) {
            console.log(`❌ Session creation failed: ${sessionResult.error}`);
            return new Response(JSON.stringify({ success: false, error: "Failed to create session" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log(`✅ Session created: ${sessionId}`);
        return new Response(JSON.stringify({ 
            success: true, 
            userId: result.id, 
            token: result.token,
            message: "Login successful" 
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "/api/auth/logout" && method === "POST") {
        const token = extractToken(request);
        if (!token) {
            return new Response(JSON.stringify({ success: false, error: "No token provided" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const sessions = Session._getByToken(token);
        if (sessions.length > 0) {
            Session.invalidate(sessions[0].id, token);
        }

        return new Response(JSON.stringify({ success: true, message: "Logout successful" }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // Handle simulation endpoints
    if (path === "/api/simulations/save" && method === "POST") {
        const token = extractToken(request);
        const user = await validateSession(token);
        
        if (!user) {
            return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const body = await parseJsonBody(request);
        const { name, description, simulationData, isPublic } = body;

        const storageId = generateId();
        const result = SimulationStorage.save(storageId, user.userId, name, description, simulationData, isPublic);

        if ("error" in result) {
            return new Response(JSON.stringify({ success: false, error: result.error }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            storageId: result.id,
            message: "Simulation saved successfully" 
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "/api/simulations/load" && method === "GET") {
        const url = new URL(request.url);
        const storageId = url.searchParams.get("storageId");
        const userId = url.searchParams.get("userId") || "guest";

        if (!storageId) {
            return new Response(JSON.stringify({ success: false, error: "Storage ID required" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const result = SimulationStorage.load(storageId, userId);

        if ("error" in result) {
            return new Response(JSON.stringify({ success: false, error: result.error }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            storageId: result.id,
            name: result.name,
            description: result.description,
            simulationData: result.simulationData,
            isPublic: result.isPublic
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "/api/simulations/list" && method === "GET") {
        const url = new URL(request.url);
        const userId = url.searchParams.get("userId");
        const token = extractToken(request);

        if (!userId || !token) {
            return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const user = await validateSession(token);
        if (!user || user.userId !== userId) {
            return new Response(JSON.stringify({ success: false, error: "Access denied" }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        const simulations = SimulationStorage._getByUserId(userId);
        return new Response(JSON.stringify({ success: true, simulations }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    if (path === "/api/simulations/public" && method === "GET") {
        const simulations = SimulationStorage._getPublic();
        return new Response(JSON.stringify({ success: true, simulations }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // Default response for unknown endpoints
    return new Response(JSON.stringify({ success: false, error: "Endpoint not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
    });
}

// Serve static files
async function serveStaticFile(request: Request): Promise<Response> {
    const url = new URL(request.url);
    let path = url.pathname;

    // Default to index.html for root
    if (path === "/") {
        path = "/user-app.html";
    }

    // Remove leading slash for file path
    const filePath = path.startsWith("/") ? path.slice(1) : path;

    try {
        const file = await Deno.readFile(join("web", filePath));
        const contentType = getContentType(filePath);
        
        return new Response(file, {
            headers: { "Content-Type": contentType }
        });
    } catch {
        return new Response("File not found", { status: 404 });
    }
}

// Get content type based on file extension
function getContentType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "html": return "text/html";
        case "js": return "application/javascript";
        case "css": return "text/css";
        case "png": return "image/png";
        case "jpg":
        case "jpeg": return "image/jpeg";
        case "ico": return "image/x-icon";
        case "svg": return "image/svg+xml";
        default: return "text/plain";
    }
}

// Main request handler
async function handler(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        });
    }

    // Add CORS headers to all responses
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    try {
        // Handle API requests
        if (path.startsWith("/api/")) {
            const response = await handleApiRequest(request);
            
            // Add CORS headers to API responses
            const newHeaders = new Headers(response.headers);
            Object.entries(corsHeaders).forEach(([key, value]) => {
                newHeaders.set(key, value);
            });

            return new Response(response.body, {
                status: response.status,
                headers: newHeaders
            });
        }

        // Serve static files
        const response = await serveStaticFile(request);
        
        // Add CORS headers to static file responses
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
        });

        return new Response(response.body, {
            status: response.status,
            headers: newHeaders
        });

    } catch (error) {
        console.error("Server error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                ...corsHeaders
            }
        });
    }
}

// Start the server
const port = 8000;
console.log(`Server running on http://localhost:${port}`);

// Clean up expired sessions periodically
setInterval(() => {
    Session.cleanup(Date.now());
}, 60000); // Clean up every minute

await serve(handler, { port });
