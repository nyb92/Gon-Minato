# 🔍 Requêtes SPARQL - Exemples et Validation

Ce document contient toutes les requêtes SPARQL utiles pour explorer, valider et enrichir le graphe de connaissances.

---

## 📊 Requêtes de Validation

### 1. Compter les triplets totaux
```sparql
PREFIX : <http://example.org/sport-hlm#>

SELECT (COUNT(*) AS ?total) 
WHERE { 
    ?s ?p ?o 
}
```
**Attendu** : ~1.2M triplets

### 2. Compter par type de classe
```sparql
PREFIX : <http://example.org/sport-hlm#>

SELECT ?type (COUNT(?instance) AS ?count)
WHERE {
    ?instance a ?type .
}
GROUP BY ?type
ORDER BY DESC(?count)
```

### 3. Vérifier les régions
```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?region ?label
WHERE {
    ?region a :Region ;
            rdfs:label ?label .
}
ORDER BY ?label
```
**Attendu** : 13 régions

### 4. Vérifier les départements
```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?dep ?label ?inseeCode
WHERE {
    ?dep a :Department ;
         rdfs:label ?label ;
         :inseeCode ?inseeCode .
}
ORDER BY ?inseeCode
```
**Attendu** : 96 départements

---

## 🌍 Enrichissement Wikidata

### Enrichir les Départements

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

INSERT {
    ?dep owl:sameAs ?wikidataDep .
    ?dep :population ?pop .
    ?dep :area ?area .
    ?dep :coord ?coord .
}
WHERE {
    ?dep a :Department ;
         :inseeCode ?code .

    SERVICE <https://query.wikidata.org/sparql> {
        # Départements français → P2585 (code INSEE)
        ?wikidataDep wdt:P2585 ?code .
        
        OPTIONAL { ?wikidataDep wdt:P1082 ?pop }   # Population
        OPTIONAL { ?wikidataDep wdt:P2046 ?area }  # Superficie (km²)
        OPTIONAL { ?wikidataDep wdt:P625 ?coord }  # Coordonnées GPS
    }
    
    FILTER NOT EXISTS { ?dep owl:sameAs ?wikidataDep }
}
```

**⏱️ Durée** : ~30 secondes  
**✅ Ajoute** : Population, superficie, coordonnées GPS

### Enrichir les Régions

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

INSERT {
    ?reg owl:sameAs ?wikidataReg .
    ?reg :population ?pop .
    ?reg :area ?area .
    ?reg :coord ?coord .
}
WHERE {
    ?reg a :Region .
    
    # Extraire le code INSEE depuis l'URI
    BIND( STRAFTER(STR(?reg), "#Region_") AS ?code )
    
    SERVICE <https://query.wikidata.org/sparql> {
        # Régions françaises → P2586
        ?wikidataReg wdt:P2586 ?code .
        
        OPTIONAL { ?wikidataReg wdt:P1082 ?pop }   # Population
        OPTIONAL { ?wikidataReg wdt:P2046 ?area }  # Superficie
        OPTIONAL { ?wikidataReg wdt:P625 ?coord }  # Coordonnées GPS
    }
    
    FILTER NOT EXISTS { ?reg owl:sameAs ?wikidataReg }
}
```

**⏱️ Durée** : ~10 secondes  
**✅ Ajoute** : Population, superficie, coordonnées GPS

---

## 📈 Requêtes d'Analyse

### 1. Licences par Région (Total)

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?regionLabel (SUM(?licences) AS ?totalLicences)
WHERE {
    ?part a :SportParticipation ;
          :numLicences ?licences ;
          :hasPopulationGroup ?group .
    
    ?group :locatedInDepartment ?dep .
    ?dep :locatedInRegion ?reg .
    ?reg rdfs:label ?regionLabel .
}
GROUP BY ?regionLabel
ORDER BY DESC(?totalLicences)
```

### 2. Licences par Région et Âge

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?regionLabel ?age (SUM(?licences) AS ?totalLicences)
WHERE {
    ?part a :SportParticipation ;
          :numLicences ?licences ;
          :hasPopulationGroup ?group .
    
    ?group :age ?age ;
           :locatedInDepartment ?dep .
    
    ?dep :locatedInRegion ?reg .
    ?reg rdfs:label ?regionLabel .
}
GROUP BY ?regionLabel ?age
ORDER BY ?regionLabel ?age
```

### 3. Pyramide des Âges (National)

```sparql
PREFIX : <http://example.org/sport-hlm#>

SELECT ?age (SUM(?licences) AS ?totalLicences)
WHERE {
    ?part a :SportParticipation ;
          :numLicences ?licences ;
          :hasPopulationGroup ?group .
    
    ?group :age ?age .
}
GROUP BY ?age
ORDER BY ?age
```

### 4. Taux HLM Moyen par Région (2023)

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?regionLabel (AVG(?taux) AS ?avgHLM)
WHERE {
    ?depHlm :hasHousingData ?hd .
    ?hd :proportionHLM ?taux .
    
    # Extraire code département
    BIND( STRAFTER(STR(?depHlm), "Department_") AS ?depCode ) .
    
    # Département géographique
    ?depGeo :inseeCode ?depCode ;
            :locatedInRegion ?reg .
    
    ?reg rdfs:label ?regionLabel .
}
GROUP BY ?regionLabel
ORDER BY ?regionLabel
```

### 5. Taux HLM par Département

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?depLabel ?taux
WHERE {
    ?depHlm :hasHousingData ?hd .
    ?hd :proportionHLM ?taux .
    
    BIND( STRAFTER(STR(?depHlm), "Department_") AS ?depCode ) .
    
    ?depGeo a :Department ;
            :inseeCode ?depCode ;
            rdfs:label ?depLabel .
}
ORDER BY ?depLabel
```

