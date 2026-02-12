"""
CPU-Builder: Simulatore di Logica Digitale
Server Flask per servire l'applicazione e gestire salvataggio/caricamento progetti.
"""

from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# Directory per i progetti salvati
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DIR = os.path.join(BASE_DIR, 'projects')
CHIPS_DIR = os.path.join(BASE_DIR, 'chips')


@app.route('/')
def index():
    """Pagina principale del simulatore."""
    return render_template('index.html')


# ==================== API PROGETTI ====================

@app.route('/api/progetti', methods=['GET'])
def lista_progetti():
    """Restituisce la lista dei progetti salvati."""
    os.makedirs(PROJECTS_DIR, exist_ok=True)
    progetti = []
    for f in sorted(os.listdir(PROJECTS_DIR)):
        if f.endswith('.json'):
            filepath = os.path.join(PROJECTS_DIR, f)
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    progetti.append({
                        'nome': data.get('nome', f.replace('.json', '')),
                        'data_modifica': data.get('data_modifica', ''),
                        'num_chip': len(data.get('circuito', {}).get('chips', [])),
                        'num_fili': len(data.get('circuito', {}).get('fili', []))
                    })
            except (json.JSONDecodeError, IOError):
                continue
    return jsonify(progetti)


@app.route('/api/progetti/<nome>', methods=['GET'])
def carica_progetto(nome):
    """Carica un progetto specifico."""
    filepath = os.path.join(PROJECTS_DIR, f'{nome}.json')
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify({'errore': 'Progetto non trovato'}), 404


@app.route('/api/progetti', methods=['POST'])
def salva_progetto():
    """Salva un progetto."""
    data = request.json
    nome = data.get('nome', 'senza_nome')
    # Sanitizza il nome del file
    nome_sicuro = "".join(c for c in nome if c.isalnum() or c in ('-', '_', ' ')).strip()
    if not nome_sicuro:
        nome_sicuro = 'senza_nome'

    data['data_modifica'] = datetime.now().isoformat()

    os.makedirs(PROJECTS_DIR, exist_ok=True)
    filepath = os.path.join(PROJECTS_DIR, f'{nome_sicuro}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return jsonify({'successo': True, 'nome': nome_sicuro})


@app.route('/api/progetti/<nome>', methods=['DELETE'])
def elimina_progetto(nome):
    """Elimina un progetto."""
    filepath = os.path.join(PROJECTS_DIR, f'{nome}.json')
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'successo': True})
    return jsonify({'errore': 'Progetto non trovato'}), 404


# ==================== API CHIP PERSONALIZZATI ====================

@app.route('/api/chip-personalizzati', methods=['GET'])
def lista_chip_personalizzati():
    """Restituisce la lista dei chip personalizzati."""
    os.makedirs(CHIPS_DIR, exist_ok=True)
    chips = []
    for f in sorted(os.listdir(CHIPS_DIR)):
        if f.endswith('.json'):
            filepath = os.path.join(CHIPS_DIR, f)
            try:
                with open(filepath, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    chips.append(data)
            except (json.JSONDecodeError, IOError):
                continue
    return jsonify(chips)


@app.route('/api/chip-personalizzati', methods=['POST'])
def salva_chip_personalizzato():
    """Salva un chip personalizzato."""
    data = request.json
    nome = data.get('nome', 'chip_custom')
    nome_sicuro = "".join(c for c in nome if c.isalnum() or c in ('-', '_', ' ')).strip()

    os.makedirs(CHIPS_DIR, exist_ok=True)
    filepath = os.path.join(CHIPS_DIR, f'{nome_sicuro}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return jsonify({'successo': True, 'nome': nome_sicuro})


@app.route('/api/chip-personalizzati/<nome>', methods=['DELETE'])
def elimina_chip_personalizzato(nome):
    """Elimina un chip personalizzato."""
    filepath = os.path.join(CHIPS_DIR, f'{nome}.json')
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'successo': True})
    return jsonify({'errore': 'Chip non trovato'}), 404


# ==================== AVVIO SERVER ====================

if __name__ == '__main__':
    print("=" * 50)
    print("  CPU-Builder - Simulatore di Logica Digitale")
    print("=" * 50)
    print(f"  Server avviato su http://localhost:5000")
    print(f"  Progetti salvati in: {PROJECTS_DIR}")
    print("=" * 50)
    app.run(debug=True, port=5000)
