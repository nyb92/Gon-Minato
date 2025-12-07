# 📚 Navigation de la Documentation

Guide rapide pour trouver l'information dont vous avez besoin.

---

## 🚀 Je veux démarrer rapidement

**➡️ [QUICK_START_NEW.md](QUICK_START_NEW.md)**
- Installation en 5 minutes
- Étapes détaillées
- Tests de validation
- Dépannage express

---

## 📖 Je veux comprendre le projet

**➡️ [README.md](README.md)**
- Vue d'ensemble complète
- Architecture du projet
- Objectifs et fonctionnalités
- Installation détaillée
- Description de l'ontologie
- Données et sources

---

## 🔧 Je veux développer ou contribuer

**➡️ [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)**
- Architecture technique
- Scripts Python expliqués
- Structure RDF détaillée
- Flux de données frontend
- Optimisations appliquées
- Design rationale
- Guide de déploiement

---

## 🔍 Je veux exécuter des requêtes SPARQL

**➡️ [SPARQL_QUERIES.md](SPARQL_QUERIES.md)**
- 15+ requêtes prêtes à l'emploi
- Requêtes de validation
- Enrichissement Wikidata
- Analyses statistiques
- Requêtes croisées Sport × HLM
- Optimisations de performance
- Debug et troubleshooting

---

## 🐛 J'ai un problème

