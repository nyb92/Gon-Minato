const ENDPOINT = "http://localhost:8080/sparql";

let map;
let regionsData = {};
let departmentsData = {};
let geoJsonLayer;
let currentMode = 'hlm';
let currentView = 'region'; // 'region' or 'department'
let chartInstances = {};

// Cache system for SPARQL queries
const queryCache = {
    data: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes cache
    
    get(key) {
        const cached = this.data.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > this.ttl) {
            this.data.delete(key);
            return null;
        }
        
        console.log(`🎯 Cache HIT for: ${key.substring(0, 50)}...`);
        return cached.value;
    },
    
    set(key, value) {
        this.data.set(key, {
            value: value,
            timestamp: Date.now()
        });
    },
    
    clear() {
        this.data.clear();
        console.log('🗑️ Cache cleared');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await loadAllData();
    setupEventListeners();
});

function initMap() {
    map = L.map('map', {
        center: [46.603354, 1.888334], // Center of France
        zoom: 6,
        zoomControl: true
    });
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
}

function setupEventListeners() {
    document.getElementById('displayMode').addEventListener('change', (e) => {
        currentMode = e.target.value;
        updateMapColors();
    });
    
    document.getElementById('viewLevel').addEventListener('change', (e) => {
        currentView = e.target.value;
        if (currentView === 'department' && Object.keys(departmentsData).length === 0) {
            loadDepartmentsData();
        } else {
            updateMapColors();
        }
    });
    
    // Add button to clear cache (for debugging)
    const clearCacheBtn = document.getElementById('clearCache');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            queryCache.clear();
            alert('Cache vidé ! Les données seront rechargées à la prochaine requête.');
        });
    }
}

// GeoJSON structures will be populated dynamically from GraphDB
let departmentsGeoJSON = {
    "type": "FeatureCollection",
    "features": []
};

let regionsGeoJSON = {
    "type": "FeatureCollection",
    "features": []
};

async function runQuery(sparql, useCache = true) {
    // Check cache first
    if (useCache) {
        const cached = queryCache.get(sparql);
        if (cached) return cached;
    }
    
    try {
        console.log("🔍 Executing query:", sparql.substring(0, 200) + "...");
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-query',
                'Accept': 'application/sparql-results+json'
            },
            body: sparql
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ HTTP Error:", response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ Query result:", data.results.bindings.length, "rows");
        
        // Store in cache
        if (useCache) {
            queryCache.set(sparql, data.results.bindings);
        }
        
        return data.results.bindings;
    } catch (error) {
        console.error("❌ SPARQL Error:", error);
        return [];
    }
}

// Fallback coordinates for regions without geo data
function getDefaultRegionCoordinates(regionName) {
    // Coordonnées approximatives des chefs-lieux de région
    const regionCoords = {
        'ÎLE-DE-FRANCE': [2.3522, 48.8566],
        'CENTRE-VAL DE LOIRE': [1.7556, 47.7516],
        'BOURGOGNE-FRANCHE-COMTÉ': [4.8671, 47.2805],
        'NORMANDIE': [0.1578, 49.1829],
        'HAUTS-DE-FRANCE': [2.9357, 50.6292],
        'GRAND EST': [6.1757, 48.5734],
        'PAYS DE LA LOIRE': [-0.5792, 47.4784],
        'BRETAGNE': [-2.7574, 48.2020],
        'NOUVELLE-AQUITAINE': [0.1578, 45.7640],
        'OCCITANIE': [1.4442, 43.6047],
        'AUVERGNE-RHÔNE-ALPES': [4.8357, 45.7640],
        'PROVENCE-ALPES-CÔTE D\'AZUR': [5.3698, 43.9351],
        'CORSE': [9.1533, 42.0396],
        // DOM-TOM
        'GUADELOUPE': [-61.5240, 16.2650],
        'MARTINIQUE': [-61.0240, 14.6415],
        'GUYANE': [-52.3260, 4.9226],
        'LA RÉUNION': [55.5364, -21.1151],
        'MAYOTTE': [45.1662, -12.8275]
    };
    
    // Cherche avec le nom exact ou en majuscules
    const coords = regionCoords[regionName] || regionCoords[regionName.toUpperCase()];
    return coords || [2.3522, 46.6034]; // Défaut centre France
}

