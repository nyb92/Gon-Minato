# 🗺️ Configuration des Données Géographiques

## 📍 Ajout des coordonnées dans GraphDB

La carte interactive récupère maintenant **dynamiquement** tous les départements et régions depuis GraphDB avec leurs coordonnées géographiques.

---

## 🔧 Structure des données géographiques

### Pour les Régions

Ajoutez les propriétés `geo:lat` et `geo:long` à vos régions :

```turtle
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

:Region_IDF a :Region ;
    rdfs:label "Île-de-France" ;
    geo:lat "48.8566"^^xsd:float ;
    geo:long "2.3522"^^xsd:float ;
    :population 12278210 .
```

### Pour les Départements

```turtle
:Department_75 a :Department ;
    rdfs:label "Paris" ;
    :inseeCode "75" ;
    geo:lat "48.8566"^^xsd:float ;
    geo:long "2.3522"^^xsd:float ;
    :locatedInRegion :Region_IDF ;
    :population 2165423 .
```

---

## 📊 Coordonnées des Régions Françaises

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

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

---

## 🗺️ Coordonnées des Départements (Exemples)

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

INSERT DATA {
    # Île-de-France
    :Department_75 geo:lat "48.8566"^^xsd:float ; geo:long "2.3522"^^xsd:float .
    :Department_77 geo:lat "48.6047"^^xsd:float ; geo:long "2.9357"^^xsd:float .
    :Department_78 geo:lat "48.8047"^^xsd:float ; geo:long "1.8357"^^xsd:float .
    :Department_91 geo:lat "48.5047"^^xsd:float ; geo:long "2.2357"^^xsd:float .
    :Department_92 geo:lat "48.8366"^^xsd:float ; geo:long "2.2522"^^xsd:float .
    :Department_93 geo:lat "48.9166"^^xsd:float ; geo:long "2.4522"^^xsd:float .
    :Department_94 geo:lat "48.7766"^^xsd:float ; geo:long "2.4822"^^xsd:float .
    :Department_95 geo:lat "49.0547"^^xsd:float ; geo:long "2.1357"^^xsd:float .
    
    # Autres départements populaires
    :Department_13 geo:lat "43.5297"^^xsd:float ; geo:long "5.3698"^^xsd:float .
    :Department_59 geo:lat "50.6292"^^xsd:float ; geo:long "3.0586"^^xsd:float .
    :Department_69 geo:lat "45.7640"^^xsd:float ; geo:long "4.8357"^^xsd:float .
}
```

---

## 📥 Import Complet des Coordonnées

### Option 1 : Fichier Turtle

Créez un fichier `geo_coordinates.ttl` :

```turtle
@prefix : <http://example.org/sport-hlm#> .
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Coordonnées des 101 départements français
:Department_01 geo:lat "46.2044"^^xsd:float ; geo:long "5.2281"^^xsd:float .
:Department_02 geo:lat "49.5647"^^xsd:float ; geo:long "3.6239"^^xsd:float .
:Department_03 geo:lat "46.5667"^^xsd:float ; geo:long "3.3406"^^xsd:float .
# ... (continuez pour tous les départements)
```

Importez dans GraphDB :
1. Ouvrez GraphDB Workbench
2. Allez dans "Import" > "RDF"
3. Sélectionnez votre fichier `geo_coordinates.ttl`
4. Cliquez sur "Import"

### Option 2 : Requête SPARQL Update

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

INSERT DATA {
    # Tous les départements...
    :Department_01 geo:lat "46.2044"^^xsd:float ; geo:long "5.2281"^^xsd:float .
    :Department_02 geo:lat "49.5647"^^xsd:float ; geo:long "3.6239"^^xsd:float .
    # ... etc
}
```

---

## 🔍 Vérification des Coordonnées

### Requête pour vérifier les régions

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT ?region ?label ?lat ?long
WHERE {
    ?region a :Region ;
            rdfs:label ?label .
    OPTIONAL { ?region geo:lat ?lat }
    OPTIONAL { ?region geo:long ?long }
}
ORDER BY ?label
```

### Requête pour vérifier les départements

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT ?dept ?label ?code ?lat ?long
WHERE {
    ?dept a :Department ;
          rdfs:label ?label ;
          :inseeCode ?code .
    OPTIONAL { ?dept geo:lat ?lat }
    OPTIONAL { ?dept geo:long ?long }
}
ORDER BY ?code
```

