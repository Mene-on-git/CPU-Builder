# CPU-Builder

CPU-Builder è un simulatore di logica digitale sviluppato in Python con Flask e interfaccia web. Il progetto permette di creare, collegare e testare circuiti logici in modo visuale, usando porte logiche, componenti personalizzati e circuiti già pronti.

## Cosa fa il progetto

Questo strumento nasce per costruire e simulare circuiti digitali direttamente dal browser. In pratica puoi:

- inserire porte logiche base come AND, OR, NOT, NAND, XOR, NOR, XNOR e BUFFER;
- aggiungere ingressi, pulsanti e uscite;
- collegare i componenti con fili;
- eseguire la simulazione passo per passo o in tempo reale;
- salvare e ricaricare i progetti;
- esportare circuiti come chip personalizzati riutilizzabili.

Il progetto include anche chip già definiti, come ad esempio:

- OR
- XNOR
- MUX 2-1

Questi chip sono costruiti a partire dalle porte logiche di base, così da permettere l’uso di circuiti più complessi senza doverli ricreare ogni volta da zero.

## Funzionalità principali

### Editor grafico
L’interfaccia web consente di posizionare i componenti su una griglia, collegarli e modificare il progetto in modo intuitivo.

### Simulazione della logica
Il motore del progetto calcola gli stati dei segnali digitali e aggiorna l’uscita dei chip in base agli ingressi.

### Salvataggio dei progetti
Il backend Flask fornisce API per:

- elencare i progetti salvati;
- caricare un progetto esistente;
- salvare un progetto in formato JSON;
- eliminare un progetto.

### Chip personalizzati
Oltre ai componenti base, il progetto permette di esportare circuiti come chip riutilizzabili, utili per costruire sistemi più grandi e modulari.

### Vista interna dei chip
Per alcuni componenti nativi è disponibile anche una rappresentazione interna, utile per capire come sono implementati a livello logico.

## Struttura del progetto

- `server.py` — server Flask e API per la gestione dei progetti;
- `templates/index.html` — pagina principale dell’applicazione;
- `static/js/app.js` — logica principale dell’editor e del simulatore;
- `static/js/graphics.js` — rendering e schemi interni;
- `static/css/style.css` — stile grafico dell’interfaccia;
- `chips/` — chip personalizzati già salvati in JSON.

## Tecnologie usate

- Python
- Flask
- HTML
- CSS
- JavaScript
- JSON

## Installazione

1. Installa le dipendenze:

```bash
pip install -r requirements.txt
```

2. Avvia il server:

```bash
python server.py
```

3. Apri il browser e visita l’indirizzo del server locale.

## Obiettivo del progetto

L’obiettivo di CPU-Builder è rendere più semplice lo studio e la costruzione di circuiti digitali, offrendo un ambiente visuale per sperimentare con la logica booleana e con la composizione di chip personalizzati.

## Stato del progetto

Il progetto è in sviluppo e può essere esteso con nuove porte logiche, nuovi chip e funzionalità avanzate di simulazione.

## Note

Questo progetto è pensato come strumento didattico e pratico per esplorare il funzionamento della logica digitale e dei circuiti combinatori.
