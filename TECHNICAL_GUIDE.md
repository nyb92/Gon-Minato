# 🔧 Guide Technique - Architecture et Développement

## 📐 Architecture Globale

```
┌─────────────────┐
│   Navigateur    │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP (port 3000)
         ▼
┌─────────────────┐
│  Serveur HTTP   │
│  (Python/Node)  │
└────────┬────────┘
         │ SPARQL (port 8080)
         ▼
┌─────────────────┐
│  Proxy CORS     │
│  (Express.js)   │
└────────┬────────┘
         │ SPARQL (port 7200)
         ▼
┌─────────────────┐
│    GraphDB      │
│  (Triplestore)  │
└─────────────────┘
```

---

## 🗂️ Structure des Données RDF

### Modèle Conceptuel

```
Region (13)
  ├─ hasLabel
  ├─ lat/lon
  └─ hasDepartments (96)
       ├─ hasHousingData (2021-2023)
       │    ├─ proportionHLM
       │    └─ year
       └─ hasPopulationGroups
            ├─ age (0-99)
            ├─ sex (H/F)
            └─ SportParticipations
                 ├─ hasSport
                 └─ numLicences
```

### Exemples de Triplets

```turtle
# Région
:Region_11 a :Region ;
    rdfs:label "Île-de-France"@fr ;
    :lat 48.8566 ;
    :lon 2.3522 .

# Département
:Department_75 a :Department ;
    rdfs:label "75 - Paris"@fr ;
    :locatedInRegion :Region_11 ;
    :inseeCode "75" .

# Données HLM
:HousingData_75_2023 a :HousingData ;
    :year "2023"^^xsd:gYear ;
    :proportionHLM "22.5"^^xsd:decimal .

:Department_75 :hasHousingData :HousingData_75_2023 .

# Groupe démographique
:PopGroup_75_25_H a :PopulationGroup ;
    :age 25 ;
    :sex "H" ;
    :locatedInDepartment :Department_75 .

# Sport
:Sport_Football a :Sport ;
    rdfs:label "Football"@fr .

# Participation
:Participation_12345 a :SportParticipation ;
    :hasSport :Sport_Football ;
    :hasPopulationGroup :PopGroup_75_25_H ;
    :numLicences 1250 .
```

---

## 🐍 Scripts Python - Détails Techniques

### generate_sport_ttl.py

**Pipeline de traitement** :

1. **Lecture CSV**
   ```python
   df = pd.read_csv("data/sport_2023.csv", sep=";")
   ```

2. **Nettoyage données**
   - Détection automatique colonne licences
   - Conversion types (int, string)
   - Gestion valeurs nulles/invalides

3. **Extraction métadonnées**
   ```python
   def extract_dep_code(label):
       match = re.search(r'(\d{2,3})', label)
       return match.group(1) if match else "99"
   ```

4. **Génération RDF**
   - URIs normalisées (util.clean_uri)
   - Triplets par entité (Region, Dept, Group, Sport, Participation)
   - Compression gzip automatique

**Optimisations** :
- Batch writing (évite RAM overflow)
- Déduplication des régions/départements
- Index en mémoire pour rapidité

### generate_logements_ttl.py

**Caractéristiques** :
- Génération par année (2021, 2022, 2023)
- Liaison automatique avec départements existants
- Conversion taux HLM (string → decimal)

**Filtre année** :
```python
df = df[df["année_publication"] == 2021]
```

---

## 🌐 Application Web - Architecture Frontend

### Flux de Données

```
User Action (région sélectionnée)
    ↓
runAnalysis() en script.js
    ↓
fetchAllRegionData(region)
    ↓
Promise.all([
    fetchKPIs(),
    fetchAgeData(),
    fetchTopSports(),
    fetchGenderData()
])
    ↓
runQuery(sparql) → fetch(proxy:8080)
    ↓
Proxy → GraphDB:7200
    ↓
JSON Results
    ↓
updateCharts() + updateKPIs()
    ↓
Chart.js rendering
```

### Optimisations SPARQL Appliquées

#### ❌ Mauvais (lent)
```sparql
WHERE {
    ?p :numLicences ?lic ;
       :hasPopulationGroup / :locatedInDepartment / :locatedInRegion ?reg .
}
```
**Problème** : Property paths en cascade = jointures coûteuses