async function loadAllData() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
    
    // Get all regions with their geographic coordinates
    const regionsQuery = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
        SELECT DISTINCT ?reg ?label ?lat ?long WHERE {
            ?reg a :Region ;
                 rdfs:label ?label .
            OPTIONAL { ?reg geo:lat ?lat }
            OPTIONAL { ?reg geo:long ?long }
            # Filtrer pour ne garder que les régions en majuscules (sans codes)
            FILTER(
                !REGEX(STR(?label), "^[0-9]") &&
                !REGEX(STR(?label), "COM - ") &&
                !REGEX(STR(?label), "ETR - ") &&
                STR(?label) = UCASE(STR(?label))
            )
        } ORDER BY ?label
    `;
    
    console.log("📍 Fetching all regions with coordinates...");
    const regions = await runQuery(regionsQuery);
    console.log("📍 Found regions:", regions.length);
    console.log("📍 Regions details:", regions.map(r => r.label.value));
    
    if (regions.length === 0) {
        console.error("❌ No regions found! Check GraphDB connection.");
        alert("Erreur: Impossible de charger les régions. Vérifiez que GraphDB est accessible.");
        document.getElementById('loadingOverlay').classList.add('hidden');
        return;
    }
    
    // Build GeoJSON for regions
    regionsGeoJSON.features = regions.map(r => {
        const lat = parseFloat(r.lat?.value);
        const long = parseFloat(r.long?.value);
        
        // Use provided coordinates or default based on region name
        const coordinates = (lat && long) ? 
            [long, lat] : 
            getDefaultRegionCoordinates(r.label.value);
        
        return {
            type: 'Feature',
            properties: {
                nom: r.label.value,
                uri: r.reg.value
            },
            geometry: {
                type: 'Point',
                coordinates: coordinates
            }
        };
    });
    
    console.log(`✅ Built GeoJSON for ${regionsGeoJSON.features.length} regions`);
    
    // Load data for each region
    for (const region of regions) {
        const name = region.label.value;
        console.log(`📊 Loading data for: ${name}`);
        const data = await fetchRegionData(name);
        regionsData[name] = data;
        console.log(`✅ Data loaded for ${name}:`, data);
    }
    
    console.log("🎉 All data loaded:", Object.keys(regionsData));
    
    document.getElementById('loadingOverlay').classList.add('hidden');
    
    // Draw map with data
    drawRegions();
}

async function fetchRegionData(regionName) {
    // Escape region name properly for SPARQL (handle quotes and special chars)
    const escapedName = regionName.replace(/"/g, '\\"');
    
    // KPIs
    const queryLicences = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (SUM(?licences) AS ?val) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup/ :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        }
    `;
    
    const queryHLM = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (AVG(?taux) AS ?val) WHERE {
            ?depHlm :hasHousingData ?hd .
            ?hd :proportionHLM ?taux .
            BIND( STRAFTER(STR(?depHlm), "Department_") AS ?depCode ) .
            ?dep :inseeCode ?depCode ;
                 :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        }
    `;
    
    const queryPop = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (SUM(?pop) AS ?val) WHERE {
            ?reg a :Region ;
                 rdfs:label ?label ;
                 :population ?pop .
            FILTER(STR(?label) = "${escapedName}")
        }
    `;
    
    const [resLic, resHLM, resPop] = await Promise.all([
        runQuery(queryLicences),
        runQuery(queryHLM),
        runQuery(queryPop)
    ]);
    
    const totalLicences = parseFloat(resLic[0]?.val?.value || 0);
    const avgHLM = parseFloat(resHLM[0]?.val?.value || 0);
    const totalPop = parseFloat(resPop[0]?.val?.value || 0);
    const density = totalPop > 0 ? (totalLicences / totalPop) * 1000 : 0;
    
    console.log(`  📈 ${regionName}: Licences=${totalLicences}, HLM=${avgHLM}%, Pop=${totalPop}`);
    
    return {
        name: regionName,
        totalLicences,
        avgHLM,
        totalPop,
        density
    };
}

