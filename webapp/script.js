const ENDPOINT = "http://localhost:8080/sparql";

// State
let compareMode = false;
let currentGenderFilter = 'All';
let chartInstances = {};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    fetchRegions();
    fetchNationalRanking(); // Load ranking table on start
    setupEventListeners();
});

function setupEventListeners() {
    // Compare Toggle
    const toggle = document.getElementById('compareToggle');
    toggle.addEventListener('change', (e) => {
        compareMode = e.target.checked;
        const region2Group = document.getElementById('group-region-2');
        const radarContainer = document.getElementById('radar-container');
        const singleMetrics = document.getElementById('single-metrics');
        const compMetrics = document.getElementById('comparison-metrics');

        if (compareMode) {
            region2Group.classList.remove('hidden');
            radarContainer.classList.remove('hidden');
            singleMetrics.classList.add('hidden');
            compMetrics.classList.remove('hidden');
        } else {
            region2Group.classList.add('hidden');
            radarContainer.classList.add('hidden');
            singleMetrics.classList.remove('hidden');
            compMetrics.classList.add('hidden');
        }
    });

    // Gender Buttons
    document.querySelectorAll('.gender-toggle button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update UI
            document.querySelectorAll('.gender-toggle button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update State & Chart
            currentGenderFilter = e.target.dataset.sex;
            // Re-run analysis if a region is selected to refresh charts
            if (document.getElementById('regionSelect').value) {
                runAnalysis();
            }
        });
    });
}

// Helper: Run SPARQL Query
async function runQuery(sparql) {
    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sparql-query',
                'Accept': 'application/sparql-results+json'
            },
            body: sparql
        });
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        return data.results.bindings;
    } catch (error) {
        console.error("Erreur SPARQL:", error);
        return [];
    }
}

// 1. Fetch Regions for Dropdowns
async function fetchRegions() {
    const query = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?label WHERE {
            ?reg a :Region ;
                 rdfs:label ?label .
        } ORDER BY ?label
    `;
    
    const results = await runQuery(query);
    const select1 = document.getElementById('regionSelect');
    const select2 = document.getElementById('regionSelect2');
    
    // Clear & Populate
    const html = '<option value="" disabled selected>-- Sélectionnez --</option>' + 
        results.map(r => `<option value="${r.label.value}">${r.label.value}</option>`).join('');

    select1.innerHTML = html;
    select2.innerHTML = html;
}

// 2. Main Analysis Function
async function runAnalysis() {
    const region1 = document.getElementById('regionSelect').value;
    const region2 = document.getElementById('regionSelect2').value;

    if (!region1) {
        alert("Veuillez sélectionner au moins la Région A !");
        return;
    }
    if (compareMode && !region2) {
        alert("En mode comparaison, sélectionnez aussi la Région B !");
        return;
    }

    // UI Updates
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');

    try {
        // Fetch Data for Region 1
        const data1 = await fetchAllRegionData(region1);
        let data2 = null;

        if (compareMode) {
            data2 = await fetchAllRegionData(region2);
        }

        // Update UI
        updateCharts(data1, data2);
        updateKPIs(data1, data2);
        
        if (compareMode) {
            updateRadarChart(data1, data2);
            generateComparisonInsight(data1, data2);
        } else {
            generateInsight(data1);
        }

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        document.getElementById('loading').classList.add('hidden');
        alert("Une erreur est survenue lors de l'analyse.");
    }
}

async function fetchAllRegionData(regionName) {
    const [kpi, age, sport, gender] = await Promise.all([
        fetchKPIs(regionName),
        fetchAgeData(regionName),
        fetchTopSports(regionName, currentGenderFilter), // Pass gender filter
        fetchGenderData(regionName)
    ]);

    return {
        name: regionName,
        kpi, age, sport, gender
    };
}

// --- Specific Data Fetchers ---

async function fetchKPIs(region) {
    // Note: Breaking into two simpler queries for safety against empty sets
    const queryLicences = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT (SUM(?licences) AS ?val) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup/ :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${region}")
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
            FILTER(STR(?label) = "${region}")
        }
    `;

    const [resLicences, resHLM] = await Promise.all([runQuery(queryLicences), runQuery(queryHLM)]);
    
    return {
        totalLicences: parseFloat(resLicences[0]?.val?.value || 0),
        avgHLM: parseFloat(resHLM[0]?.val?.value || 0)
    };
}

async function fetchAgeData(region) {
    const query = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?age (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup ?group .
            ?group :age ?age ;
                   :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${region}")
        } GROUP BY ?age ORDER BY ?age
    `;
    return await runQuery(query);
}

async function fetchTopSports(region, sexFilter) {
    let filterClause = "";
    if (sexFilter !== 'All') {
        filterClause = `?group :sex "${sexFilter}" .`;
    }

    const query = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?sportLabel (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasSport ?sport ;
                  :hasPopulationGroup ?group .
            
            ${filterClause}

            ?group :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${region}")
            ?sport rdfs:label ?sportLabel .
        } GROUP BY ?sportLabel ORDER BY DESC(?count) LIMIT 5
    `;
    return await runQuery(query);
}

