#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🚀 Démarrage du serveur Web local                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Dossier : webapp/"
echo "🌐 URL     : http://localhost:8000"
echo ""
echo "Pages disponibles :"
echo "  → http://localhost:8000/index.html (Dashboard principal)"
echo "  → http://localhost:8000/map.html (Carte interactive)"
echo "  → http://localhost:8000/sports.html (Sports + pratiqués)"
echo "  → http://localhost:8000/stories.html (Stories du sport)"
echo "  → http://localhost:8000/correlation.html (Corrélation Sport/HLM)"
echo ""
echo "⏹️  Pour arrêter : Ctrl+C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd webapp
python3 -m http.server 8000