#### ✅ Bon (rapide)
```sparql
WHERE {
    ?reg a :Region ;
         rdfs:label ?regLabel .
    
    ?dep :locatedInRegion ?reg .
    ?group :locatedInDepartment ?dep .
    ?p :hasPopulationGroup ?group ;
       :numLicences ?lic .
}
```
**Avantages** :
- Variables intermédiaires
- Index utilisés efficacement
- Ordre de jointure optimisable

### Gestion du Cache

```javascript
let chartInstances = {};

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        chartInstances[id] = null;
    }
}
```
Évite les memory leaks avec Chart.js

---

## 🔧 Proxy CORS - Détails

### Pourquoi un proxy ?

GraphDB ne supporte pas nativement CORS pour requêtes POST depuis `file://` ou domaines externes.

### Configuration

```javascript
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
}));
```

### Logs de Debugging

```javascript
console.log(`📥 Reçu requête SPARQL (Length: ${req.body.length})`);
console.log(`📝 Query Preview: ${req.body.substring(0, 100)}...`);
console.log(`📤 Réponse GraphDB: Status ${status}, Size ${text.length} chars`);
```

---

## 🎨 Ontologie - Design Rationale

### Choix de Modélisation

#### PopulationGroup vs Individus

**Choix** : Groupes agrégés (âge + sexe + département)

**Pourquoi** :
- Volume de données gérable (~50k groupes vs 67M habitants)
- Anonymisation des données
- Agrégations précomputées

#### HousingData séparé

**Choix** : Entité dédiée vs propriété directe

**Avantages** :
- Support multi-années
- Extensibilité (ajout d'autres métriques)
- Traçabilité temporelle

#### Sport comme classe

**Alternative rejetée** : String literals

**Justification** :
- Enrichissement possible (Wikidata, DBpedia)
- Réutilisabilité
- SPARQL plus expressif

---

## 📊 Performances

### Métriques Actuelles

| Métrique | Valeur |
|----------|--------|
| Triplets totaux | ~1.2M |
| Régions | 13 |
| Départements | 96 |
| Groupes démo | ~50k |
| Sports | 50+ |
| Participations | ~800k |

### Temps de Requête (optimisé)

| Requête | Temps |
|---------|-------|
| KPIs région | < 1s |
| Top 5 sports | < 2s |
| Pyramide âges | < 1s |
| Classement national | < 3s |

### Stratégies d'Optimisation

1. **LIMIT systématique**
2. **Variables intermédiaires** (pas de property paths)
3. **OPTIONAL minimal**
4. **Requêtes parallèles** (Promise.all)
5. **Cache frontend** (Chart.js instances)

---

## 🧪 Tests et Validation

### Validation RDF

```bash
python scripts/clean_ttl_propre.py
```

### Test SPARQL Endpoint

```bash
curl -X POST http://localhost:7200/repositories/Gon \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT (COUNT(*) as ?c) WHERE { ?s ?p ?o }"
```

### Test Proxy

```bash
curl -X POST http://localhost:8080/sparql \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 1"
```

---

## 🚀 Déploiement Production

### Checklist

- [ ] GraphDB configuré avec authentication
- [ ] Proxy avec rate limiting
- [ ] HTTPS avec certificat SSL
- [ ] Backup régulier des données RDF
- [ ] Monitoring (logs, métriques)
- [ ] Minification JS/CSS
- [ ] CDN pour Chart.js

### Docker Production

```yaml
services:
  graphdb:
    environment:
      GDB_HEAP_SIZE: "4g"
      GDB_MIN_MEM: "2g"
      GDB_MAX_MEM: "4g"
    restart: unless-stopped
```

---

## 📚 Ressources

### SPARQL
- [W3C SPARQL 1.1 Spec](https://www.w3.org/TR/sparql11-query/)
- [GraphDB Documentation](https://graphdb.ontotext.com/documentation/)

### RDF/OWL
- [RDF Primer](https://www.w3.org/TR/rdf11-primer/)
- [OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)

### Performance
- [SPARQL Query Optimization](https://www.w3.org/2001/sw/DataAccess/tests/README.html)

---

**🔙 Retour au README** : [README.md](README.md)
