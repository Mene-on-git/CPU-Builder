"""
Script per aggiornare tutti i chip personalizzati con:
- Descrizioni appropriate
- Nomi corretti per ingressi e uscite
- Coerenza tra chip che si riferiscono l'uno all'altro
- Fix del bug nel Counter-9bit (Q2 collegato a Q1)
"""

import json
import os

CHIPS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chips')

# ============================================================
#  DEFINIZIONI: nomi corretti per ogni chip
# ============================================================

CHIP_META = {
    "ADDER": {
        "descrizione": "Sommatore completo a 1 bit (Full Adder). Somma A + B + Cin, produce S (somma) e Cout (riporto in uscita).",
        "ingressi": ["A", "B", "Cin"],
        "uscite": ["S", "Cout"],
    },
    "4 bit ADDER": {
        "descrizione": "Sommatore a 4 bit con riporto (Ripple Carry Adder). Somma due numeri binari a 4 bit A[3:0] + B[3:0] con riporto in ingresso Cin.",
        "ingressi": ["A3", "A2", "A1", "A0", "B3", "B2", "B1", "B0", "Cin"],
        "uscite": ["S3", "S2", "S1", "S0", "Cout"],
    },
    "set-reset": {
        "descrizione": "Latch SR (Set-Reset). S (Set) porta Q a 1, R (Reset) porta Q a 0. Quando entrambi sono 0, Q mantiene lo stato memorizzato.",
        "ingressi": ["S", "R"],
        "uscite": ["Q"],
    },
    "data-store": {
        "descrizione": "D Latch con abilitazione (Gated D Latch). Quando EN=1, l'uscita Q segue l'ingresso D. Quando EN=0, Q mantiene l'ultimo valore memorizzato.",
        "ingressi": ["D", "EN"],
        "uscite": ["Q"],
    },
    "d flip flop": {
        "descrizione": "Flip-Flop D master-slave edge-triggered. Cattura il valore dell'ingresso D sul fronte di salita del clock CLK.",
        "ingressi": ["D", "CLK"],
        "uscite": ["Q"],
    },
    "1 bit register": {
        "descrizione": "Registro a 1 bit con Write Enable. Quando WE=1, memorizza il valore di D sul fronte di clock. Quando WE=0, mantiene il valore corrente.",
        "ingressi": ["D", "WE", "CLK"],
        "uscite": ["Q"],
    },
    "register": {
        "descrizione": "Registro a 4 bit (latch). Memorizza 4 bit di dato D0-D3 quando EN (Enable) è attivo (1). Quando EN=0, mantiene i valori memorizzati.",
        "ingressi": ["D0", "D1", "D2", "D3", "EN"],
        "uscite": ["Q0", "Q1", "Q2", "Q3"],
    },
    "4 bit register": {
        "descrizione": "Registro a 4 bit con Write Enable e Clock. Memorizza i 4 bit di dato D0-D3 quando WE=1 sul fronte di salita del clock CLK.",
        "ingressi": ["D0", "D1", "D2", "D3", "WE", "CLK"],
        "uscite": ["Q0", "Q1", "Q2", "Q3"],
    },
    "nand chip": {
        "descrizione": "Quad NAND — 4 porte NAND indipendenti in un singolo chip. Ogni coppia di ingressi (Ax, Bx) produce l'uscita NAND corrispondente Qx = NOT(Ax AND Bx).",
        "ingressi": ["A0", "B0", "A1", "B1", "A2", "B2", "A3", "B3"],
        "uscite": ["Q0", "Q1", "Q2", "Q3"],
    },
    "ALU": {
        "descrizione": "Unità Aritmetico-Logica a 4 bit. Esegue addizione (SUB=0) o sottrazione in complemento a 2 (SUB=1) tra A[3:0] e B[3:0]. Produce il risultato S[3:0] e i flag: CARRY (riporto), NEG (risultato negativo, MSB), ZERO (risultato uguale a zero).",
        "ingressi": ["A3", "A2", "A1", "A0", "B3", "B2", "B1", "B0", "SUB"],
        "uscite": ["S3", "S2", "S1", "S0", "CARRY", "NEG", "ZERO"],
    },
    "alu-register": {
        "descrizione": "Blocco ALU con registri. Due registri a 4 bit (A e B) collegati a un'ALU. Il risultato dell'ALU viene riscritto nel registro A. B3-B0 sono gli ingressi dati per il registro B. WE abilita la scrittura, CLK è il clock.",
        "ingressi": ["B3", "B2", "B1", "B0", "WE", "CLK"],
        "uscite": ["Q3", "Q2", "Q1", "Q0"],
    },
    "Counter-9bit": {
        "descrizione": "Contatore BCD (decade, 0-9). Conta sul fronte di clock e si resetta automaticamente a 0 dopo aver raggiunto 9. Le uscite Q0-Q3 rappresentano il valore binario del conteggio.",
        "ingressi": ["CLK"],
        "uscite": ["Q0", "Q1", "Q2", "Q3"],
    },
    "Counter-2bit": {
        "descrizione": "Contatore a 2 bit (0-3). Conta ciclicamente da 0 a 3 sul fronte di clock. Q0 è il bit meno significativo.",
        "ingressi": ["CLK"],
        "uscite": ["Q0", "Q1"],
    },
    "BCD→7SEG": {
        "descrizione": "Decoder BCD → 7 segmenti. Converte un valore BCD a 4 bit (D0-D3, cifre 0-9) nei 7 segnali di controllo (A-G) per un display a 7 segmenti. DP (punto decimale) è fisso a 0.",
        "ingressi": ["D0", "D1", "D2", "D3"],
        "uscite": ["A", "B", "C", "D", "E", "F", "G", "DP"],
    },
}