async function loadDepartmentsData() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
    
    // Get all departments with their geographic coordinates
    const departmentsQuery = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
        SELECT ?dep ?label ?code ?region ?lat ?long
        WHERE {
            ?dep a :Department .
            OPTIONAL { ?dep rdfs:label ?label }
            OPTIONAL { ?dep :inseeCode ?code }
            OPTIONAL { ?dep :locatedInRegion ?region }
            OPTIONAL { ?dep geo:lat ?lat }
            OPTIONAL { ?dep geo:long ?long }
        }
        ORDER BY ?code
    `;
    
    console.log("📍 Fetching all departments with coordinates...");
    const departments = await runQuery(departmentsQuery);
    console.log("📍 Found departments:", departments.length);
    
    if (departments.length === 0) {
        console.error("❌ No departments found!");
        alert("Aucun département trouvé dans GraphDB. Vérifiez vos données.");
        document.getElementById('loadingOverlay').classList.add('hidden');
        return;
    }
    
    // Build GeoJSON for departments
    departmentsGeoJSON.features = departments.map(d => {
        const lat = parseFloat(d.lat?.value);
        const long = parseFloat(d.long?.value);
        
        // Use provided coordinates or default to approximate position based on code
        const coordinates = (lat && long) ? [long, lat] : getDefaultCoordinates(d.code?.value);
        
        return {
            type: 'Feature',
            properties: {
                nom: d.label?.value || 'Inconnu',
                code: d.code?.value || '??',
                uri: d.dep.value
            },
            geometry: {
                type: 'Point',
                coordinates: coordinates
            }
        };
    }).filter(f => f.properties.code !== '??');
    
    console.log(`✅ Built GeoJSON for ${departmentsGeoJSON.features.length} departments`);
    
    // Batch load data for all departments in parallel
    const batchSize = 10;
    for (let i = 0; i < departments.length; i += batchSize) {
        const batch = departments.slice(i, i + batchSize);
        await Promise.all(batch.map(async (dept) => {
            const name = dept.label?.value;
            const code = dept.code?.value;
            
            if (!name || !code) {
                console.warn(`⚠️ Missing data for department:`, dept);
                return;
            }
            
            console.log(`📊 Loading data for: ${name} (${code})`);
            const data = await fetchDepartmentData(name, code);
            departmentsData[code] = { ...data, name };
        }));
        
        console.log(`✅ Loaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(departments.length / batchSize)}`);
    }
    
    console.log("🎉 All departments data loaded:", Object.keys(departmentsData).length);
    
    document.getElementById('loadingOverlay').classList.add('hidden');
    
    // Redraw map with departments
    drawMap();
}

// Fallback coordinates for departments without geo data
function getDefaultCoordinates(code) {
    // Return approximate coordinates based on department code
    // This is a fallback when geo data is not in GraphDB
    const approxCoords = {
        '01': [5.2281, 46.2044], '02': [3.6239, 49.5647], '03': [3.3406, 46.5667],
        '04': [6.2356, 44.0944], '05': [6.4978, 44.6606], '06': [7.2619, 43.7031],
        '07': [4.6006, 44.7367], '08': [4.7169, 49.7675], '09': [1.6078, 42.9661],
        '10': [4.0794, 48.2972], '11': [2.3522, 43.2130], '12': [2.5756, 44.3519],
        '13': [5.3698, 43.5297], '14': [-0.3706, 49.1829], '15': [2.6111, 45.0333],
        '16': [0.1564, 45.6500], '17': [-0.6333, 45.7500], '18': [2.3928, 47.0814],
        '19': [1.7667, 45.2667], '21': [4.8286, 47.3220], '22': [-2.7574, 48.5147],
        '23': [1.8731, 46.1667], '24': [0.7197, 45.1833], '25': [6.3608, 47.2378],
        '26': [5.0472, 44.9333], '27': [0.8950, 49.0258], '28': [1.4914, 48.4469],
        '29': [-4.1025, 48.2020], '2A': [8.7369, 41.9192], '2B': [9.1533, 42.5503],
        '30': [4.3606, 43.8378], '31': [1.4442, 43.6047], '32': [0.5883, 43.6456],
        '33': [-0.5792, 44.8378], '34': [3.8767, 43.6108], '35': [-1.6778, 48.1173],
        '36': [1.6914, 46.8108], '37': [0.6889, 47.3939], '38': [5.7331, 45.1885],
        '39': [5.5514, 46.6756], '40': [-0.4986, 43.8944], '41': [1.3292, 47.5906],
        '42': [4.3872, 45.4397], '43': [3.8847, 45.0431], '44': [-1.5536, 47.2184],
        '45': [2.3989, 47.9028], '46': [1.4411, 44.4478], '47': [0.6200, 44.2028],
        '48': [3.4997, 44.5178], '49': [-0.5631, 47.4784], '50': [-1.0833, 49.1167],
        '51': [4.3667, 49.0431], '52': [5.1394, 48.1131], '53': [-0.7703, 48.0697],
        '54': [6.1844, 48.6936], '55': [5.3906, 49.1619], '56': [-2.7574, 47.7486],
        '57': [6.1764, 49.1193], '58': [3.1611, 47.0064], '59': [3.0586, 50.6292],
        '60': [2.4156, 49.4144], '61': [0.0931, 48.4322], '62': [2.3522, 50.5166],
        '63': [3.0867, 45.7772], '64': [-0.3706, 43.2951], '65': [0.0881, 43.2333],
        '66': [2.8953, 42.6986], '67': [7.5089, 48.5734], '68': [7.3578, 47.7489],
        '69': [4.8357, 45.7640], '70': [6.1578, 47.6219], '71': [4.5556, 46.6656],
        '72': [0.1992, 48.0078], '73': [6.3703, 45.5647], '74': [6.1294, 46.0764],
        '75': [2.3522, 48.8566], '76': [1.0992, 49.4431], '77': [2.9357, 48.6047],
        '78': [1.8357, 48.8047], '79': [-0.4642, 46.3231], '80': [2.2958, 49.8942],
        '81': [2.1481, 43.9289], '82': [1.3544, 44.0181], '83': [6.1281, 43.1242],
        '84': [5.0456, 43.9492], '85': [-1.4297, 46.6706], '86': [0.3333, 46.5803],
        '87': [1.2578, 45.8336], '88': [6.4511, 48.1744], '89': [3.5681, 47.7989],
        '90': [6.8628, 47.6408], '91': [2.2357, 48.5047], '92': [2.2522, 48.8366],
        '93': [2.4522, 48.9166], '94': [2.4822, 48.7766], '95': [2.1357, 49.0547]
    };
    
    return approxCoords[code] || [2.3522, 46.6034]; // Default to center of France
}

async function fetchDepartmentData(deptName, deptCode) {
    const escapedName = deptName.replace(/"/g, '\\"');
    
    // KPIs for department
    const queryLicences = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (SUM(?licences) AS ?val) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup/ :locatedInDepartment ?dep .
            ?dep rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        }
    `;
    
    const queryHLM = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (AVG(?taux) AS ?val) WHERE {
            ?depHlm :hasHousingData ?hd .
            ?hd :proportionHLM ?taux .
            BIND( STRAFTER(STR(?depHlm), "Department_") AS ?depCode ) .
            FILTER(?depCode = "${deptCode}")
        }
    `;
    
    const queryPop = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (SUM(?pop) AS ?val) WHERE {
            ?dep a :Department ;
                 :inseeCode "${deptCode}" ;
                 :population ?pop .
        }
    `;
    
    const [resLic, resHLM, resPop] = await Promise.all([
        runQuery(queryLicences),
        runQuery(queryHLM),
        runQuery(queryPop)
    ]);
    
    const totalLicences = parseFloat(resLic[0]?.val?.value || 0);
    const avgHLM = parseFloat(resHLM[0]?.val?.value || 0);
    const totalPop = parseFloat(resPop[0]?.val?.value || 0);
    const density = totalPop > 0 ? (totalLicences / totalPop) * 1000 : 0;
    
    return {
        totalLicences,
        avgHLM,
        totalPop,
        density
    };
}