### 6. Hiérarchie Région → Département

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?regionLabel ?depLabel
WHERE {
    ?dep a :Department ;
         rdfs:label ?depLabel ;
         :locatedInRegion ?reg .
    
    ?reg rdfs:label ?regionLabel .
}
ORDER BY ?regionLabel ?depLabel
```

---

## ⚽ Analyses Sportives

### 7. Top 10 Sports (National)

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?sportLabel (SUM(?licences) AS ?total)
WHERE {
    ?part a :SportParticipation ;
          :numLicences ?licences ;
          :hasSport ?sport .
    
    ?sport rdfs:label ?sportLabel .
}
GROUP BY ?sportLabel
ORDER BY DESC(?total)
LIMIT 10
```

### 8. Sports les Plus Féminins

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?sportLabel (SUM(?licences) AS ?totalFemmes)
WHERE {
    ?part a :SportParticipation ;
          :numLicences ?licences ;
          :hasPopulationGroup ?group ;
          :hasSport ?sport .
    
    ?group :sex "F" .
    ?sport rdfs:label ?sportLabel .
}
GROUP BY ?sportLabel
ORDER BY DESC(?totalFemmes)
LIMIT 20
```

### 9. Répartition Hommes/Femmes par Sport

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?sportLabel
       (SUM(?licF) AS ?totalFilles)
       (SUM(?licM) AS ?totalGarcons)
       (ROUND(100 * SUM(?licF) / (SUM(?licF) + SUM(?licM))) AS ?pctFilles)
       (ROUND(100 * SUM(?licM) / (SUM(?licF) + SUM(?licM))) AS ?pctGarcons)
WHERE {
    ?part a :SportParticipation ;
          :numLicences ?licences ;
          :hasPopulationGroup ?group ;
          :hasSport ?sport .
    
    ?sport rdfs:label ?sportLabel .
    ?group :sex ?sex .
    
    BIND(IF(?sex = "F", ?licences, 0) AS ?licF)
    BIND(IF(?sex = "H", ?licences, 0) AS ?licM)
}
GROUP BY ?sportLabel
HAVING (SUM(?licF) + SUM(?licM) > 1000)
ORDER BY DESC(?pctFilles)
```

---

## 🔗 Requête Croisée Sport × HLM

### 10. Analyse Complète : Région × Âge × Licences × HLM

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?regionLabel ?age 
       (SUM(?licences) AS ?totalLicences)
       (AVG(?taux) AS ?tauxHLM)
WHERE {
    # Région → Département (géographique)
    ?reg rdfs:label ?regionLabel .
    ?depGeo :locatedInRegion ?reg ;
            :inseeCode ?depCode .
    
    # Département HLM (2023)
    ?depHlm :hasHousingData ?hd .
    BIND( STRAFTER(STR(?depHlm), "Department_") AS ?depHlmCode )
    FILTER(?depHlmCode = ?depCode)
    
    ?hd :proportionHLM ?taux .
    
    # Groupes démographiques
    ?group :locatedInDepartment ?depGeo ;
           :age ?age .
    
    # Participation
    ?part :hasPopulationGroup ?group ;
          :numLicences ?licences .
}
GROUP BY ?regionLabel ?age
ORDER BY ?regionLabel ?age
```

---

## 🧪 Requêtes de Debug

### Vérifier les Liens Manquants

```sparql
PREFIX : <http://example.org/sport-hlm#>

SELECT ?dep
WHERE {
    ?dep a :Department .
    FILTER NOT EXISTS { ?dep :locatedInRegion ?reg }
}
```

### Départements sans Données HLM

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?depLabel
WHERE {
    ?dep a :Department ;
         rdfs:label ?depLabel ;
         :inseeCode ?code .
    
    FILTER NOT EXISTS {
        ?depHlm :hasHousingData ?hd .
        BIND( STRAFTER(STR(?depHlm), "Department_") AS ?hCode )
        FILTER(?hCode = ?code)
    }
}
```

### Groupes sans Participation Sportive

```sparql
PREFIX : <http://example.org/sport-hlm#>

SELECT (COUNT(?group) AS ?orphans)
WHERE {
    ?group a :PopulationGroup .
    FILTER NOT EXISTS { 
        ?part :hasPopulationGroup ?group 
    }
}
```

---

## 📝 Notes d'Utilisation

### Exécuter dans GraphDB
1. Ouvrir **http://localhost:7200**
2. Sélectionner repository **Gon**
3. Aller dans **SPARQL**
4. Coller la requête
5. Cliquer **Run**

### Exécuter via Proxy (JavaScript)
```javascript
const query = `
PREFIX : <http://example.org/sport-hlm#>
SELECT * WHERE { ?s ?p ?o } LIMIT 10
`;

const response = await fetch('http://localhost:8080/sparql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/sparql-query',
        'Accept': 'application/sparql-results+json'
    },
    body: query
});

const data = await response.json();
console.log(data.results.bindings);
```

---

## 🚀 Requêtes Optimisées pour Production

### Astuce Performance
- ✅ Utiliser variables intermédiaires au lieu de property paths
- ✅ Ajouter LIMIT quand possible
- ✅ Filtrer tôt dans le WHERE
- ✅ Éviter OPTIONAL multiple
- ❌ Éviter FILTER NOT EXISTS coûteux

### Exemple : Mauvais vs Bon

**❌ Lent**
```sparql
?p :hasPopulationGroup / :locatedInDepartment / :locatedInRegion ?reg .
```

**✅ Rapide**
```sparql
?p :hasPopulationGroup ?group .
?group :locatedInDepartment ?dep .
?dep :locatedInRegion ?reg .
```

---

**🔙 Retour à la documentation** : [README.md](README.md)
