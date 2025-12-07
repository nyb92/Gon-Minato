# 🏅 Sport & HLM - Analyse Sémantique des Données Ouvertes

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![GraphDB](https://img.shields.io/badge/GraphDB-10.6.3-orange.svg)
![Node.js](https://img.shields.io/badge/node.js-18+-brightgreen.svg)

> 📚 **Navigation Rapide** : Nouveau sur le projet ? Consultez le [Guide de Navigation](DOCS_NAVIGATION.md) pour trouver rapidement l'information dont vous avez besoin.

---

## 📖 Description

Projet d'analyse sémantique croisant les données de **licences sportives** (2023) et de **logements sociaux (HLM)** en France métropolitaine. Utilise le Web Sémantique (RDF/OWL) avec GraphDB pour explorer les corrélations entre pratique sportive et politique du logement social.

### 🎯 Objectifs
- 📊 Analyser la répartition des licences sportives par région, âge et sexe
- 🏢 Croiser avec les taux de logements sociaux par département
- 🗺️ Visualiser les données sur une carte interactive
- 🔍 Identifier les sports les plus pratiqués par territoire
- 📈 Explorer les corrélations entre pratique sportive et logement social

---

## 🏗️ Architecture du Projet

```
Projet-Sport-HLM/
├── data/                    # Données sources (CSV)
│   ├── sport_2023.csv      # Licences sportives 2023
│   └── logements.csv       # Taux HLM par département
├── scripts/                 # Scripts Python de génération RDF
│   ├── generate_sport_ttl.py      # Conversion sport → TTL
│   ├── generate_logements_ttl.py  # Conversion logements → TTL
│   ├── housingdata_only.py        # Génération données HLM par année
│   ├── clean_ttl_propre.py        # Nettoyage/validation TTL
│   └── util.py                    # Fonctions utilitaires
├── rdf/                     # Fichiers RDF générés
│   ├── ontology.ttl        # Ontologie du domaine
│   ├── sport.ttl.gz        # Données sportives (~14MB compressé)
│   ├── logements_2021.ttl  # Données HLM 2021
│   ├── logements_2022.ttl  # Données HLM 2022
│   └── logements_2023.ttl  # Données HLM 2023
├── ontology/                # Définition de l'ontologie
│   └── ontology.ttl
├── sparql/                  # Requêtes SPARQL réutilisables
│   ├── enrich_wikidata.rq  # Enrichissement Wikidata
│   ├── link_regions.rq     # Liaison régions/départements
│   └── queries_webapp/     # Requêtes pour l'application web
├── webapp/                  # Application web de visualisation
│   ├── index.html          # Dashboard principal
│   ├── map.html            # Carte interactive
│   ├── sports.html         # Top sports par région
│   ├── correlation.html    # Analyse corrélations
│   ├── stories.html        # Stories dynamiques
│   ├── script.js           # Logique frontend
│   ├── proxy.js            # Proxy CORS pour SPARQL
│   └── styles.css          # Styles
└── docker-compose.yml       # Configuration GraphDB

```

---

## 🚀 Installation et Démarrage Rapide

### Prérequis
- 🐳 **Docker & Docker Compose** (pour GraphDB)
- 🐍 **Python 3.8+** (pour génération RDF)
- 📦 **Node.js 18+** (pour le proxy SPARQL)
- 💾 **~4GB de RAM** disponibles

### 1️⃣ Cloner le Projet
```bash
git clone https://github.com/votre-username/Projet-Sport-HLM.git
cd Projet-Sport-HLM
```

### 2️⃣ Lancer GraphDB
```bash
docker compose up -d
```
GraphDB sera accessible sur **http://localhost:7200**

### 3️⃣ Créer le Repository dans GraphDB

1. Ouvrir **http://localhost:7200**
2. Aller dans **Setup → Repositories**
3. Cliquer sur **"Create new repository"**
4. Choisir **"GraphDB Repository"**
5. Configuration :
   - **Repository ID** : `Gon` (important !)
   - **Title** : Sport & HLM
   - **Ruleset** : OWL-Horst (Optimized)
   - Laisser les autres options par défaut
6. Cliquer sur **Create**

### 4️⃣ Importer les Données RDF (ORDRE IMPORTANT !)

⚠️ **Respecter cet ordre pour garantir l'intégrité référentielle** :

1. **Ontologie** (définitions des classes et propriétés)
   ```
   Fichier : rdf/ontology.ttl
   Format : Turtle
   ```

2. **Données Logements** (2021 → 2023)
   ```
   Fichiers dans l'ordre :
   - rdf/logements_2021.ttl
   - rdf/logements_2022.ttl
   - rdf/logements_2023.ttl
   Format : Turtle
   ```

3. **Données Sportives** (volumineux !)
   ```
   Fichier : rdf/sport.ttl.gz
   Format : Turtle (compressé gzip)
   
   ⏱️ Import ~ 5-10 minutes
   💾 ~800 000 triplets
   ```

**Import via l'interface GraphDB** :
- Aller dans **Import → RDF**
- **Upload RDF files** → Sélectionner le fichier
- **Import Server files** → `/opt/graphdb/import/` (si fichiers montés via Docker)
- Cliquer sur **Import**

### 5️⃣ Installer les Dépendances du Proxy
```bash
cd webapp
npm install
```

### 6️⃣ Démarrer le Proxy SPARQL
```bash
node proxy.js
```
Le proxy sera accessible sur **http://localhost:8080**

### 7️⃣ Ouvrir l'Application Web
```bash
# Dans un autre terminal
cd webapp
python3 -m http.server 3000
```
Ouvrir **http://localhost:3000** dans votre navigateur

---

## 🔧 Génération des Fichiers RDF

### Scripts Python

#### 1. **generate_sport_ttl.py**
Convertit les données CSV sportives en RDF.

```bash
python scripts/generate_sport_ttl.py
```

**Fonctionnalités** :
- ✅ Parsing CSV avec détection automatique des colonnes
- ✅ Nettoyage des valeurs (accents, espaces, valeurs nulles)
- ✅ Extraction codes départements depuis les labels
- ✅ Génération triplets RDF pour :
  - Régions et départements
  - Groupes démographiques (âge, sexe)
  - Sports et participations
  - Liens hiérarchiques
- 🗜️ Compression automatique en `.gz`

**Output** : `rdf/sport.ttl.gz`

#### 2. **generate_logements_ttl.py**
Convertit les données HLM en RDF.

```bash
python scripts/generate_logements_ttl.py
```

**Fonctionnalités** :
- ✅ Filtrage par année (2021, 2022, 2023)
- ✅ Génération données HLM par département
- ✅ Liaison automatique avec régions
- ✅ Gestion des taux HLM (pourcentages)

**Output** : `rdf/logements_202X.ttl`

#### 3. **housingdata_only.py**
Génère séparément les fichiers HLM par année.

```bash
python scripts/housingdata_only.py
```

#### 4. **clean_ttl_propre.py**
Valide et nettoie les fichiers TTL générés.

```bash
python scripts/clean_ttl_propre.py
```

### Utilitaire : util.py
Fonctions de nettoyage pour URIs RDF :
- Suppression des accents
- Normalisation des espaces
- Caractères alphanumériques uniquement

---

## 🎨 Ontologie

L'ontologie définit le modèle sémantique du projet.

### Classes Principales

| Classe | Description |
|--------|-------------|
| `:Region` | Région administrative (ex: Île-de-France) |
| `:Department` | Département (ex: Paris, Val-de-Marne) |
| `:HousingData` | Données de logement (taux HLM, année) |
| `:PopulationGroup` | Groupe démographique (âge, sexe, localisation) |
| `:Sport` | Discipline sportive (ex: Football, Tennis) |
| `:SportParticipation` | Participation sportive annuelle (licences) |

### Propriétés Clés

```turtle
# Hiérarchie géographique
:locatedInRegion      # Department → Region
:locatedInDepartment  # PopulationGroup → Department

# Logement
:hasHousingData       # Department → HousingData
:proportionHLM        # HousingData → xsd:decimal

# Sports
:hasSport             # SportParticipation → Sport
:hasPopulationGroup   # SportParticipation → PopulationGroup
:numLicences          # SportParticipation → xsd:integer

# Démographie
:age                  # PopulationGroup → xsd:integer
:sex                  # PopulationGroup → xsd:string
```

---

## 🌐 Application Web

### Pages Disponibles

#### 🏠 Dashboard Principal (`index.html`)
- KPIs régionaux (licences, HLM, sport top)
- Pyramide des âges
- Top 5 sports (filtrable H/F)
- Mode comparaison 2 régions
- Classement national

#### 🗺️ Carte Interactive (`map.html`)
- Visualisation géographique
- Bulles proportionnelles aux licences
- Filtres par sport

#### 🏆 Top Sports (`sports.html`)
- Classement national des sports
- Stats par genre et âge

#### 📊 Corrélations (`correlation.html`)
- Analyse Sport vs HLM
- Graphiques de dispersion

#### 📖 Stories (`stories.html`)
- Narratifs dynamiques générés automatiquement

### Technologies
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)
- **Charts** : Chart.js
- **Proxy** : Node.js + Express + CORS
- **Data** : SPARQL → GraphDB

---

## 🔍 Requêtes SPARQL Optimisées

📖 **[Guide Complet des Requêtes SPARQL](SPARQL_QUERIES.md)**

Ce document contient :
- 🧪 Requêtes de validation du graphe
- 🌍 Enrichissement Wikidata (départements & régions)
- 📊 Analyses statistiques (sport, HLM, démographie)
- 🔗 Requêtes croisées Sport × HLM
- 🐛 Requêtes de debug
- ⚡ Optimisations de performance

### Exemple : Top 5 Sports par Région

```sparql
PREFIX : <http://example.org/sport-hlm#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?sportLabel (SUM(?licences) AS ?count) 
WHERE {
    ?part :numLicences ?licences ;
          :hasSport ?sport ;
          :hasPopulationGroup ?group .
    
    ?group :locatedInDepartment ?dep .
    ?dep :locatedInRegion ?reg .
    ?reg rdfs:label "Île-de-France" .
    ?sport rdfs:label ?sportLabel .
} 
GROUP BY ?sportLabel 
ORDER BY DESC(?count) 
LIMIT 5
```

### Optimisations Appliquées
- ✅ Décomposition des property paths
- ✅ Variables intermédiaires pour jointures
- ✅ LIMIT systématique
- ✅ Évitement des `FILTER NOT EXISTS`
- ✅ Requêtes parallèles côté JS

**💡 Voir [SPARQL_QUERIES.md](SPARQL_QUERIES.md) pour 15+ requêtes prêtes à l'emploi**

---

## 📊 Données

### Sources
- **Licences Sportives** : Ministère des Sports (2023) - 800k+ entrées
- **Logements HLM** : Data.gouv.fr (2021-2023)

### Statistiques
- **Triplets RDF** : ~1.2M
- **Régions** : 13 (France métropolitaine)
- **Départements** : 96
- **Sports** : 50+ disciplines

---

## 🐛 Dépannage

### GraphDB ne démarre pas
```bash
docker compose logs graphdb
docker compose restart graphdb
```

### Erreur CORS / NetworkError
→ Vérifiez que le proxy tourne sur le port 8080 :
```bash
curl http://localhost:8080/sparql
node webapp/proxy.js
```

### Requêtes trop lentes
→ Vérifiez les index GraphDB :
- GraphDB → Setup → Repositories → Gon → **Indices**
- Reconstruire si nécessaire

### Import TTL échoue
→ Vérifiez la syntaxe :
```bash
python scripts/clean_ttl_propre.py
```

---

## 🤝 Contribution

Les contributions sont bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout nouvelle visualisation'`)
4. Push (`git push origin feature/amelioration`)
5. Ouvrir une Pull Request

---

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

---

## 👤 Auteur

**Projet Sport & HLM**  
🎓 Master Web Sémantique & Données Liées  
📧 Contact : [votre.email@example.com]

---

## 🙏 Remerciements

- Ministère des Sports (données licences)
- Data.gouv.fr (données HLM)
- Ontotext GraphDB
- Communauté Web Sémantique

---

**⭐ Si ce projet vous plaît, n'oubliez pas de lui donner une étoile !**