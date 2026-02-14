#!/bin/bash
# Skrypt diagnostyczny dla Ollama

echo "=========================================="
echo "🔍 Diagnostyka Ollama"
echo "=========================================="

# Sprawdź czy Ollama jest uruchomiona
echo ""
echo "Sprawdzanie statusu Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama jest uruchomiona"
    
    echo ""
    echo "📋 Dostępne modele:"
    curl -s http://localhost:11434/api/tags | python3 -m json.tool | grep '"name"' | cut -d'"' -f4
else
    echo "❌ Ollama nie jest uruchomiona"
    echo "   Uruchom: ollama serve"
    exit 1
fi

# Sprawdź zasoby systemowe
echo ""
echo "💾 Zasoby systemowe:"
if command -v free &> /dev/null; then
    free -h | grep Mem | awk '{print "  RAM: " $3 " używane / " $2 " łącznie"}'
elif command -v vm_stat &> /dev/null; then
    # macOS
    echo "  Sprawdź pamięć: Activity Monitor"
else
    echo "  Nie można sprawdzić pamięci"
fi

echo ""
echo "🤖 Zalecany model: llama3.1:8b"
echo "   Instalacja: ollama pull llama3.1:8b"

echo ""
echo "=========================================="
echo "✅ Diagnostyka zakończona"
echo "=========================================="
