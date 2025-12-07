# 🔍 Diagnostic Immédiat - Problème Régions

## TESTEZ CES 3 REQUÊTES DANS GRAPHDB

### 1️⃣ Combien de régions avez-vous ?

```sparql
PREFIX : <http://example.org/sport-hlm#>
SELECT (COUNT(?reg) as ?total) WHERE {
    ?reg a :Region .
}
```

**Résultat attendu** : Un nombre > 1

---

### 2️⃣ Quelles sont vos régions ?

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?reg ?label WHERE {
    ?reg a :Region ;
         rdfs:label ?label .
}
ORDER BY ?label
```

**Notez les résultats ici** : _________________

---

### 3️⃣ Ont-elles des coordonnées ?

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
SELECT ?label ?lat ?long WHERE {
    ?reg a :Region ;
         rdfs:label ?label .
    OPTIONAL { ?reg geo:lat ?lat }
    OPTIONAL { ?reg geo:long ?long }
}
ORDER BY ?label
```

**Si lat et long sont NULL pour plusieurs régions** → Elles sont superposées !

---

## DANS LE NAVIGATEUR

1. Ouvrez `webapp/map.html`
2. Appuyez sur **F12** (console)
3. Cherchez ces logs et **partagez les résultats** :

```
📍 Found regions: ?          ← Combien ?
📍 Regions details: [...]    ← Lesquels ?
🗺️ Starting to draw regions...
📊 regionsGeoJSON.features: ?
📊 regionsData keys: ?
```

---

## SOLUTION TEMPORAIRE DE TEST

Pour tester rapidement, ajoutez des coordonnées TRÈS ESPACÉES :

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

# D'abord, supprimez les coordonnées existantes
DELETE {
    ?reg geo:lat ?lat .
    ?reg geo:long ?long .
}
WHERE {
    ?reg a :Region .
    OPTIONAL { ?reg geo:lat ?lat }
    OPTIONAL { ?reg geo:long ?long }
};

# Ajoutez des coordonnées TRÈS espacées pour chaque région
# ADAPTEZ LES URI SELON VOS DONNÉES !
INSERT DATA {
    # Si vos régions sont nommées :Region_1, :Region_2, etc.
    :Region_IDF geo:lat "50.0"^^xsd:float ; geo:long "2.0"^^xsd:float .
    :Region_PACA geo:lat "44.0"^^xsd:float ; geo:long "6.0"^^xsd:float .
    :Region_BRE geo:lat "48.0"^^xsd:float ; geo:long "-3.0"^^xsd:float .
    :Region_OCC geo:lat "43.0"^^xsd:float ; geo:long "2.0"^^xsd:float .
    # ... ajoutez TOUTES vos régions
}
```

---

## PARTAGEZ CES INFOS :

1. Résultat de la requête 1 : _____ régions
2. Résultat de la requête 2 : Liste des noms
3. Résultat de la requête 3 : Coordonnées (NULL ou valeurs ?)
4. Logs de la console navigateur

Avec ces infos, je pourrai vous donner la solution exacte ! 🎯
