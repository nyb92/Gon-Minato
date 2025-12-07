# 🐛 Debug - Problème d'affichage des régions

## Test dans GraphDB

Testez cette requête dans GraphDB Workbench pour vérifier combien de régions vous avez :

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT DISTINCT ?reg ?label ?lat ?long WHERE {
    ?reg a :Region ;
         rdfs:label ?label .
    OPTIONAL { ?reg geo:lat ?lat }
    OPTIONAL { ?reg geo:long ?long }
} ORDER BY ?label
```

**Résultat attendu** : Vous devriez voir TOUTES vos régions (normalement 13)

---

## Si une seule région s'affiche

### Vérification 1 : Comptez vos régions
```sparql
PREFIX : <http://example.org/sport-hlm#>
SELECT (COUNT(DISTINCT ?reg) as ?total) WHERE {
    ?reg a :Region .
}
```

### Vérification 2 : Listez toutes les régions
```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?reg ?label WHERE {
    ?reg a :Region .
    OPTIONAL { ?reg rdfs:label ?label }
}
ORDER BY ?label
```

---

## Dans le navigateur

1. Ouvrez `webapp/map.html`
2. Ouvrez la console (F12)
3. Cherchez ces logs :

```
📍 Found regions: XX          ← Devrait être > 1
📍 Regions details: [...]     ← Liste des noms de régions
✅ Built GeoJSON for XX regions
🗺️ Starting to draw regions...
📊 regionsGeoJSON.features: XX
📊 regionsData keys: [...]
```

---

## Causes possibles

### Cause 1 : Une seule région dans GraphDB
**Solution** : Ajoutez les autres régions dans GraphDB

### Cause 2 : Problème de cache
**Solution** : Cliquez sur "🗑️ Vider le cache" et rechargez

### Cause 3 : Coordonnées en double
**Vérifiez** :
```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
SELECT ?reg1 ?reg2 ?lat ?long WHERE {
    ?reg1 a :Region ; geo:lat ?lat ; geo:long ?long .
    ?reg2 a :Region ; geo:lat ?lat ; geo:long ?long .
    FILTER(?reg1 != ?reg2)
}
```

Si cette requête retourne des résultats, plusieurs régions ont les mêmes coordonnées et se superposent sur la carte.

### Cause 4 : Labels en double
**Vérifiez** :
```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?label (COUNT(?reg) as ?count) WHERE {
    ?reg a :Region ;
         rdfs:label ?label .
}
GROUP BY ?label
HAVING (COUNT(?reg) > 1)
```

Si des labels apparaissent, plusieurs régions ont le même nom.

---

## Solution rapide

Si le problème persiste, testez avec des coordonnées différentes pour chaque région :

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

# Supprimez les coordonnées existantes (si besoin)
DELETE {
    ?reg geo:lat ?lat .
    ?reg geo:long ?long .
}
WHERE {
    ?reg a :Region .
    OPTIONAL { ?reg geo:lat ?lat }
    OPTIONAL { ?reg geo:long ?long }
};

# Ajoutez des coordonnées distinctes
INSERT DATA {
    :Region_IDF geo:lat "48.8566"^^xsd:float ; geo:long "2.3522"^^xsd:float .
    :Region_CVDL geo:lat "47.7516"^^xsd:float ; geo:long "1.7556"^^xsd:float .
    :Region_BFC geo:lat "47.2805"^^xsd:float ; geo:long "4.8671"^^xsd:float .
    :Region_NOR geo:lat "49.1829"^^xsd:float ; geo:long "0.1578"^^xsd:float .
    :Region_HDF geo:lat "50.6292"^^xsd:float ; geo:long "2.9357"^^xsd:float .
    :Region_GE geo:lat "48.5734"^^xsd:float ; geo:long "6.1757"^^xsd:float .
    :Region_PDL geo:lat "47.4784"^^xsd:float ; geo:long "-0.5792"^^xsd:float .
    :Region_BRE geo:lat "48.2020"^^xsd:float ; geo:long "-2.7574"^^xsd:float .
    :Region_NAQ geo:lat "45.7640"^^xsd:float ; geo:long "0.1578"^^xsd:float .
    :Region_OCC geo:lat "43.6047"^^xsd:float ; geo:long "1.4442"^^xsd:float .
    :Region_ARA geo:lat "45.7640"^^xsd:float ; geo:long "4.8357"^^xsd:float .
    :Region_PACA geo:lat "43.9351"^^xsd:float ; geo:long "5.3698"^^xsd:float .
    :Region_COR geo:lat "42.0396"^^xsd:float ; geo:long "9.1533"^^xsd:float .
}
```

**Note** : Adaptez les URI (`:Region_IDF`, etc.) selon votre structure de données.

---

## Contact

Si le problème persiste après ces vérifications, partagez les résultats des requêtes de vérification.
