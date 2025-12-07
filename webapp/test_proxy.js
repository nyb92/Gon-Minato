import fetch from "node-fetch";

async function testProxy() {
    console.log("🚀 Testing Proxy connection...");
    
    const query = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?label WHERE {
            ?reg a :Region ;
                 rdfs:label ?label .
        } LIMIT 5
    `;

    try {
        const response = await fetch("http://localhost:8080/sparql", {
            method: "POST",
            headers: {
                "Content-Type": "application/sparql-query",
                "Accept": "application/sparql-results+json"
            },
            body: query
        });

        console.log(`📡 Status Code: ${response.status}`);
        const text = await response.text();
        console.log(`📦 Body Size: ${text.length} chars`);
        
        try {
            const json = JSON.parse(text);
            console.log("✅ Valid JSON received!");
            console.log("📊 Results found:", json.results.bindings.length);
            console.log("🔎 First result:", JSON.stringify(json.results.bindings[0], null, 2));
        } catch (e) {
            console.log("❌ Response is NOT valid JSON:");
            console.log(text.substring(0, 500));
        }

    } catch (err) {
        console.error("❌ Connection failed:", err.message);
    }
}

testProxy();
