#!/bin/bash

# Script de test rapide pour diagnostiquer le problème des régions

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🔍 Test Diagnostic - Régions Superposées            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 TESTEZ CETTE REQUÊTE DANS GRAPHDB :"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
cat << 'SPARQL'
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT ?label 
       (COALESCE(?lat, "46.6034") as ?latitude) 
       (COALESCE(?long, "2.3522") as ?longitude)
WHERE {
    ?reg a :Region ;
         rdfs:label ?label .
    OPTIONAL { ?reg geo:lat ?lat }
    OPTIONAL { ?reg geo:long ?long }
}
ORDER BY ?latitude ?longitude
SPARQL

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 INTERPRÉTATION :"
echo ""
echo "  Si PLUSIEURS régions ont :"
echo "    latitude  = 46.6034"
echo "    longitude = 2.3522"
echo ""
echo "  → Elles sont SUPERPOSÉES au même endroit !"
echo "  → C'est pour ça que vous ne voyez qu'une seule région"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 SOLUTION RAPIDE - Coordonnées Temporaires Espacées :"
echo ""
cat << 'SOLUTION'
PREFIX : <http://example.org/sport-hlm#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

# Supprimez d'abord les coordonnées existantes (optionnel)
DELETE {
    ?reg geo:lat ?lat .
    ?reg geo:long ?long .
}
WHERE {
    ?reg a :Region .
    OPTIONAL { ?reg geo:lat ?lat }
    OPTIONAL { ?reg geo:long ?long }
};

# Ajoutez des coordonnées espacées (adaptez les URI selon vos données)
INSERT DATA {
    :Region_01 geo:lat "48.8566"^^xsd:float ; geo:long "2.3522"^^xsd:float .
    :Region_02 geo:lat "47.7516"^^xsd:float ; geo:long "1.7556"^^xsd:float .
    :Region_03 geo:lat "47.2805"^^xsd:float ; geo:long "4.8671"^^xsd:float .
    :Region_04 geo:lat "49.1829"^^xsd:float ; geo:long "0.1578"^^xsd:float .
    :Region_05 geo:lat "50.6292"^^xsd:float ; geo:long "2.9357"^^xsd:float .
    :Region_06 geo:lat "48.5734"^^xsd:float ; geo:long "6.1757"^^xsd:float .
    :Region_07 geo:lat "47.4784"^^xsd:float ; geo:long "-0.5792"^^xsd:float .
    :Region_08 geo:lat "48.2020"^^xsd:float ; geo:long "-2.7574"^^xsd:float .
    :Region_09 geo:lat "45.7640"^^xsd:float ; geo:long "0.1578"^^xsd:float .
    :Region_10 geo:lat "43.6047"^^xsd:float ; geo:long "1.4442"^^xsd:float .
    :Region_11 geo:lat "45.1885"^^xsd:float ; geo:long "5.7331"^^xsd:float .
    :Region_12 geo:lat "43.9351"^^xsd:float ; geo:long "5.3698"^^xsd:float .
    :Region_13 geo:lat "42.0396"^^xsd:float ; geo:long "9.1533"^^xsd:float .
}
SOLUTION

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Pour les coordonnées exactes de chaque région :"
echo "   Voir le fichier GEO_DATA_SETUP.md"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Après l'ajout des coordonnées, videz le cache et testez  ║"
echo "╚════════════════════════════════════════════════════════════╝"