---

## 🎯 Comportement de la Carte

### Si coordonnées présentes dans GraphDB
✅ La carte affiche les départements/régions à leur position exacte

### Si coordonnées absentes
⚠️ **Mode fallback** : La carte utilise des coordonnées approximatives basées sur le code département

Le fallback est implémenté dans la fonction `getDefaultCoordinates()` de `map.js`

---

## 📝 Script Python pour Générer les Coordonnées

Créez un script `add_geo_coordinates.py` :

```python
from SPARQLWrapper import SPARQLWrapper, POST, JSON

# Coordonnées des départements (chef-lieu)
DEPT_COORDS = {
    "01": (46.2044, 5.2281),  # Ain
    "02": (49.5647, 3.6239),  # Aisne
    "03": (46.5667, 3.3406),  # Allier
    # ... ajoutez tous les départements
}

endpoint = "http://localhost:8080/repositories/sport-hlm/statements"
sparql = SPARQLWrapper(endpoint)

for code, (lat, lon) in DEPT_COORDS.items():
    query = f"""
    PREFIX : <http://example.org/sport-hlm#>
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    
    INSERT DATA {{
        :Department_{code} geo:lat "{lat}"^^xsd:float ;
                          geo:long "{lon}"^^xsd:float .
    }}
    """
    sparql.setQuery(query)
    sparql.setMethod(POST)
    sparql.query()
    print(f"✅ Coordonnées ajoutées pour département {code}")
```

---

## 🌍 Sources de Données Géographiques

### Données officielles françaises
- **data.gouv.fr** : https://www.data.gouv.fr/fr/datasets/contours-des-departements-francais-issus-d-openstreetmap/
- **GeoJSON France** : https://github.com/gregoiredavid/france-geojson

### API pour obtenir les coordonnées
- **API Découpage Administratif** : https://geo.api.gouv.fr/
- **Nominatim (OSM)** : https://nominatim.openstreetmap.org/

### Exemple avec l'API geo.api.gouv.fr

```bash
# Obtenir les coordonnées d'un département
curl "https://geo.api.gouv.fr/departements/75?fields=centre"

# Résultat :
{
  "code": "75",
  "nom": "Paris",
  "centre": {
    "type": "Point",
    "coordinates": [2.3488, 48.8534]
  }
}
```

---

## ⚡ Impact sur les Performances

| Aspect | Sans coordonnées | Avec coordonnées |
|--------|------------------|------------------|
| Taille données | +0 KB | +5 KB (négligeable) |
| Précision carte | Approximative | Exacte |
| Vitesse affichage | Identique | Identique |

**Conclusion** : Ajouter les coordonnées améliore la précision sans impact sur les performances

---

## 🐛 Dépannage

### Les départements ne s'affichent pas
1. Vérifiez que vos départements ont bien un `rdfs:label` et `:inseeCode`
2. Les coordonnées sont optionnelles (fallback automatique)

### Coordonnées incorrectes
1. Vérifiez le format : `geo:lat "48.8566"^^xsd:float`
2. Latitude : -90 à +90
3. Longitude : -180 à +180

### Tester une coordonnée
```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT ?dept ?lat ?long
WHERE {
    ?dept :inseeCode "75" .
    OPTIONAL { ?dept geo:lat ?lat }
    OPTIONAL { ?dept geo:long ?long }
}
```

---

## 📚 Ressources

- [WGS84 Geo Positioning Vocabulary](https://www.w3.org/2003/01/geo/)
- [GeoSPARQL](http://www.opengeospatial.org/standards/geosparql)
- [Leaflet Documentation](https://leafletjs.com/)

---

**Note** : Si vous n'avez pas le temps d'ajouter toutes les coordonnées, la carte fonctionnera quand même avec les coordonnées approximatives par défaut !