async function fetchGenderData(region) {
    const query = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?sex (SUM(?licences) AS ?count) WHERE {
            ?part :numLicences ?licences ;
                  :hasPopulationGroup ?group .
            ?group :sex ?sex ;
                   :locatedInDepartment/ :locatedInRegion ?reg .
            ?reg rdfs:label ?label .
            FILTER(STR(?label) = "${region}")
        } GROUP BY ?sex
    `;
    return await runQuery(query);
}

async function fetchNationalRanking() {
    const query = `
        PREFIX : <http://example.org/sport-hlm#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?regLabel (SUM(?licences) AS ?total) (AVG(?taux) AS ?hlm) WHERE {
             # Get Licences
             {
                 SELECT ?reg (SUM(?l) as ?licences) WHERE {
                     ?p :numLicences ?l ;
                        :hasPopulationGroup/ :locatedInDepartment/ :locatedInRegion ?reg .
                 } GROUP BY ?reg
             }
             # Get HLM
             {
                 SELECT ?reg (AVG(?t) as ?taux) WHERE {
                     ?d :hasHousingData/ :proportionHLM ?t ;
                        :locatedInRegion ?reg .
                 } GROUP BY ?reg
             }
             ?reg rdfs:label ?regLabel .
        } GROUP BY ?regLabel ORDER BY DESC(?total) LIMIT 10
    `;

    const data = await runQuery(query);
    const tbody = document.querySelector("#rankingTable tbody");
    tbody.innerHTML = "";

    data.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${row.regLabel.value}</td>
            <td>${parseInt(row.total.value).toLocaleString()}</td>
            <td>${parseFloat(row.hlm.value || 0).toFixed(1)}%</td>
            <td>-</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- UI Updaters ---

function updateKPIs(data1, data2) {
    const fmt = new Intl.NumberFormat('fr-FR');
    
    // Single View
    if (!compareMode) {
        document.getElementById('kpi-licences').textContent = fmt.format(data1.kpi.totalLicences);
        document.getElementById('kpi-hlm').textContent = data1.kpi.avgHLM.toFixed(1) + " %";
        const topSport = data1.sport.length > 0 ? data1.sport[0].sportLabel.value : "N/A";
        document.getElementById('kpi-top-sport').textContent = topSport;
    } else {
        // Comparison View (Diffs)
        const diffLic = data1.kpi.totalLicences - data2.kpi.totalLicences;
        const diffHlm = data1.kpi.avgHLM - data2.kpi.avgHLM;

        const signLic = diffLic > 0 ? "+" : "";
        const signHlm = diffHlm > 0 ? "+" : "";

        document.getElementById('comp-diff-licences').textContent = `${signLic}${fmt.format(diffLic)}`;
        document.getElementById('comp-diff-hlm').textContent = `${signHlm}${diffHlm.toFixed(1)} %`;
        
        // Color coding
        document.getElementById('comp-diff-licences').style.color = diffLic > 0 ? 'green' : 'red';
    }
}

function generateInsight(data) {
    const topSport = data.sport.length > 0 ? data.sport[0].sportLabel.value : "...";
    let text = `En <strong>${data.name}</strong>, on compte <strong>${new Intl.NumberFormat('fr-FR').format(data.kpi.totalLicences)}</strong> licences sportives. `;
    text += `Le taux moyen de logements HLM est de <strong>${data.kpi.avgHLM.toFixed(1)}%</strong>. `;
    text += `Le sport le plus populaire (${currentGenderFilter === 'All' ? 'Tous' : currentGenderFilter}) est : <strong>${topSport}</strong>.`;
    document.getElementById('insight-text').innerHTML = text;
}

function generateComparisonInsight(d1, d2) {
    const gap = d1.kpi.avgHLM - d2.kpi.avgHLM;
    let text = `Comparaison : <strong>${d1.name}</strong> vs <strong>${d2.name}</strong>.<br>`;
    
    if (Math.abs(gap) < 2) {
        text += "Ces deux régions ont un taux de logement social similaire.";
    } else if (gap > 0) {
        text += `${d1.name} a plus de logements sociaux (+${gap.toFixed(1)} pts).`;
    } else {
        text += `${d2.name} a plus de logements sociaux (+${Math.abs(gap).toFixed(1)} pts).`;
    }
    document.getElementById('insight-text').innerHTML = text;
}

// --- Chart Updates ---

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        chartInstances[id] = null;
    }
}

function updateCharts(data1, data2) {
    const primaryColor = '#3b82f6';
    const secondaryColor = '#ec4899';
    const accentColor = '#10b981';
    const textColor = '#334155';
    const mutedTextColor = '#64748b';
    const gridColor = '#e2e8f0';

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = mutedTextColor;

    // Helper to get common chart options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    boxWidth: 12,
                    padding: 10,
                    font: {
                        size: 11 // Smaller legend
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(0,0,0,0.8)',
                borderWidth: 1,
                cornerRadius: 4,
                padding: 8,
                titleFont: { size: 12 },
                bodyFont: { size: 11 }
            }
        },
        scales: {
            x: {
                grid: {
                    color: gridColor,
                    borderColor: gridColor,
                    tickLength: 5
                },
                ticks: {
                    color: mutedTextColor,
                    font: { size: 10 } // Smaller axis labels
                }
            },
            y: {
                grid: {
                    color: gridColor,
                    borderColor: gridColor,
                    tickLength: 5
                },
                ticks: {
                    color: mutedTextColor,
                    font: { size: 10 } // Smaller axis labels
                }
            }
        }
    };

    // 1. Age Chart (Multi-bar if comparison)
    const ageCtx = document.getElementById('ageChart').getContext('2d');
    destroyChart('age');

    const datasets = [{
        label: data1.name,
        data: data1.age.map(r => r.count.value),
        backgroundColor: primaryColor,
        borderRadius: 4
    }];

    if (compareMode && data2) {
        datasets.push({
            label: data2.name,
            data: data2.age.map(r => r.count.value),
            backgroundColor: secondaryColor,
            borderRadius: 4
        });
    }

    chartInstances['age'] = new Chart(ageCtx, {
        type: 'bar',
        data: {
            labels: data1.age.map(r => r.age.value),
            datasets: datasets
        },
        options: { ...commonOptions }
    });

    // 2. Sport Chart (Top 5 of Region 1)
    const sportCtx = document.getElementById('sportChart').getContext('2d');
    destroyChart('sport');

    chartInstances['sport'] = new Chart(sportCtx, {
        type: 'bar',
        data: {
            labels: data1.sport.map(r => r.sportLabel.value),
            datasets: [{
                label: `Licenciés (${currentGenderFilter === 'All' ? 'Tous' : currentGenderFilter}) - ${data1.name}`,
                data: data1.sport.map(r => r.count.value),
                backgroundColor: accentColor,
                borderRadius: 4
            }]
        },
        options: { 
            ...commonOptions,
            indexAxis: 'y',
            scales: {
                x: {
                    grid: { color: gridColor, borderColor: gridColor },
                    ticks: { color: mutedTextColor }
                },
                y: {
                    grid: { color: gridColor, borderColor: gridColor },
                    ticks: { color: mutedTextColor }
                }
            }
        }
    });

    // 3. Gender Chart (Only Region 1 for clarity, or nested doughnut?)
    const genderCtx = document.getElementById('genderChart').getContext('2d');
    destroyChart('gender');
    
    chartInstances['gender'] = new Chart(genderCtx, {
        type: 'doughnut',
        data: {
            labels: data1.gender.map(r => r.sex.value === 'F' ? 'Femmes' : 'Hommes'),
            datasets: [{
                data: data1.gender.map(r => r.count.value),
                backgroundColor: [secondaryColor, primaryColor],
                borderColor: 'var(--card-bg)', // Use card background for separator
                borderWidth: 2
            }]
        },
        options: { 
            ...commonOptions,
            scales: {
                x: { display: false },
                y: { display: false }
            },
            plugins: {
                ...commonOptions.plugins,
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function updateRadarChart(d1, d2) {
    const primaryColor = '#3b82f6';
    const secondaryColor = '#ec4899';
    const textColor = '#334155';
    const mutedTextColor = '#64748b'; // Defined here
    const gridColor = '#e2e8f0';

    const ctx = document.getElementById('radarChart').getContext('2d');
    destroyChart('radar');
    
    const getMetrics = (d) => {
        const total = d.kpi.totalLicences;
        const women = d.gender.find(r => r.sex.value === 'F')?.count.value || 0;
        const ratioF = (women / total) * 100;
        return [
            d.kpi.avgHLM,
            ratioF,
            Math.min(100, (Math.log10(total > 0 ? total : 1) / Math.log10(100000)) * 100) // Normalize to 0-100 for better radar scale
        ];
    };

    chartInstances['radar'] = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Taux HLM (%)', '% Femmes', 'Volume Licences (Norm.)'],
            datasets: [
                {
                    label: d1.name,
                    data: getMetrics(d1),
                    borderColor: primaryColor,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: primaryColor
                },
                {
                    label: d2.name,
                    data: getMetrics(d2),
                    borderColor: secondaryColor,
                    backgroundColor: 'rgba(236, 72, 153, 0.2)',
                    pointBackgroundColor: secondaryColor,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: secondaryColor
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(0,0,0,0.8)',
                    borderWidth: 1,
                    cornerRadius: 4,
                    padding: 10
                }
            },
            scales: {
                r: {
                    angleLines: {
                        color: gridColor
                    },
                    grid: {
                        color: gridColor
                    },
                    pointLabels: {
                        color: textColor,
                        font: { size: 12 }
                    },
                    ticks: {
                        backdropColor: 'transparent',
                        color: mutedTextColor,
                        beginAtZero: true,
                        max: 100, // Fixed max for normalization
                        stepSize: 20
                    }
                }
            }
        }
    });
}