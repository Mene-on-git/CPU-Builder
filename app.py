"""
CPU-Builder: Simulatore di Logica Digitale
Applicazione Desktop standalone con pywebview (nessun server Flask necessario).
"""

import webview
import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DIR = os.path.join(BASE_DIR, 'projects')
CHIPS_DIR = os.path.join(BASE_DIR, 'chips')


class Api:
    """API esposta al frontend JavaScript tramite pywebview js_api.

    I metodi di questa classe sono richiamabili da JS con:
        window.pywebview.api.nome_metodo(args)
    e restituiscono una Promise.
    """

    # ==================== PROGETTI ====================

    def lista_progetti(self):
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
        return progetti

    def carica_progetto(self, nome):
        """Carica un progetto specifico."""
        filepath = os.path.join(PROJECTS_DIR, f'{nome}.json')
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {'errore': 'Progetto non trovato'}

    def salva_progetto(self, data):
        """Salva un progetto (riceve un dict dal frontend)."""
        nome = data.get('nome', 'senza_nome')
        nome_sicuro = "".join(
            c for c in nome if c.isalnum() or c in ('-', '_', ' ')
        ).strip()
        if not nome_sicuro:
            nome_sicuro = 'senza_nome'

        data['data_modifica'] = datetime.now().isoformat()

        os.makedirs(PROJECTS_DIR, exist_ok=True)
        filepath = os.path.join(PROJECTS_DIR, f'{nome_sicuro}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return {'successo': True, 'nome': nome_sicuro}

    def elimina_progetto(self, nome):
        """Elimina un progetto."""
        filepath = os.path.join(PROJECTS_DIR, f'{nome}.json')
        if os.path.exists(filepath):
            os.remove(filepath)
            return {'successo': True}
        return {'errore': 'Progetto non trovato'}

    # ==================== CHIP PERSONALIZZATI ====================

    def lista_chip_personalizzati(self):
        """Restituisce la lista dei chip personalizzati da chips/ (incluse sottocartelle)."""
        os.makedirs(CHIPS_DIR, exist_ok=True)
        chips = []
        
        # Leggi dalla root (chips/) per retrocompatibilità
        for f in sorted(os.listdir(CHIPS_DIR)):
            if f.endswith('.json'):
                filepath = os.path.join(CHIPS_DIR, f)
                if os.path.isfile(filepath):
                    try:
                        with open(filepath, 'r', encoding='utf-8') as file:
                            data = json.load(file)
                            if 'cartella' not in data:
                                data['cartella'] = ''
                            chips.append(data)
                    except (json.JSONDecodeError, IOError):
                        continue
        
        # Leggi dalle sottocartelle
        try:
            for item in os.listdir(CHIPS_DIR):
                item_path = os.path.join(CHIPS_DIR, item)
                if os.path.isdir(item_path):
                    for f in sorted(os.listdir(item_path)):
                        if f.endswith('.json'):
                            filepath = os.path.join(item_path, f)
                            try:
                                with open(filepath, 'r', encoding='utf-8') as file:
                                    data = json.load(file)
                                    if 'cartella' not in data:
                                        data['cartella'] = item
                                    chips.append(data)
                            except (json.JSONDecodeError, IOError):
                                continue
        except OSError:
            pass
        
        return chips

    def salva_chip_personalizzato(self, data):
        """Salva un chip personalizzato, eventualmente in una sottocartella."""
        nome = data.get('nome', 'chip_custom')
        nome_sicuro = "".join(
            c for c in nome if c.isalnum() or c in ('-', '_', ' ')
        ).strip()

        cartella = data.get('cartella', '')
        cartella_sicura = "".join(
            c for c in cartella if c.isalnum() or c in ('-', '_', ' ')
        ).strip()

        if cartella_sicura:
            dest_dir = os.path.join(CHIPS_DIR, cartella_sicura)
        else:
            dest_dir = CHIPS_DIR

        os.makedirs(dest_dir, exist_ok=True)
        filepath = os.path.join(dest_dir, f'{nome_sicuro}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return {'successo': True, 'nome': nome_sicuro}

    def elimina_chip_personalizzato(self, nome):
        """Elimina un chip personalizzato."""
        filepath = os.path.join(CHIPS_DIR, f'{nome}.json')
        if os.path.exists(filepath):
            os.remove(filepath)
            return {'successo': True}
        return {'errore': 'Chip non trovato'}


def main():
    api = Api()
    html_path = os.path.join(BASE_DIR, 'index.html')

    window = webview.create_window(
        title='CPU-Builder — Simulatore di Logica Digitale',
        url=html_path,
        js_api=api,
        width=1280,
        height=800,
        min_size=(800, 600),
        resizable=True,
        text_select=False,
    )

    webview.start(debug=False)


if __name__ == '__main__':
    main()
