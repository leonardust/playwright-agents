#!/usr/bin/env python3
"""
Diagnostyka i optymalizacja Ollama dla testów Playwright
"""

import requests
import json
import sys
import psutil

def check_ollama_status():
    """Sprawdź czy Ollama jest uruchomiona"""
    print("🔍 Sprawdzanie statusu Ollama...")
    try:
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            print("✅ Ollama jest uruchomiona")
            models = response.json().get('models', [])
            if models:
                print(f"\n📋 Dostępne modele ({len(models)}):")
                for model in models:
                    print(f"  - {model.get('name', 'unknown')}")
                return True, models
            else:
                print("⚠️  Ollama działa, ale brak zainstalowanych modeli")
                return True, []
        else:
            print(f"❌ Ollama odpowiada z kodem: {response.status_code}")
            return False, []
    except requests.exceptions.ConnectionError:
        print("❌ Nie można połączyć się z Ollama (http://localhost:11434)")
        print("   Uruchom: ollama serve")
        return False, []
    except Exception as e:
        print(f"❌ Błąd: {e}")
        return False, []

def check_system_resources():
    """Sprawdź dostępne zasoby systemowe"""
    print("\n💾 Sprawdzanie zasobów systemowych...")
    
    # RAM
    ram = psutil.virtual_memory()
    ram_total_gb = ram.total / (1024**3)
    ram_available_gb = ram.available / (1024**3)
    
    print(f"  RAM: {ram_available_gb:.1f}GB dostępne / {ram_total_gb:.1f}GB łącznie")
    
    # CPU
    cpu_count = psutil.cpu_count()
    print(f"  CPU: {cpu_count} rdzeni")
    
    return ram_total_gb, ram_available_gb

def suggest_model(ram_total_gb):
    """Zasugeruj model na podstawie dostępnej pamięci"""
    print("\n🤖 Rekomendacje modelu:")
    
    if ram_total_gb >= 16:
        print("  ✅ Zalecany model: llama3.1:8b lub llama3.2")
        print("     Instalacja: ollama pull llama3.1:8b")
        return "llama3.1:8b"
    elif ram_total_gb >= 8:
        print("  ⚠️  Zalecany model: llama3.2:3b lub qwen2.5:3b")
        print("     Instalacja: ollama pull llama3.2:3b")
        return "llama3.2:3b"
    else:
        print("  ⚠️  Zalecany model: phi3:mini lub tinyllama")
        print("     Instalacja: ollama pull phi3:mini")
        return "phi3:mini"

def configure_model(model_name):
    """Skonfiguruj parametry modelu dla stabilności testów"""
    print(f"\n⚙️  Konfiguracja modelu {model_name}...")
    
    modelfile_content = f"""FROM {model_name}

# Parametry dla stabilności testów
PARAMETER temperature 0
PARAMETER num_ctx 8192
PARAMETER top_k 10
PARAMETER top_p 0.9

SYSTEM You are a precise web automation assistant. Your task is to identify UI elements on web pages with high accuracy. Always provide specific, unambiguous selectors.
"""
    
    print("\n📝 Zapisz poniższą konfigurację do pliku 'Modelfile':")
    print("=" * 60)
    print(modelfile_content)
    print("=" * 60)
    print("\nNastępnie uruchom:")
    print(f"  ollama create playwright-{model_name} -f Modelfile")
    
    return modelfile_content

def main():
    print("=" * 60)
    print("🚀 Diagnostyka Ollama dla Playwright AI Tests")
    print("=" * 60)
    
    # Krok 1: Sprawdź status Ollama
    is_running, models = check_ollama_status()
    
    if not is_running:
        print("\n❌ Ollama nie działa. Uruchom ją przed kontynuowaniem.")
        sys.exit(1)
    
    # Krok 2: Sprawdź zasoby systemowe
    ram_total, ram_available = check_system_resources()
    
    # Krok 3: Zasugeruj model
    suggested_model = suggest_model(ram_total)
    
    # Krok 4: Sprawdź czy sugerowany model jest zainstalowany
    model_names = [m.get('name', '') for m in models]
    if any(suggested_model in name for name in model_names):
        print(f"\n✅ Model {suggested_model} jest już zainstalowany")
    else:
        print(f"\n⚠️  Model {suggested_model} nie jest zainstalowany")
        print(f"   Uruchom: ollama pull {suggested_model}")
    
    # Krok 5: Wygeneruj konfigurację
    modelfile = configure_model(suggested_model)
    
    # Zapisz Modelfile
    with open('Modelfile', 'w') as f:
        f.write(modelfile)
    print("\n✅ Plik 'Modelfile' został utworzony")
    
    print("\n" + "=" * 60)
    print("✅ Diagnostyka zakończona pomyślnie!")
    print("=" * 60)
    
    print("\n📋 Następne kroki:")
    print("  1. ollama create playwright-model -f Modelfile")
    print("  2. Zaktualizuj .env z nowym modelem")
    print("  3. npm test")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Przerwano przez użytkownika")
        sys.exit(0)
