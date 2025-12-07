import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = 8080;
const GRAPHDB_ENDPOINT = "http://127.0.0.1:7200/repositories/Gon";

// Middleware CORS explicit configuration
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
}));

// Explicitly handle Preflight OPTIONS requests for the specific route
app.options("/sparql", cors());

// Parse body
app.use(express.text({ type: "*/*" }));

app.post("/sparql", async (req, res) => {
    console.log(`📥 Reçu requête SPARQL (Length: ${req.body.length})`);
    console.log(`📝 Query Preview: ${req.body.substring(0, 100)}...`);

    try {
        const response = await fetch(GRAPHDB_ENDPOINT, {
            method: "POST",
            headers: { 
                "Content-Type": "application/sparql-query",
                "Accept": "application/sparql-results+json"
            },
            body: req.body
        });

        const text = await response.text();
        const status = response.status;

        console.log(`📤 Réponse GraphDB: Status ${status}, Size ${text.length} chars`);
        
        if (status !== 200) {
            console.log(`❌ GraphDB Error Body: ${text}`);
        }

        // Force CORS headers on the response
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", "application/sparql-results+json");

        res.status(status).send(text);

    } catch (err) {
        console.error("❌ Erreur Proxy:", err.message);
        res.status(500).send("Erreur proxy : " + err.message);
    }
});

app.listen(PORT, () => {
    console.log(`
    🚀 Proxy SPARQL actif !
    📡 Écoute sur : http://localhost:${PORT}/sparql
    🎯 Cible : ${GRAPHDB_ENDPOINT}
    `);
});