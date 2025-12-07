# 🚀 Guide de Démarrage Rapide

Ce guide vous permet de lancer le projet en **5 minutes** !

## ⚡ Installation Express

### 1. Prérequis
```bash
# Vérifier Docker
docker --version

# Vérifier Node.js
node --version

# Vérifier Python
python3 --version
```

### 2. Lancer GraphDB
```bash
docker compose up -d
```
✅ GraphDB accessible sur http://localhost:7200

### 3. Créer le Repository "Gon"

1. Ouvrir http://localhost:7200
2. **Setup** → **Repositories** → **Create new repository**
3. Type : **GraphDB Repository**
4. Repository ID : **`Gon`** (exactement ce nom !)
5. Ruleset : **OWL-Horst (Optimized)**
6. Cliquer **Create**

### 4. Importer les Données (ORDRE STRICT)

Via **Import → RDF** dans GraphDB :

**⚠️ IMPORTANT : Respecter cet ordre !**

```
1️⃣ rdf/ontology.ttl           (30 secondes)
2️⃣ rdf/logements_2021.ttl     (30 secondes)
3️⃣ rdf/logements_2022.ttl     (30 secondes)
4️⃣ rdf/logements_2023.ttl     (30 secondes)
5️⃣ rdf/sport.ttl.gz           (5-10 minutes ⏱️)
```

**💡 Astuce** : Utiliser "Server files" si les fichiers sont dans `/opt/graphdb/import/`

### 5. Lancer le Proxy SPARQL
```bash
cd webapp
npm install
node proxy.js
```
✅ Proxy actif sur http://localhost:8080

### 6. Lancer l'Application Web
```bash
# Nouveau terminal
cd webapp
python3 -m http.server 3000
```
✅ App accessible sur http://localhost:3000

---

## 🎯 Points de Vérification

| Service | URL | Status |
|---------|-----|--------|
| GraphDB | http://localhost:7200 | ✅ Interface visible |
| Repository "Gon" | http://localhost:7200/repository | ✅ 1.2M triplets |
| Proxy SPARQL | http://localhost:8080/sparql | ✅ Répond en JSON |
| Application Web | http://localhost:3000 | ✅ Dashboard chargé |

---

## 🧪 Tester l'Installation

### Test 1 : GraphDB
Aller dans **SPARQL** → Coller :
```sparql
PREFIX : <http://example.org/sport-hlm#>
SELECT (COUNT(*) AS ?total) WHERE { ?s ?p ?o }
```
**Attendu** : ~1.2M triplets

### Test 2 : Proxy
```bash
curl -X POST http://localhost:8080/sparql \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 1"
```
**Attendu** : Résultat JSON

### Test 3 : Application
1. Ouvrir http://localhost:3000
2. Sélectionner une région (ex: Île-de-France)
3. Cliquer **"Analyser"**
4. **Attendu** : Graphiques et KPIs affichés en < 5 secondes

---

## 🐛 Problèmes Courants

### GraphDB ne démarre pas
```bash
docker compose down
docker compose up -d
docker compose logs -f graphdb
```

### Import sport.ttl.gz trop long
→ Normal ! Le fichier fait 14MB compressé (800k triplets)
→ Prendre un café ☕ (~10 min)

### Erreur "NetworkError" dans l'app
→ Le proxy n'est pas lancé :
```bash
cd webapp && node proxy.js
```

### Page blanche / requêtes lentes
→ Vérifier que l'import est terminé :
- GraphDB → Gon → **Explore graph** → Count devrait être ~1.2M

---

## 📝 Commandes Utiles

```bash
# Arrêter GraphDB
docker compose down

# Voir les logs du proxy
cd webapp && node proxy.js

# Regénérer les fichiers RDF
python scripts/generate_sport_ttl.py
python scripts/generate_logements_ttl.py

# Nettoyer et reconstruire
docker compose down -v  # ⚠️ Efface les données !
docker compose up -d
```

---

## 🎉 C'est Prêt !

Vous pouvez maintenant :
- 🗺️ Explorer la **carte interactive** : http://localhost:3000/map.html
- 🏆 Voir le **top sports** : http://localhost:3000/sports.html
- 📊 Analyser les **corrélations** : http://localhost:3000/correlation.html
- 📖 Lire les **stories** : http://localhost:3000/stories.html

**Retour au README complet** : [README.md](README.md)