### Le serveur ne démarre pas
**📍 [QUICK_START_NEW.md](QUICK_START_NEW.md#-problèmes-courants)**
- GraphDB ne démarre pas
- Proxy CORS en erreur
- Import TTL échoue

### Les requêtes sont lentes
**📍 [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md#-performances)**
- Métriques actuelles
- Stratégies d'optimisation
- Exemples comparatifs

### Erreur dans les données
**📍 [SPARQL_QUERIES.md](SPARQL_QUERIES.md#-requêtes-de-debug)**
- Vérifier liens manquants
- Départements orphelins
- Validation des triplets

---

## 📊 Je veux analyser les données

### Statistiques sportives
**📍 [SPARQL_QUERIES.md](SPARQL_QUERIES.md#-analyses-sportives)**
- Top sports par région
- Pyramide des âges
- Répartition H/F par sport

### Données HLM
**📍 [SPARQL_QUERIES.md](SPARQL_QUERIES.md#-requêtes-danalyse)**
- Taux HLM par région
- Taux HLM par département
- Évolution temporelle (2021-2023)

### Analyses croisées
**📍 [SPARQL_QUERIES.md](SPARQL_QUERIES.md#-requête-croisée-sport--hlm)**
- Corrélation Sport × HLM
- Analyse multi-dimensionnelle

---

## 🌍 Je veux enrichir avec Wikidata

**📍 [SPARQL_QUERIES.md](SPARQL_QUERIES.md#-enrichissement-wikidata)**
- Enrichir départements (population, superficie, coordonnées)
- Enrichir régions (même chose)
- Propriétés Wikidata utilisées

---

## 🎨 Je veux comprendre l'ontologie

**📍 [README.md](README.md#-ontologie)**
- Classes principales
- Propriétés clés
- Relations hiérarchiques

**📍 [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md#-ontologie---design-rationale)**
- Choix de modélisation
- Alternatives rejetées
- Justifications techniques

---

## 🐍 Je veux générer les fichiers RDF

**📍 [README.md](README.md#-génération-des-fichiers-rdf)**
- Scripts Python disponibles
- generate_sport_ttl.py
- generate_logements_ttl.py
- Ordre d'exécution

**📍 [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md#-scripts-python---détails-techniques)**
- Pipeline de traitement détaillé
- Nettoyage des données
- Optimisations appliquées

---

## 📦 Je veux importer dans GraphDB

**📍 [QUICK_START_NEW.md](QUICK_START_NEW.md#4%EF%B8%8F⃣-importer-les-données-rdf-ordre-strict)**

**⚠️ ORDRE OBLIGATOIRE** :
1. `rdf/ontology.ttl`
2. `rdf/logements_2021.ttl`
3. `rdf/logements_2022.ttl`
4. `rdf/logements_2023.ttl`
5. `rdf/sport.ttl.gz` (⏱️ ~10 min)

---

## 🌐 Je veux utiliser l'application web

### Lancer l'application
**📍 [QUICK_START_NEW.md](QUICK_START_NEW.md#5%EF%B8%8F⃣-lancer-le-proxy-sparql)**

### Architecture frontend
**📍 [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md#-application-web---architecture-frontend)**
- Flux de données
- Gestion du cache
- Optimisations SPARQL

### Pages disponibles
**📍 [README.md](README.md#-application-web)**
- Dashboard principal
- Carte interactive
- Top sports
- Corrélations
- Stories

---

## 🔄 Workflow Complet

### Pour Débutants
1. 📖 Lire [README.md](README.md) (vue d'ensemble)
2. 🚀 Suivre [QUICK_START_NEW.md](QUICK_START_NEW.md)
3. 🔍 Tester avec [SPARQL_QUERIES.md](SPARQL_QUERIES.md)

### Pour Développeurs
1. 📖 Lire [README.md](README.md)
2. 🔧 Approfondir avec [TECHNICAL_GUIDE.md](TECHNICAL_GUIDE.md)
3. 🔍 Maîtriser [SPARQL_QUERIES.md](SPARQL_QUERIES.md)
4. 🚀 Contribuer sur GitHub

### Pour Analystes de Données
1. 🚀 Installation rapide : [QUICK_START_NEW.md](QUICK_START_NEW.md)
2. 🔍 Explorer : [SPARQL_QUERIES.md](SPARQL_QUERIES.md)
3. 📊 Analyser via l'application web

---

## 📁 Structure de la Documentation

```
📚 Documentation/
├── README.md                # Vue d'ensemble complète ⭐
├── QUICK_START_NEW.md       # Installation rapide 🚀
├── TECHNICAL_GUIDE.md       # Guide développeur 🔧
├── SPARQL_QUERIES.md        # Requêtes SPARQL 🔍
└── DOCS_NAVIGATION.md       # Ce fichier 📍
```

---

## 🆘 Support

### Problème technique
1. Consulter [QUICK_START_NEW.md - Problèmes Courants](QUICK_START_NEW.md#-problèmes-courants)
2. Vérifier [TECHNICAL_GUIDE.md - Tests et Validation](TECHNICAL_GUIDE.md#-tests-et-validation)
3. Ouvrir une issue sur GitHub

### Question sur les données
1. Explorer [SPARQL_QUERIES.md](SPARQL_QUERIES.md)
2. Vérifier [README.md - Données](README.md#-données)

### Contribution
1. Lire [README.md - Contribution](README.md#-contribution)
2. Fork → Branch → PR

---

## 🎯 Raccourcis Utiles

| Je veux... | Document | Section |
|------------|----------|---------|
| Démarrer en 5 min | [QUICK_START_NEW](QUICK_START_NEW.md) | Installation Express |
| Comprendre l'archi | [TECHNICAL_GUIDE](TECHNICAL_GUIDE.md) | Architecture Globale |
| Top 10 sports | [SPARQL_QUERIES](SPARQL_QUERIES.md) | Analyses Sportives |
| Enrichir Wikidata | [SPARQL_QUERIES](SPARQL_QUERIES.md) | Enrichissement |
| Optimiser requêtes | [TECHNICAL_GUIDE](TECHNICAL_GUIDE.md) | Performances |
| Scripts Python | [README](README.md) | Génération RDF |
| Dépanner | [QUICK_START_NEW](QUICK_START_NEW.md) | Problèmes Courants |

---

**💡 Conseil** : Ajoutez ce fichier à vos favoris pour naviguer rapidement dans la documentation !

**🔙 Retour au README** : [README.md](README.md)
