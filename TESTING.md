# 🧪 Guide de Test des Optimisations

## Prérequis
- GraphDB accessible sur `http://localhost:8080`
- Navigateur moderne (Chrome, Firefox, Edge)
- Les données chargées dans GraphDB

## Test 1 : Vérification du Cache

### Étapes
1. Ouvrez `webapp/map.html` dans votre navigateur
2. Ouvrez la Console (F12 ou Clic droit > Inspecter > Console)
3. Attendez le chargement complet

### Résultat attendu
```
🔍 Executing query: PREFIX : <http://example.org/sport-hlm#>...
✅ Query result: 13 rows
📍 Found regions: ...
```

4. Changez de "Par Région" à "Par Département"

### Résultat attendu
```
📍 Fetching all departments...
🔍 Executing query: PREFIX : <http://example.org/sport-hlm#>...
✅ Query result: XX rows
📍 Found departments: XX
```

5. Revenez à "Par Région"

### Résultat attendu
```
🎯 Cache HIT for: PREFIX : <http://example.org/sport-hlm#>...
(Pas de nouvelle requête, données instantanées)
```

✅ **Test réussi** si vous voyez "🎯 Cache HIT"

---

## Test 2 : Chargement des Départements

### Étapes
1. Rechargez la page (F5)
2. Sélectionnez "Par Département" dans le menu
3. Observez la console

### Résultat attendu
```
📍 Fetching all departments...
🔍 Executing query: SELECT ?dep ?label ?code ?region...
✅ Query result: XX rows
📊 Loading data for: Paris (75)
📊 Loading data for: Seine-et-Marne (77)
...
✅ Loaded batch 1/Y
✅ Loaded batch 2/Y
...
🎉 All departments data loaded: XX
```

✅ **Test réussi** si vous voyez le chargement par lots (batches)

---

## Test 3 : Bouton de Nettoyage du Cache

### Étapes
1. Assurez-vous d'avoir des données en cache (naviguez entre les vues)
2. Cliquez sur le bouton "🗑️ Vider le cache"
3. Vérifiez l'alerte : "Cache vidé ! Les données seront rechargées..."
4. Changez de vue

### Résultat attendu
```
🗑️ Cache cleared
🔍 Executing query: ... (nouvelle requête au lieu de cache)
```

✅ **Test réussi** si une nouvelle requête est exécutée après le nettoyage

---

## Test 4 : Performance

### Étapes
1. **Premier chargement** (cache vide)
   - Rechargez complètement la page (Ctrl+Shift+R)
   - Chronométrez le temps de chargement
   - Note le nombre de requêtes SPARQL

2. **Second chargement** (avec cache)
   - Changez de vue plusieurs fois
   - Chronométrez le temps
   - Note le nombre de requêtes

### Résultats attendus

| Mesure | Sans cache | Avec cache |
|--------|-----------|------------|
| Temps initial | 5-10s | 5-10s |
| Temps changement vue | 3-5s | < 1s |
| Requêtes SPARQL | ~15-20 | ~5-7 |

✅ **Test réussi** si le changement de vue est quasi-instantané

---

## Test 5 : Requête Départements

### Test direct dans GraphDB
1. Ouvrez GraphDB Workbench
2. Collez cette requête :

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?dep ?label ?code ?region
WHERE {
    ?dep a :Department .
    OPTIONAL { ?dep rdfs:label ?label }
    OPTIONAL { ?dep :inseeCode ?code }
    OPTIONAL { ?dep :locatedInRegion ?region }
}
ORDER BY ?code
```

3. Exécutez

### Résultat attendu
- Liste de tous les départements
- Colonnes : dep, label, code, region
- Triés par code (01, 02, 03, ...)

✅ **Test réussi** si vous obtenez tous vos départements

---

## 🐛 Dépannage

### Aucune donnée ne s'affiche
1. Vérifiez GraphDB : http://localhost:8080/sparql
2. Testez la requête directement dans GraphDB
3. Vérifiez la console pour les erreurs

### Cache ne fonctionne pas
1. Vérifiez que "🎯 Cache HIT" apparaît dans la console
2. Essayez de vider le cache avec le bouton
3. Rechargez la page

### Départements ne se chargent pas
1. Testez la requête SPARQL dans GraphDB
2. Vérifiez que les données existent
3. Regardez les logs de chargement par lots

### Erreur 404 ou CORS
1. Vérifiez que GraphDB est démarré
2. Vérifiez l'URL du endpoint (ligne 1 de map.js)
3. Vérifiez les paramètres CORS de GraphDB

---

## 📊 Métriques à surveiller

Ouvrez l'onglet "Network" (F12) pour voir :
- Nombre de requêtes au serveur SPARQL
- Temps de réponse de chaque requête
- Taille des données transférées

Avant optimisation :
- ~20 requêtes par session
- ~10-15s de temps cumulé

Après optimisation :
- ~5-7 requêtes (première fois)
- ~2-3 requêtes (avec cache)
- < 5s de temps cumulé avec cache

---

## ✅ Checklist Complète

- [ ] Cache fonctionne (🎯 Cache HIT visible)
- [ ] Requête départements récupère toutes les données
- [ ] Chargement par lots fonctionnel
- [ ] Bouton de nettoyage fonctionne
- [ ] Navigation entre vues rapide (< 1s avec cache)
- [ ] Aucune erreur dans la console
- [ ] Les départements s'affichent correctement sur la carte
- [ ] Les tooltips fonctionnent

Si tous les tests passent : **🎉 Optimisations réussies !**