async function fetchDetailedData(regionName) {
    const escapedName = regionName.replace(/"/g, '\\"');
    
    // Sports
    const querySports = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?sportLabel (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasSport ?sport ;
                  :hasPopulationGroup ?group .
            ?group :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
            ?sport rdfs:label ?sportLabel .
        } GROUP BY ?sportLabel ORDER BY DESC(?count) LIMIT 5
    `;
    
    // Gender
    const queryGender = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?sex (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup ?group .
            ?group :sex ?sex ;
                   :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        } GROUP BY ?sex
    `;
    
    // Age
    const queryAge = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?age (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup ?group .
            ?group :age ?age ;
                   :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        } GROUP BY ?age ORDER BY ?age
    `;
    
    const [sports, gender, age] = await Promise.all([
        runQuery(querySports),
        runQuery(queryGender),
        runQuery(queryAge)
    ]);
    
    return { sports, gender, age };
}

function getColor(value, mode) {
    // Color scales based on mode
    if (mode === 'hlm') {
        // HLM: 0-30% (green to red)
        if (value > 25) return '#dc2626'; // High HLM
        if (value > 20) return '#f97316';
        if (value > 15) return '#fbbf24';
        if (value > 10) return '#a3e635';
        return '#22c55e'; // Low HLM
    } else if (mode === 'licences') {
        // Density: licences per 1000 inhabitants
        if (value > 200) return '#1e3a8a';
        if (value > 150) return '#3b82f6';
        if (value > 100) return '#60a5fa';
        if (value > 50) return '#93c5fd';
        return '#dbeafe';
    } else if (mode === 'ratio') {
        // Ratio F/H (will calculate on the fly)
        if (value > 50) return '#ec4899'; // More women
        if (value > 45) return '#f472b6';
        return '#3b82f6'; // More men
    }
    return '#9ca3af';
}

function drawRegions() {
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
    
    if (currentView === 'department') {
        drawDepartments();
        return;
    }
    
    console.log(`🗺️ Starting to draw regions...`);
    console.log(`📊 regionsGeoJSON.features:`, regionsGeoJSON.features.length);
    console.log(`📊 regionsData keys:`, Object.keys(regionsData).length);
    
    if (regionsGeoJSON.features.length === 0) {
        console.error("❌ regionsGeoJSON.features is empty!");
        alert("Aucune région à afficher. Vérifiez que les régions sont chargées.");
        return;
    }
    
    // Create circle markers for each region
    const features = [];
    
    for (const feature of regionsGeoJSON.features) {
        const regionDisplayName = feature.properties.nom;
        
        console.log(`🔍 Processing region: ${regionDisplayName}`);
        
        // Find data by matching region name (exact or case-insensitive)
        let data = regionsData[regionDisplayName];
        if (!data) {
            // Try case-insensitive match
            const loadedNames = Object.keys(regionsData);
            const matchedName = loadedNames.find(name => 
                name.toUpperCase() === regionDisplayName.toUpperCase()
            );
            if (matchedName) {
                data = regionsData[matchedName];
                console.log(`✅ Matched '${regionDisplayName}' to '${matchedName}'`);
            }
        }
        
        if (!data) {
            console.warn(`⚠️ No data found for region: ${regionDisplayName}`);
            continue;
        }
        
        let value;
        if (currentMode === 'hlm') {
            value = data.avgHLM;
        } else if (currentMode === 'licences') {
            value = data.density;
        } else {
            value = 45; // Default for ratio (to be calculated)
        }
        
        features.push({
            type: 'Feature',
            properties: {
                nom: regionDisplayName,
                value: value,
                data: data
            },
            geometry: feature.geometry
        });
    }
    
    console.log(`🗺️ Drawing ${features.length} regions on map`);
    
    if (features.length === 0) {
        console.error("❌ No features to display! Check region name matching.");
        alert("Aucune donnée à afficher sur la carte. Vérifiez les noms de régions dans GraphDB.");
        return;
    }
    
    geoJsonLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
        pointToLayer: (feature, latlng) => {
            const color = getColor(feature.properties.value, currentMode);
            return L.circle(latlng, {
                radius: 40000, // Fixed radius for clarity
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            });
        },
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            
            layer.bindTooltip(`
                <strong>${props.nom}</strong><br>
                ${currentMode === 'hlm' ? 
                    `Taux HLM: ${props.value.toFixed(1)}%` : 
                    `Densité: ${props.value.toFixed(1)} lic./1000 hab.`
                }
            `, {
                permanent: false,
                direction: 'top'
            });
            
            layer.on('click', () => {
                openPanel(props.nom);
            });
        }
    }).addTo(map);
    
    updateLegend();
}

function drawDepartments() {
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }
    
    // Create circle markers for each department
    const features = departmentsGeoJSON.features.map(feature => {
        const deptCode = feature.properties.code;
        const deptName = feature.properties.nom;
        const data = departmentsData[deptCode];
        
        if (!data) {
            console.warn(`⚠️ No data found for department: ${deptName} (${deptCode})`);
            return null;
        }
        
        let value;
        if (currentMode === 'hlm') {
            value = data.avgHLM;
        } else if (currentMode === 'licences') {
            value = data.density;
        } else {
            value = 45; // Default for ratio
        }
        
        return {
            type: 'Feature',
            properties: {
                nom: deptName,
                code: deptCode,
                value: value,
                data: data
            },
            geometry: feature.geometry
        };
    }).filter(f => f !== null);
    
    console.log(`🗺️ Drawing ${features.length} departments on map`);
    
    if (features.length === 0) {
        console.error("❌ No department features to display!");
        return;
    }
    
    geoJsonLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
        pointToLayer: (feature, latlng) => {
            const color = getColor(feature.properties.value, currentMode);
            return L.circle(latlng, {
                radius: 20000, // Smaller radius for departments
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            });
        },
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            
            layer.bindTooltip(`
                <strong>${props.nom} (${props.code})</strong><br>
                ${currentMode === 'hlm' ? 
                    `Taux HLM: ${props.value.toFixed(1)}%` : 
                    `Densité: ${props.value.toFixed(1)} lic./1000 hab.`
                }
            `, {
                permanent: false,
                direction: 'top'
            });
            
            layer.on('click', () => {
                openDepartmentPanel(props.code, props.nom);
            });
        }
    }).addTo(map);
    
    updateLegend();
}

function drawMap() {
    if (currentView === 'region') {
        drawRegions();
    } else {
        drawDepartments();
    }
}

function updateMapColors() {
    drawMap();
}

function updateLegend() {
    const legendContent = document.getElementById('legendContent');
    
    let items = [];
    if (currentMode === 'hlm') {
        items = [
            { color: '#22c55e', label: '< 10%' },
            { color: '#a3e635', label: '10-15%' },
            { color: '#fbbf24', label: '15-20%' },
            { color: '#f97316', label: '20-25%' },
            { color: '#dc2626', label: '> 25%' }
        ];
    } else if (currentMode === 'licences') {
        items = [
            { color: '#dbeafe', label: '< 50' },
            { color: '#93c5fd', label: '50-100' },
            { color: '#60a5fa', label: '100-150' },
            { color: '#3b82f6', label: '150-200' },
            { color: '#1e3a8a', label: '> 200' }
        ];
    }
    
    legendContent.innerHTML = items.map(item => `
        <div class="legend-item">
            <div class="legend-color" style="background-color: ${item.color}"></div>
            <span>${item.label}</span>
        </div>
    `).join('');
}

async function openPanel(regionName) {
    const panel = document.getElementById('regionPanel');
    // Try to find data with case-insensitive match
    let data = regionsData[regionName];
    if (!data) {
        const loadedNames = Object.keys(regionsData);
        const matchedName = loadedNames.find(name => 
            name.toUpperCase() === regionName.toUpperCase()
        );
        if (matchedName) {
            data = regionsData[matchedName];
            regionName = matchedName; // Use the actual name for queries
        }
    }
    
    if (!data) {
        console.error(`❌ No data for region: ${regionName}`);
        return;
    }
    
    // Update basic info
    document.getElementById('panelTitle').textContent = regionName;
    document.getElementById('panelLicences').textContent = new Intl.NumberFormat('fr-FR').format(data.totalLicences);
    document.getElementById('panelHLM').textContent = data.avgHLM.toFixed(1) + '%';
    document.getElementById('panelPop').textContent = new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(data.totalPop);
    
    // Fetch detailed data
    panel.classList.add('active');
    const detailed = await fetchDetailedData(regionName);
    
    // Top sport
    const topSport = detailed.sports.length > 0 ? detailed.sports[0].sportLabel.value : 'N/A';
    document.getElementById('panelTopSport').textContent = topSport;
    
    // Render charts
    renderPanelCharts(detailed);
}

async function openDepartmentPanel(deptCode, deptName) {
    const panel = document.getElementById('regionPanel');
    const data = departmentsData[deptCode];
    
    if (!data) {
        console.error(`❌ No data for department: ${deptName}`);
        return;
    }
    
    // Update basic info
    document.getElementById('panelTitle').textContent = `${deptName} (${deptCode})`;
    document.getElementById('panelLicences').textContent = new Intl.NumberFormat('fr-FR').format(data.totalLicences);
    document.getElementById('panelHLM').textContent = data.avgHLM.toFixed(1) + '%';
    document.getElementById('panelPop').textContent = new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(data.totalPop);
    
    // Fetch detailed data for department
    panel.classList.add('active');
    const detailed = await fetchDepartmentDetailedData(data.name);
    
    // Top sport
    const topSport = detailed.sports.length > 0 ? detailed.sports[0].sportLabel.value : 'N/A';
    document.getElementById('panelTopSport').textContent = topSport;
    
    // Render charts
    renderPanelCharts(detailed);
}

async function fetchDepartmentDetailedData(deptName) {
    const escapedName = deptName.replace(/"/g, '\\"');
    
    // Sports
    const querySports = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?sportLabel (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasSport ?sport ;
                  :hasPopulationGroup ?group .
            ?group :locatedInDepartment ?dep .
            ?dep rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
            ?sport rdfs:label ?sportLabel .
        } GROUP BY ?sportLabel ORDER BY DESC(?count) LIMIT 5
    `;
    
    // Gender
    const queryGender = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?sex (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup ?group .
            ?group :sex ?sex ;
                   :locatedInDepartment ?dep .
            ?dep rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        } GROUP BY ?sex
    `;
    
    // Age
    const queryAge = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?age (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup ?group .
            ?group :age ?age ;
                   :locatedInDepartment ?dep .
            ?dep rdfs:label ?label .
            FILTER(STR(?label) = "${escapedName}")
        } GROUP BY ?age ORDER BY ?age
    `;
    
    const [sports, gender, age] = await Promise.all([
        runQuery(querySports),
        runQuery(queryGender),
        runQuery(queryAge)
    ]);
    
    return { sports, gender, age };
}

function closePanel() {
    document.getElementById('regionPanel').classList.remove('active');
}

function renderPanelCharts(data) {
    const primaryColor = '#3b82f6';
    const secondaryColor = '#ec4899';
    const accentColor = '#10b981';
    
    // Clear previous charts
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
    
    // 1. Sports Chart
    const sportCtx = document.getElementById('panelSportChart').getContext('2d');
    chartInstances.sport = new Chart(sportCtx, {
        type: 'bar',
        data: {
            labels: data.sports.map(s => s.sportLabel.value),
            datasets: [{
                label: 'Licenciés',
                data: data.sports.map(s => s.count.value),
                backgroundColor: accentColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { display: false },
                y: { 
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
    
    // 2. Gender Chart
    const genderCtx = document.getElementById('panelGenderChart').getContext('2d');
    chartInstances.gender = new Chart(genderCtx, {
        type: 'doughnut',
        data: {
            labels: data.gender.map(g => g.sex.value === 'F' ? 'Femmes' : 'Hommes'),
            datasets: [{
                data: data.gender.map(g => g.count.value),
                backgroundColor: [secondaryColor, primaryColor],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { font: { size: 10 } }
                }
            }
        }
    });
    
    // 3. Age Chart
    const ageCtx = document.getElementById('panelAgeChart').getContext('2d');
    chartInstances.age = new Chart(ageCtx, {
        type: 'bar',
        data: {
            labels: data.age.map(a => a.age.value),
            datasets: [{
                label: 'Licenciés',
                data: data.age.map(a => a.count.value),
                backgroundColor: primaryColor,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { 
                    ticks: { font: { size: 9 } }
                },
                y: { 
                    ticks: { font: { size: 9 } }
                }
            }
        }
    });
}
