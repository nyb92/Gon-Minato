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

### Pages et Fonctionnalités

#### 🏠 Dashboard Principal (`index.html`)
**Vue d'ensemble interactive et comparative des données régionales**

**📊 KPIs Dynamiques**
- Total des licences sportives (mise à jour en temps réel)
- Taux moyen de logements HLM
- Sport le plus pratiqué (avec filtre H/F)

**📈 Graphiques Interactifs**
- **Pyramide des Âges** : Distribution des licenciés par tranche d'âge
  - Histogramme en barres empilées
  - Comparaison possible entre 2 régions
  - Animation lors du chargement
  
- **Top 5 Sports** : Classement des sports les plus pratiqués
  - Graphique horizontal interactif
  - **Filtres en temps réel** : Tous / Hommes / Femmes
  - Mise à jour dynamique sans rechargement
  - Couleurs distinctives par genre
  
- **Répartition Hommes/Femmes** : Doughnut chart
  - Proportions en pourcentage
  - Animation interactive au survol
  - Légende dynamique

**🔄 Mode Comparaison**
- Sélection de 2 régions simultanément
- **Graphique Radar** multi-dimensionnel :
  - Taux HLM comparé
  - Pourcentage de femmes
  - Volume de licences normalisé
- **KPIs de différence** :
  - Δ Licences (affichage +/- coloré)
  - Δ Taux HLM
- Toggle activable/désactivable à la volée

**🏆 Classement National**
- Tableau des 15 régions
- Tri par nombre total de licences
- Colonnes : Rang, Région, Licences, Taux HLM
- Mise à jour automatique au chargement
- **Performance optimisée** : < 3 secondes

**💡 Insights Automatiques**
- Analyse textuelle générée dynamiquement
- Comparaisons intelligentes en mode dual
- Adaptation au contexte (région unique / comparaison)

---

#### 🗺️ Carte Interactive (`map.html`)
**Visualisation géographique des licences sportives**

**🌍 Carte de France**
- Rendu SVG interactif des régions
- Détection automatique des contours administratifs
- Zoom et pan fluides

**🎯 Bulles Proportionnelles**
- Taille proportionnelle au nombre de licences
- Échelle logarithmique pour meilleure lisibilité
- Animation d'apparition progressive

**🎨 Code Couleur**
- Gradient basé sur le taux HLM
- Rouge (taux élevé) → Vert (taux faible)
- Légende interactive

**ℹ️ Tooltips Enrichis**
- Nom de la région
- Nombre total de licences
- Taux HLM moyen
- Sport #1 local
- Affichage au survol

**🔍 Filtres** (en développement)
- Sélection par sport
- Sélection par tranche d'âge
- Sélection par genre

---

#### 🏅 Top Sports (`sports.html`)
**Analyse approfondie des disciplines sportives**

**📊 Classement National**
- Top 20 sports les plus pratiqués
- Graphique en barres horizontal
- Mise à jour en temps réel

**⚖️ Analyse Genre**
- **Graphique dual** : Pyramide Hommes vs Femmes
- Pourcentage de répartition par sport
- Sports les plus féminins / masculins
- Identification des sports mixtes

**👶 Répartition par Âge**
- Distribution par tranche d'âge pour chaque sport
- Identification des sports "jeunes" vs "seniors"
- Graphique en aires empilées

**🔎 Recherche et Filtres**
- Recherche textuelle de sport
- Filtre par genre dominant
- Filtre par popularité (seuil minimum de licences)

**💾 Export de Données**
- Export CSV des résultats
- Export JSON pour intégrations
- Copie vers clipboard

---

#### 📊 Corrélations (`correlation.html`)
**Analyse statistique Sport × HLM**

**📈 Graphique de Dispersion**
- Axe X : Taux HLM (%)
- Axe Y : Licences pour 1000 habitants
- Chaque point = 1 région
- Taille des points = population relative

**📉 Ligne de Tendance**
- Régression linéaire calculée en temps réel
- Affichage du coefficient de corrélation (R²)
- Équation de la droite

**🎯 Insights Statistiques**
- Coefficient de Pearson
- P-value (significativité)
- Interprétation automatique :
  - Corrélation positive/négative
  - Forte/moyenne/faible
  - Significative ou non

**🔍 Analyse par Sport**
- Sélection d'un sport spécifique
- Corrélation Sport individuel × HLM
- Comparaison avec moyenne nationale

**📊 Graphiques Complémentaires**
- Distribution HLM par région (histogramme)
- Distribution licences par région (histogramme)
- Heatmap corrélations multi-variables

**🔄 Interactions**
- Zoom sur zone d'intérêt
- Sélection de points pour détails
- Comparaison temporelle (2021-2023)

---

#### 📖 Stories (`stories.html`)
**Narratifs dynamiques et data storytelling**

**📚 Stories Générées Automatiquement**
1. **"La Région Sportive"** : Région avec le + de licences
2. **"Les Sports Mixtes"** : Parité H/F la plus équilibrée
3. **"Le Phénomène Jeune"** : Sport le + pratiqué chez les <18 ans
4. **"La Dynamique Senior"** : Sport le + pratiqué chez les >60 ans
5. **"Désert Sportif"** : Région avec le moins de licences

**🎨 Présentation**
- Cards visuelles avec icônes
- Texte narratif contextualisé
- Chiffres clés mis en valeur
- Graphiques miniatures intégrés

**🔄 Mise à Jour**
- Régénération automatique à chaque visite
- Basée sur données SPARQL en temps réel
- Adaptation au dataset courant

**💡 Analyses Avancées** (à venir)
- Comparaisons inter-régionales intelligentes
- Détection de tendances temporelles
- Anomalies et outliers
- Prédictions basées sur historique

---

### Technologies et Architecture

**Frontend**
- **HTML5** : Structure sémantique moderne
- **CSS3** : 
  - Flexbox/Grid pour layouts responsive
  - Animations CSS natives
  - Variables CSS pour thème cohérent
  - Dark mode compatible
- **JavaScript (Vanilla ES6+)** :
  - Pas de framework (performance optimale)
  - Async/Await pour requêtes
  - Modules ES6
  - Promise.all pour parallélisation

**Visualisation**
- **Chart.js 4.x** : 
  - Bar charts, Line charts, Doughnut, Radar
  - Animations fluides
  - Tooltips personnalisés
  - Responsive design
- **Leaflet.js** (carte) : Tuiles OpenStreetMap
- **D3.js** (optionnel) : Graphes avancés

**Communication**
- **Fetch API** : Requêtes HTTP modernes
- **Proxy CORS** : Node.js + Express
  - Gestion des preflight OPTIONS
  - Headers CORS permissifs (dev)
  - Logging des requêtes
  - Gestion d'erreurs robuste

**Data Flow**
```
User Interaction
    ↓
JavaScript Event
    ↓
SPARQL Query Builder
    ↓
Fetch → Proxy (8080)
    ↓
GraphDB (7200)
    ↓
JSON Response
    ↓
Data Parser
    ↓
Chart.js Update
    ↓
UI Render
```

**Performance**
- ⚡ Requêtes parallèles (3-5 simultanées)
- 🗄️ Cache navigateur activé
- 🎯 Lazy loading des graphiques
- 📦 Compression gzip
- ⏱️ Debouncing sur filtres
- 🔄 Update incrémentiel (pas de full reload)

**Responsive Design**
- 📱 Mobile-first approach
- 💻 Tablet optimisé
- 🖥️ Desktop full-featured
- Breakpoints : 320px, 768px, 1024px, 1440px

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