# Pin labels da applicare alle istanze CUSTOM_* nei circuiti dei chip genitori.
# Chiave = tipo chip (come appare nel campo "tipo" delle istanze), Valore = (ingressi, uscite)
CUSTOM_PIN_LABELS = {
    "CUSTOM_DATA-STORE":       (["D", "EN"], ["Q"]),
    "CUSTOM_D_FLIP_FLOP":      (["D", "CLK"], ["Q"]),
    "CUSTOM_1_BIT_REGISTER":   (["D", "WE", "CLK"], ["Q"]),
    "CUSTOM_4_BIT_REGISTER":   (["D0", "D1", "D2", "D3", "WE", "CLK"], ["Q0", "Q1", "Q2", "Q3"]),
    "CUSTOM_ADDER":            (["A", "B", "Cin"], ["S", "Cout"]),
    "CUSTOM_4_BIT_ADDER":      (["A3", "A2", "A1", "A0", "B3", "B2", "B1", "B0", "Cin"], ["S3", "S2", "S1", "S0", "Cout"]),
    "CUSTOM_ALU":              (["A3", "A2", "A1", "A0", "B3", "B2", "B1", "B0", "SUB"], ["S3", "S2", "S1", "S0", "CARRY", "NEG", "ZERO"]),
    "CUSTOM_REGISTER":         (["D0", "D1", "D2", "D3", "EN"], ["Q0", "Q1", "Q2", "Q3"]),
    "CUSTOM_SET-RESET":        (["S", "R"], ["Q"]),
    "CUSTOM_NAND_CHIP":        (["A0", "B0", "A1", "B1", "A2", "B2", "A3", "B3"], ["Q0", "Q1", "Q2", "Q3"]),
    "CUSTOM_COUNTER-9BIT":     (["CLK"], ["Q0", "Q1", "Q2", "Q3"]),
    "CUSTOM_COUNTER-2BIT":     (["CLK"], ["Q0", "Q1"]),
    "CUSTOM_BCD→7SEG":         (["D0", "D1", "D2", "D3"], ["A", "B", "C", "D", "E", "F", "G", "DP"]),
    "CUSTOM_ALU-REGISTER":     (["B3", "B2", "B1", "B0", "WE", "CLK"], ["Q3", "Q2", "Q1", "Q0"]),
}


def update_chip(data):
    """Aggiorna un singolo chip JSON con metadati e nomi corretti."""
    nome = data["nome"]
    meta = CHIP_META.get(nome)
    if not meta:
        print(f"  [SKIP] Nessuna definizione trovata per '{nome}'")
        return False

    # 1. Aggiorna metadati di primo livello
    data["descrizione"] = meta["descrizione"]
    data["ingressi"] = meta["ingressi"]
    data["uscite"] = meta["uscite"]

    chips = data.get("circuito", {}).get("chips", [])

    # 2. Aggiorna nomeCustom su INGRESSO e USCITA interni
    idx_in = 0
    idx_out = 0
    for chip in chips:
        if chip["tipo"] == "INGRESSO":
            if idx_in < len(meta["ingressi"]):
                chip["nomeCustom"] = meta["ingressi"][idx_in]
                idx_in += 1
        elif chip["tipo"] == "USCITA":
            if idx_out < len(meta["uscite"]):
                chip["nomeCustom"] = meta["uscite"][idx_out]
                idx_out += 1

    # 3. Aggiorna le etichette dei pin sulle istanze CUSTOM_* usate nel circuito
    for chip in chips:
        tipo = chip["tipo"]
        if tipo in CUSTOM_PIN_LABELS:
            labels_in, labels_out = CUSTOM_PIN_LABELS[tipo]
            pin_i = chip.get("pinI", [])
            pin_u = chip.get("pinU", [])
            for i, label in enumerate(labels_in):
                if i < len(pin_i):
                    pin_i[i]["et"] = label
            for i, label in enumerate(labels_out):
                if i < len(pin_u):
                    pin_u[i]["et"] = label

    return True


def fix_counter9bit(data):
    """
    Fix bug nel Counter-9bit: il filo 70 collega erroneamente
    Q1 (srcId:23) all'uscita Q2 invece di Q2 (srcId:24).
    """
    if data["nome"] != "Counter-9bit":
        return False

    fili = data.get("circuito", {}).get("fili", [])
    for filo in fili:
        if filo["id"] == 70 and filo["srcId"] == 23:
            print("  [FIX] Counter-9bit: filo 70 srcId 23 (Q1) → 24 (Q2)")
            filo["srcId"] = 24
            return True
    return False


def main():
    print("=" * 60)
    print("  Aggiornamento chip personalizzati CPU-Builder")
    print("=" * 60)

    for filename in sorted(os.listdir(CHIPS_DIR)):
        if not filename.endswith('.json'):
            continue

        filepath = os.path.join(CHIPS_DIR, filename)
        print(f"\n📦 {filename}")

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        modified = update_chip(data)
        fixed = fix_counter9bit(data)

        if modified or fixed:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  ✅ Aggiornato: ingressi={data['ingressi']}, uscite={data['uscite']}")
        else:
            print(f"  ⏭ Nessuna modifica")

    print("\n" + "=" * 60)
    print("  Fatto! Tutti i chip sono stati aggiornati.")
    print("=" * 60)


if __name__ == '__main__':
    main()
