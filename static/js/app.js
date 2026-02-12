// ============================================================
//  CPU-Builder — Simulatore di Logica Digitale
//  Logica: engine, editor, simulatore, salvataggio
//  (la parte grafica è in graphics.js)
// ============================================================

// ======================== UTILITÀ ========================

let _prossimoId = 1;
function generaId() { return _prossimoId++; }
function aggiornaContatorId(val) { _prossimoId = Math.max(_prossimoId, val + 1); }
function distanza(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function snap(val, g) { return Math.round(val / g) * g; }

// ======================== DEFINIZIONI CHIP ========================

const DEFS = {
    NAND:       { nome:'NAND',  cat:'porte', ing:['A','B'], usc:['Q'], col:'#c0392b', w:100, h:60,
                  fn: i => [1-(i[0]&i[1])] },
    AND:        { nome:'AND',   cat:'porte', ing:['A','B'], usc:['Q'], col:'#2980b9', w:100, h:60,
                  fn: i => [i[0]&i[1]] },
    OR:         { nome:'OR',    cat:'porte', ing:['A','B'], usc:['Q'], col:'#27ae60', w:100, h:60,
                  fn: i => [i[0]|i[1]] },
    NOT:        { nome:'NOT',   cat:'porte', ing:['A'],     usc:['Q'], col:'#8e44ad', w:90,  h:50,
                  fn: i => [1-i[0]] },
    XOR:        { nome:'XOR',   cat:'porte', ing:['A','B'], usc:['Q'], col:'#d35400', w:100, h:60,
                  fn: i => [i[0]^i[1]] },
    NOR:        { nome:'NOR',   cat:'porte', ing:['A','B'], usc:['Q'], col:'#1abc9c', w:100, h:60,
                  fn: i => [1-(i[0]|i[1])] },
    XNOR:       { nome:'XNOR',  cat:'porte', ing:['A','B'], usc:['Q'], col:'#e91e63', w:100, h:60,
                  fn: i => [1-(i[0]^i[1])] },
    BUFFER:     { nome:'BUF',   cat:'porte', ing:['A'],     usc:['Q'], col:'#607d8b', w:90,  h:50,
                  fn: i => [i[0]] },
    INGRESSO:   { nome:'IN',    cat:'io', ing:[], usc:['OUT'], col:'#16a085', w:80, h:50,
                  interattivo:true, fn:null },
    PULSANTE:   { nome:'BTN',   cat:'io', ing:[], usc:['OUT'], col:'#e74c3c', w:80, h:50,
                  interattivo:true, fn:null },
    USCITA:     { nome:'OUT',   cat:'io', ing:['IN'], usc:[], col:'#e67e22', w:80, h:50, fn:null },
    CLOCK:      { nome:'CLK',   cat:'io', ing:[], usc:['CLK'], col:'#34495e', w:90, h:55,
                  interattivo:true, fn:null },
    COSTANTE_0: { nome:'0',     cat:'io', ing:[], usc:['OUT'], col:'#555555', w:60, h:45, fn:()=>[0] },
    COSTANTE_1: { nome:'1',     cat:'io', ing:[], usc:['OUT'], col:'#00aa55', w:60, h:45, fn:()=>[1] },
    DISPLAY7:   { nome:'7SEG',  cat:'display', ing:['A','B','C','D','E','F','G','DP'], usc:[], col:'#1a1a2e', w:120, h:160, fn:null },
    FLIPFLOP_D: { nome:'D-FF',  cat:'memoria', ing:['D','CLK','RST'], usc:['Q','Q̄'], col:'#3498db', w:110, h:80, fn:null },
    CONTATORE_4BIT: { nome:'CNT4', cat:'memoria', ing:['CLK','RST'], usc:['Q0','Q1','Q2','Q3'], col:'#9b59b6', w:120, h:100, fn:null },
    DECODER_BCD7:   { nome:'BCD→7', cat:'display', ing:['D0','D1','D2','D3'], usc:['A','B','C','D','E','F','G'], col:'#e67e22', w:120, h:130, fn:null },
};

// ======================== CLASSI DATI ========================

class Pin {
    constructor(tipo, etichetta, chipId, id) {
        this.id = id || generaId();
        this.tipo = tipo;           // 'ingresso' | 'uscita'
        this.etichetta = etichetta;
        this.chipId = chipId;
        this.stato = 0;
        this.offX = 0;
        this.offY = 0;
    }
}

class Filo {
    constructor(srcId, dstId, id) {
        this.id = id || generaId();
        this.srcId = srcId;    // pin uscita
        this.dstId = dstId;    // pin ingresso
    }
}

class Chip {
    constructor(tipo, x, y, id) {
        this.id = id || generaId();
        this.tipo = tipo;
        this.x = x; this.y = y;

        const d = DEFS[tipo];
        this.nome   = d ? d.nome : tipo;
        this.colore = d ? d.col  : '#7f8c8d';
        this.w      = d ? d.w    : 100;
        this.h      = d ? d.h    : 60;

        this.pinI = [];
        this.pinU = [];
        this.stato = (tipo === 'CLOCK') ? 1 : 0;  // statoInterattivo
        this.statoInterno = {};  // Stato interno per chip sequenziali (es. flip-flop)

        // Inizializza stato interno per chip sequenziali
        if(tipo === 'FLIPFLOP_D') {
            this.statoInterno.Q = 0;
            this.statoInterno.clkPrev = 0;
        }
        if(tipo === 'CONTATORE_4BIT') {
            this.statoInterno.valore = 0;   // conteggio 0-15
            this.statoInterno.clkPrev = 0;
        }

        // Crea pin
        if (d) {
            d.ing.forEach(e => this.pinI.push(new Pin('ingresso', e, this.id)));
            d.usc.forEach(e => this.pinU.push(new Pin('uscita',  e, this.id)));
        }
        this._calcolaOffset();
    }

    _calcolaOffset() {
        const mt = 22;
        const hu = this.h - mt;
        if (this.pinI.length) {
            const s = hu / (this.pinI.length + 1);
            this.pinI.forEach((p,i) => { p.offX = 0;      p.offY = mt + s*(i+1); });
        }
        if (this.pinU.length) {
            const s = hu / (this.pinU.length + 1);
            this.pinU.forEach((p,i) => { p.offX = this.w;  p.offY = mt + s*(i+1); });
        }
    }

    tutti() { return [...this.pinI, ...this.pinU]; }
    trovaPin(pid) { return this.tutti().find(p => p.id === pid); }
    pinMondo(p) { return { x: this.x+p.offX, y: this.y+p.offY }; }
    contiene(mx,my) { return mx>=this.x && mx<=this.x+this.w && my>=this.y && my<=this.y+this.h; }
}

// ======================== SIMULATORE ========================

class Simulatore {
    constructor() {
        this.chips = new Map();
        this.fili  = new Map();
        this.attivo = true;
        this.passo  = 0;
        this.clkStato = 0;
        this.clkCnt   = 0;
        this.clkPer   = 30;
        this.customDefs = new Map();   // nome -> { ing, usc, circuito }
    }

    add(chip)  { this.chips.set(chip.id, chip); this._syncIds(chip); }
    del(id)    {
        const c = this.chips.get(id); if(!c) return;
        const pids = new Set(c.tutti().map(p=>p.id));
        const rm = [];
        this.fili.forEach((f,fid) => { if(pids.has(f.srcId)||pids.has(f.dstId)) rm.push(fid); });
        rm.forEach(fid => this.fili.delete(fid));
        this.chips.delete(id);
    }
    addFilo(f) {
        // Evita duplicati
        for(const ef of this.fili.values())
            if(ef.srcId===f.srcId && ef.dstId===f.dstId) return false;
        // Un pin ingresso può avere un solo filo in arrivo
        for(const ef of this.fili.values())
            if(ef.dstId===f.dstId) { this.fili.delete(ef.id); break; }
        this.fili.set(f.id, f); aggiornaContatorId(f.id+1); return true;
    }
    delFilo(id) { this.fili.delete(id); }

    _syncIds(chip) {
        aggiornaContatorId(chip.id+1);
        chip.tutti().forEach(p => aggiornaContatorId(p.id+1));
    }

    chipDaPin(pid) { for(const c of this.chips.values()) if(c.trovaPin(pid)) return c; return null; }
    pin(pid)       { for(const c of this.chips.values()){ const p=c.trovaPin(pid); if(p) return p; } return null; }

    tick() {
        if(!this.attivo) return;
        this.passo++;

        // Clock
        this.clkCnt++;
        if(this.clkCnt >= this.clkPer){ this.clkCnt=0; this.clkStato=1-this.clkStato; }

        // Input speciali
        for(const c of this.chips.values()){
            if(c.tipo==='INGRESSO' && c.pinU.length)
                c.pinU[0].stato = c.stato;
            else if(c.tipo==='PULSANTE' && c.pinU.length)
                c.pinU[0].stato = c.stato;
            else if(c.tipo==='CLOCK' && c.pinU.length)
                c.pinU[0].stato = c.stato ? this.clkStato : 0;
        }

        // Propagazione iterativa
        for(let iter=0; iter<20; iter++){
            let changed = false;

            // Fili
            for(const f of this.fili.values()){
                const ps = this.pin(f.srcId), pd = this.pin(f.dstId);
                if(ps && pd && pd.stato !== ps.stato){ pd.stato=ps.stato; changed=true; }
            }

            // Valutazione chip
            for(const c of this.chips.values()){
                const d = DEFS[c.tipo];
                if(d && d.fn){
                    const ing = c.pinI.map(p=>p.stato);
                    const usc = d.fn(ing);
                    if(usc) usc.forEach((v,i) => {
                        if(i<c.pinU.length){ const nv = v?1:0; if(c.pinU[i].stato!==nv){ c.pinU[i].stato=nv; changed=true; }}
                    });
                }
                // Flip-flop D (edge-triggered)
                if(c.tipo === 'FLIPFLOP_D' && c.pinI.length >= 3){
                    const D = c.pinI[0].stato;      // Data input
                    const CLK = c.pinI[1].stato;    // Clock
                    const RST = c.pinI[2].stato;    // Reset (attivo alto)
                    const clkPrev = c.statoInterno.clkPrev || 0;
                    
                    // Rileva fronte di salita (rising edge)
                    const risingEdge = (CLK === 1 && clkPrev === 0);
                    
                    if(RST) {
                        // Reset sincrono: azzera Q
                        if(c.statoInterno.Q !== 0){ c.statoInterno.Q = 0; changed = true; }
                    } else if(risingEdge) {
                        // Sul fronte di salita: cattura D in Q
                        if(c.statoInterno.Q !== D){ c.statoInterno.Q = D; changed = true; }
                    }
                    
                    // Aggiorna uscite Q e Q̄
                    const Q = c.statoInterno.Q;
                    if(c.pinU[0] && c.pinU[0].stato !== Q){ c.pinU[0].stato = Q; changed = true; }
                    if(c.pinU[1] && c.pinU[1].stato !== (1-Q)){ c.pinU[1].stato = 1-Q; changed = true; }
                    
                    // Memorizza stato clock per prossimo ciclo
                    c.statoInterno.clkPrev = CLK;
                }
                // Contatore 4 bit (edge-triggered, conta sul fronte di salita)
                if(c.tipo === 'CONTATORE_4BIT' && c.pinI.length >= 2){
                    const CLK = c.pinI[0].stato;
                    const RST = c.pinI[1].stato;
                    const clkPrev = c.statoInterno.clkPrev || 0;
                    const risingEdge = (CLK === 1 && clkPrev === 0);

                    if(RST) {
                        if(c.statoInterno.valore !== 0){ c.statoInterno.valore = 0; changed = true; }
                    } else if(risingEdge) {
                        c.statoInterno.valore = (c.statoInterno.valore + 1) & 0xF;
                        changed = true;
                    }

                    // Uscite Q0..Q3 (bit meno significativo → Q0)
                    const v = c.statoInterno.valore;
                    for(let b=0; b<4; b++){
                        const bit = (v >> b) & 1;
                        if(c.pinU[b] && c.pinU[b].stato !== bit){ c.pinU[b].stato = bit; changed = true; }
                    }
                    c.statoInterno.clkPrev = CLK;
                }
                // Decoder BCD → 7 segmenti (combinatorio, truth table)
                if(c.tipo === 'DECODER_BCD7' && c.pinI.length >= 4){
                    //       A B C D E F G
                    const TT = [
                        [1,1,1,1,1,1,0], // 0
                        [0,1,1,0,0,0,0], // 1
                        [1,1,0,1,1,0,1], // 2
                        [1,1,1,1,0,0,1], // 3
                        [0,1,1,0,0,1,1], // 4
                        [1,0,1,1,0,1,1], // 5
                        [1,0,1,1,1,1,1], // 6
                        [1,1,1,0,0,0,0], // 7
                        [1,1,1,1,1,1,1], // 8
                        [1,1,1,1,0,1,1], // 9
                    ];
                    const digit = (c.pinI[0].stato) | (c.pinI[1].stato<<1) | (c.pinI[2].stato<<2) | (c.pinI[3].stato<<3);
                    const row = (digit >= 0 && digit <= 9) ? TT[digit] : [0,0,0,0,0,0,0];
                    for(let s=0; s<7; s++){
                        if(c.pinU[s] && c.pinU[s].stato !== row[s]){ c.pinU[s].stato = row[s]; changed = true; }
                    }
                }
                // Chip personalizzati
                if(this.customDefs.has(c.tipo)){
                    const cd = this.customDefs.get(c.tipo);
                    const r = this._valutaCustom(cd, c.pinI.map(p=>p.stato), c);
                    if(r) r.forEach((v,i) => {
                        if(i<c.pinU.length){ const nv=v?1:0; if(c.pinU[i].stato!==nv){ c.pinU[i].stato=nv; changed=true; }}
                    });
                }
            }
            if(!changed) break;
        }
    }

    _valutaCustom(def, ingressi, chipEsterno) {
        // Usa mini-simulazione persistente per mantenere lo stato interno
        if(!chipEsterno.statoInterno._miniSim) {
            // Prima volta: crea la mini-simulazione
            const miniSim = new Simulatore();
            miniSim.attivo = true;
            miniSim.clkPer = this.clkPer;

            const circuito = JSON.parse(JSON.stringify(def.circuito));
            const idMap = new Map();
            const oldToNew = (oldId) => {
                if(!idMap.has(oldId)) idMap.set(oldId, generaId());
                return idMap.get(oldId);
            };

            circuito.chips.forEach(cd => {
                const newId = oldToNew(cd.id);
                const chip = new Chip(cd.tipo, cd.x, cd.y, newId);
                chip.stato = cd.stato || 0;
                cd.pinI.forEach((pd, i) => {
                    if(i < chip.pinI.length) chip.pinI[i].id = oldToNew(pd.id);
                });
                cd.pinU.forEach((pd, i) => {
                    if(i < chip.pinU.length) chip.pinU[i].id = oldToNew(pd.id);
                });
                miniSim.add(chip);
            });

            circuito.fili.forEach(fd => {
                const newSrc = oldToNew(fd.srcId);
                const newDst = oldToNew(fd.dstId);
                miniSim.addFilo(new Filo(newSrc, newDst, generaId()));
            });

            chipEsterno.statoInterno._miniSim = miniSim;
        }

        const miniSim = chipEsterno.statoInterno._miniSim;
        miniSim.clkStato = this.clkStato;
        // Eredita le definizioni dei chip personalizzati (per chip annidati)
        miniSim.customDefs = this.customDefs;

        // Imposta ingressi
        let idxIn = 0;
        for(const c of miniSim.chips.values()){
            if(c.tipo === 'INGRESSO' && idxIn < ingressi.length){
                c.stato = ingressi[idxIn++];
            }
        }

        // Un solo tick per preservare edge-detection
        miniSim.tick();

        // Leggi uscite
        const risultati = [];
        for(const c of miniSim.chips.values()){
            if(c.tipo === 'USCITA' && c.pinI.length){
                risultati.push(c.pinI[0].stato);
            }
        }
        return risultati;
    }

    reset() {
        this.passo=0; this.clkStato=0; this.clkCnt=0;
        for(const c of this.chips.values()){
            c.tutti().forEach(p=>p.stato=0);
            if(c.tipo!=='CLOCK') c.stato=0;
            // Reset stato interno flip-flop
            if(c.tipo==='FLIPFLOP_D' && c.statoInterno){
                c.statoInterno.Q = 0;
                c.statoInterno.clkPrev = 0;
            }
            // Reset stato interno contatore
            if(c.tipo==='CONTATORE_4BIT' && c.statoInterno){
                c.statoInterno.valore = 0;
                c.statoInterno.clkPrev = 0;
            }
            // Reset chip personalizzati (rimuovi mini-sim persistente)
            if(c.statoInterno && c.statoInterno._miniSim){
                delete c.statoInterno._miniSim;
            }
        }
    }

    serializza() {
        const chips=[], fili=[];
        for(const c of this.chips.values()){
            // Escludi _miniSim dalla serializzazione
            const si = Object.assign({}, c.statoInterno || {});
            delete si._miniSim;
            chips.push({ id:c.id, tipo:c.tipo, x:c.x, y:c.y, stato:c.stato,
                statoInterno: si,
                pinI: c.pinI.map(p=>({id:p.id, et:p.etichetta})),
                pinU: c.pinU.map(p=>({id:p.id, et:p.etichetta})) });
        }
        for(const f of this.fili.values())
            fili.push({ id:f.id, srcId:f.srcId, dstId:f.dstId });
        return { chips, fili };
    }

    deserializza(data) {
        this.chips.clear(); this.fili.clear(); _prossimoId=1;
        if(data.chips) data.chips.forEach(cd => {
            const ch = new Chip(cd.tipo, cd.x, cd.y, cd.id);
            ch.stato = cd.stato||0;
            if(cd.statoInterno) ch.statoInterno = cd.statoInterno;
            if(cd.pinI) cd.pinI.forEach((pd,i)=>{ if(i<ch.pinI.length){ ch.pinI[i].id=pd.id; ch.pinI[i].etichetta=pd.et||ch.pinI[i].etichetta; }});
            if(cd.pinU) cd.pinU.forEach((pd,i)=>{ if(i<ch.pinU.length){ ch.pinU[i].id=pd.id; ch.pinU[i].etichetta=pd.et||ch.pinU[i].etichetta; }});
            this.add(ch);
        });
        if(data.fili) data.fili.forEach(fd => {
            this.addFilo(new Filo(fd.srcId, fd.dstId, fd.id));
        });
    }
}

// ======================== EDITOR ========================

class Editor {
    constructor(canvas, sim, ren) {
        this._cv = canvas;
        this._sim = sim;
        this._ren = ren;

        // Modo: 'select' | 'place' | 'wire'
        this.modo = 'select';
        this.tipoPlace = null;        // tipo di chip da piazzare

        // Selezione
        this.selChips = new Set();
        this.selFili  = new Set();

        // Filo in costruzione
        this.filoStart = null;        // Pin di partenza

        // Mouse (coordinate mondo)
        this.mx = 0; this.my = 0;

        // Drag
        this._dragging = false;
        this._dragOff = new Map();    // chipId -> {dx, dy}
        this._panning = false;
        this._panStart = {x:0,y:0};
        this._panCamStart = {x:0,y:0};

        // Rettangolo selezione
        this.selRect = null;
        this._selRectStart = null;

        // Pulsante momentaneo
        this._pulsanteAttivo = null;

        // Undo
        this._undoStack = [];
        this._redoStack = [];

        this._bindEventi();
    }

    _bindEventi() {
        const cv = this._cv;
        cv.addEventListener('mousedown',   e => this._onDown(e));
        cv.addEventListener('mousemove',   e => this._onMove(e));
        cv.addEventListener('mouseup',     e => this._onUp(e));
        cv.addEventListener('mouseleave',  e => this._onLeave(e));
        cv.addEventListener('wheel',       e => this._onWheel(e), {passive:false});
        cv.addEventListener('contextmenu', e => e.preventDefault());
        cv.addEventListener('dblclick',    e => this._onDblClick(e));
        document.addEventListener('keydown', e => this._onKey(e));
    }

    // ---- Hit test ----
    _hitChip(mx,my) {
        // Cerca dall'ultimo aggiunto (render sopra)
        const arr = [...this._sim.chips.values()].reverse();
        return arr.find(c => c.contiene(mx,my)) || null;
    }

    _hitPin(mx,my, raggio=10) {
        let best=null, bestD=raggio;
        for(const c of this._sim.chips.values()){
            for(const p of c.tutti()){
                const pos = c.pinMondo(p);
                const d = distanza(mx,my, pos.x, pos.y);
                if(d<bestD){ bestD=d; best=p; }
            }
        }
        return best;
    }

    _hitFilo(mx,my, raggio=8) {
        let best=null, bestD=raggio;
        for(const f of this._sim.fili.values()){
            const ps = this._sim.pin(f.srcId), pd = this._sim.pin(f.dstId);
            if(!ps||!pd) continue;
            const cs = this._sim.chipDaPin(f.srcId), cd = this._sim.chipDaPin(f.dstId);
            if(!cs||!cd) continue;
            const x1=cs.x+ps.offX, y1=cs.y+ps.offY;
            const x2=cd.x+pd.offX, y2=cd.y+pd.offY;
            // Test approssimativo: distanza dal punto medio del bezier
            const mx2=(x1+x2)/2, my2=(y1+y2)/2;
            const d = distanza(mx,my, mx2,my2);
            // Test anche ai quarti
            const qx1=(x1+mx2)/2, qy1=(y1+my2)/2;
            const qx2=(mx2+x2)/2, qy2=(my2+y2)/2;
            const d1 = distanza(mx,my, qx1,qy1);
            const d2 = distanza(mx,my, qx2,qy2);
            const dMin = Math.min(d,d1,d2,
                distanza(mx,my,x1,y1), distanza(mx,my,x2,y2));
            // Campionamento lungo la curva per hit test più preciso
            let minSample = dMin;
            for(let t=0;t<=1;t+=0.05){
                const tt=1-t;
                const bx = tt*tt*tt*x1 + 3*tt*tt*t*(x1+Math.max(Math.abs(x2-x1)*0.4,30))
                         + 3*tt*t*t*(x2-Math.max(Math.abs(x2-x1)*0.4,30)) + t*t*t*x2;
                const by = tt*tt*tt*y1 + 3*tt*tt*t*y1 + 3*tt*t*t*y2 + t*t*t*y2;
                const ds = distanza(mx,my, bx,by);
                if(ds<minSample) minSample=ds;
            }
            if(minSample<bestD){ bestD=minSample; best=f; }
        }
        return best;
    }

    // ---- Mouse ----
    _mouseWorld(e) {
        const rect = this._cv.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        return this._ren.s2w(sx, sy);
    }

    _onDown(e) {
        const w = this._mouseWorld(e);
        this.mx=w.x; this.my=w.y;

        // Tasto centrale: pan
        if(e.button===1 || (e.button===0 && e.altKey)) {
            this._panning=true;
            this._panStart={x:e.clientX, y:e.clientY};
            this._panCamStart={x:this._ren.camX, y:this._ren.camY};
            this._cv.style.cursor='grabbing';
            return;
        }

        // Tasto destro: annulla azione / elimina
        if(e.button===2){
            if(this.filoStart){ this.filoStart=null; return; }
            if(this.tipoPlace){ this.tipoPlace=null; this.modo='select'; this._aggiornaBtnChip(); return; }
            // Prova a selezionare e cancellare
            const pin = this._hitPin(w.x,w.y);
            const chip = this._hitChip(w.x,w.y);
            const filo = this._hitFilo(w.x,w.y);
            if(filo){
                this._salvaUndo();
                this._sim.delFilo(filo.id);
            } else if(chip){
                this._salvaUndo();
                this._sim.del(chip.id);
                this.selChips.delete(chip.id);
            }
            return;
        }

        // Tasto sinistro
        if(e.button===0) {
            // Modo piazzamento
            if(this.modo==='place' && this.tipoPlace) {
                this._salvaUndo();
                const nx = snap(w.x-50, 20);
                const ny = snap(w.y-25, 20);
                const chip = new Chip(this.tipoPlace, nx, ny);
                this._sim.add(chip);
                return;
            }

            // Prova hit su pin → inizio filo
            const pin = this._hitPin(w.x, w.y);
            if(pin) {
                if(this.filoStart) {
                    // Completa filo
                    let src=this.filoStart, dst=pin;
                    // Garantisci: src=uscita, dst=ingresso
                    if(src.tipo==='ingresso' && dst.tipo==='uscita') [src,dst]=[dst,src];
                    if(src.tipo==='uscita' && dst.tipo==='ingresso' && src.chipId!==dst.chipId) {
                        this._salvaUndo();
                        this._sim.addFilo(new Filo(src.id, dst.id));
                    }
                    this.filoStart=null;
                } else {
                    this.filoStart=pin;
                }
                return;
            }

            // Annulla filo se click nel vuoto
            if(this.filoStart){ this.filoStart=null; return; }

            // Hit su chip → seleziona / trascina
            const chip = this._hitChip(w.x, w.y);
            if(chip) {
                // Pulsante momentaneo: attiva su mousedown
                if(chip.tipo==='PULSANTE'){
                    chip.stato = 1;
                    if(chip.pinU.length) chip.pinU[0].stato = 1;
                    this._pulsanteAttivo = chip;
                    this._propagaFili();
                    return;
                }
                // Toggle selezione con Ctrl
                if(e.ctrlKey) {
                    if(this.selChips.has(chip.id)) this.selChips.delete(chip.id);
                    else this.selChips.add(chip.id);
                } else {
                    if(!this.selChips.has(chip.id)){
                        this.selChips.clear(); this.selFili.clear();
                        this.selChips.add(chip.id);
                    }
                }
                // Prepara drag
                this._dragging=true;
                this._dragOff.clear();
                for(const cid of this.selChips){
                    const cc = this._sim.chips.get(cid);
                    if(cc) this._dragOff.set(cid, {dx:w.x-cc.x, dy:w.y-cc.y});
                }
                return;
            }

            // Hit su filo → seleziona
            const filo = this._hitFilo(w.x,w.y);
            if(filo) {
                if(!e.ctrlKey){ this.selChips.clear(); this.selFili.clear(); }
                this.selFili.add(filo.id);
                return;
            }

            // Click nel vuoto → inizio rettangolo selezione
            if(!e.ctrlKey){ this.selChips.clear(); this.selFili.clear(); }
            this._selRectStart = {x:w.x, y:w.y};
        }
    }

    _onMove(e) {
        const w = this._mouseWorld(e);
        this.mx=w.x; this.my=w.y;

        // Pan
        if(this._panning){
            const dx = (e.clientX-this._panStart.x)/this._ren.zoom;
            const dy = (e.clientY-this._panStart.y)/this._ren.zoom;
            this._ren.camX = this._panCamStart.x - dx;
            this._ren.camY = this._panCamStart.y - dy;
            return;
        }

        // Drag chip
        if(this._dragging) {
            for(const cid of this.selChips){
                const cc = this._sim.chips.get(cid);
                const off = this._dragOff.get(cid);
                if(cc && off){
                    cc.x = snap(w.x - off.dx, 20);
                    cc.y = snap(w.y - off.dy, 20);
                }
            }
            return;
        }

        // Rettangolo selezione
        if(this._selRectStart){
            const sx=this._selRectStart.x, sy=this._selRectStart.y;
            this.selRect = {
                x: Math.min(sx, w.x), y: Math.min(sy, w.y),
                w: Math.abs(w.x-sx),  h: Math.abs(w.y-sy)
            };
            return;
        }

        // Hover su pin
        const pin = this._hitPin(w.x, w.y);
        this._ren.hoverPin = pin ? pin.id : null;
        this._cv.style.cursor = pin ? 'pointer' :
                                 (this.modo==='place' ? 'copy' : 'default');
    }

    _onUp(e) {
        // Rilascia pulsante momentaneo
        if(this._pulsanteAttivo) {
            this._pulsanteAttivo.stato = 0;
            if(this._pulsanteAttivo.pinU.length) this._pulsanteAttivo.pinU[0].stato = 0;
            this._pulsanteAttivo = null;
            this._propagaFili();
        }
        if(this._panning){ this._panning=false; this._cv.style.cursor='default'; return; }

        if(this._dragging){
            this._dragging=false;
            // Salva undo dopo il drag (lo stato pre-drag era salvato al mousedown)
        }

        // Completa rettangolo selezione
        if(this.selRect){
            const r=this.selRect;
            for(const c of this._sim.chips.values()){
                if(c.x+c.w > r.x && c.x < r.x+r.w && c.y+c.h > r.y && c.y < r.y+r.h)
                    this.selChips.add(c.id);
            }
            this.selRect=null;
            this._selRectStart=null;
        }
    }

    _onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this._ren.zoom = Math.max(0.1, Math.min(5, this._ren.zoom * delta));
    }

    _onLeave(e) {
        // Rilascia pulsante momentaneo se il mouse esce dal canvas
        if(this._pulsanteAttivo) {
            this._pulsanteAttivo.stato = 0;
            if(this._pulsanteAttivo.pinU.length) this._pulsanteAttivo.pinU[0].stato = 0;
            this._pulsanteAttivo = null;
            this._propagaFili();
        }
    }

    // Forza un passo di simulazione immediato (inclusa logica chip)
    _propagaFili() {
        const wasActive = this._sim.attivo;
        this._sim.attivo = true;
        this._sim.tick();
        this._sim.attivo = wasActive;
    }

    _onDblClick(e) {
        const w = this._mouseWorld(e);
        const chip = this._hitChip(w.x, w.y);
        if(chip) {
            if(chip.tipo==='INGRESSO'){
                chip.stato = 1 - chip.stato;
                this._propagaFili();
            } else if(chip.tipo==='CLOCK'){
                chip.stato = 1 - chip.stato;
            } else if(chip.tipo==='FLIPFLOP_D' || chip.tipo==='CONTATORE_4BIT' ||
                       chip.tipo==='DECODER_BCD7' || this._sim.customDefs.has(chip.tipo)) {
                apriVistaInterna(chip, this._sim);
            }
        }
    }

    _onKey(e) {
        // Non intercettare quando si è in un input
        if(e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;

        if(e.key==='Delete' || e.key==='Backspace'){
            if(this.selChips.size || this.selFili.size){
                this._salvaUndo();
                for(const id of this.selFili) this._sim.delFilo(id);
                for(const id of this.selChips) this._sim.del(id);
                this.selChips.clear(); this.selFili.clear();
            }
        }
        if(e.key==='Escape'){
            this.filoStart=null;
            this.tipoPlace=null;
            this.modo='select';
            this.selChips.clear(); this.selFili.clear();
            this._aggiornaBtnChip();
        }
        if(e.key===' '){
            e.preventDefault();
            this._sim.attivo = !this._sim.attivo;
            aggiornaUI();
        }
        if(e.ctrlKey && e.key==='z'){ e.preventDefault(); this._undo(); }
        if(e.ctrlKey && e.key==='y'){ e.preventDefault(); this._redo(); }
        if(e.ctrlKey && e.key==='s'){ e.preventDefault(); salvaProgetto(); }
        if(e.ctrlKey && e.key==='a'){
            e.preventDefault();
            for(const c of this._sim.chips.values()) this.selChips.add(c.id);
        }
    }

    // ---- Undo/Redo ----
    _salvaUndo() {
        this._undoStack.push(JSON.stringify(this._sim.serializza()));
        if(this._undoStack.length > 50) this._undoStack.shift();
        this._redoStack = [];
    }

    _undo() {
        if(!this._undoStack.length) return;
        this._redoStack.push(JSON.stringify(this._sim.serializza()));
        const data = JSON.parse(this._undoStack.pop());
        this._sim.deserializza(data);
        this.selChips.clear(); this.selFili.clear();
    }

    _redo() {
        if(!this._redoStack.length) return;
        this._undoStack.push(JSON.stringify(this._sim.serializza()));
        const data = JSON.parse(this._redoStack.pop());
        this._sim.deserializza(data);
        this.selChips.clear(); this.selFili.clear();
    }

    _aggiornaBtnChip() {
        document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('selezionato'));
    }
}

// ======================== APP (Entry Point) ========================

let sim, ren, ed, loopId;
let simInterval = null;
let simVelocita = 200;

function init() {
    const canvas = document.getElementById('canvas');

    sim = new Simulatore();
    ren = new Renderer(canvas);
    ed  = new Editor(canvas, sim, ren);

    // Resize
    window.addEventListener('resize', () => { ren.resize(); });

    // Categorie sidebar
    document.querySelectorAll('.cat-titolo').forEach(el => {
        el.addEventListener('click', () => {
            el.classList.toggle('aperta');
            const cont = el.nextElementSibling;
            cont.classList.toggle('visibile');
            el.textContent = el.classList.contains('aperta')
                ? '▾ '+el.textContent.slice(2)
                : '▸ '+el.textContent.slice(2);
        });
        // Apri di default
        el.click();
    });

    // Bottoni chip
    document.querySelectorAll('.btn-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const tipo = btn.dataset.tipo;
            document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('selezionato'));
            if(ed.tipoPlace===tipo){
                ed.tipoPlace=null; ed.modo='select';
            } else {
                ed.tipoPlace=tipo; ed.modo='place';
                btn.classList.add('selezionato');
                ed.filoStart=null;
            }
        });
    });

    // Bottoni toolbar
    document.getElementById('btn-play').addEventListener('click', () => {
        sim.attivo = !sim.attivo; aggiornaUI();
    });
    document.getElementById('btn-passo').addEventListener('click', () => {
        sim.attivo=false; sim.tick(); aggiornaUI();
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
        sim.reset(); aggiornaUI();
    });
    document.getElementById('btn-annulla').addEventListener('click', () => ed._undo());
    document.getElementById('btn-ripristina').addEventListener('click', () => ed._redo());

    // Velocità
    const sliderVel = document.getElementById('velocita-sim');
    const labelVel  = document.getElementById('velocita-valore');
    sliderVel.addEventListener('input', () => {
        simVelocita = parseInt(sliderVel.value);
        labelVel.textContent = simVelocita+' Hz';
        avviaSimLoop();
    });

    // Periodo clock
    const sliderClk = document.getElementById('clock-periodo');
    const labelClk  = document.getElementById('clock-valore');
    sliderClk.addEventListener('input', () => {
        sim.clkPer = parseInt(sliderClk.value);
        labelClk.textContent = sim.clkPer;
    });

    // Salva/Carica
    document.getElementById('btn-salva').addEventListener('click', salvaProgetto);
    document.getElementById('btn-carica').addEventListener('click', mostraModaleCarica);
    document.getElementById('btn-chiudi-modale').addEventListener('click', () => {
        document.getElementById('modale-carica').classList.add('nascosta');
    });

    // Chiudi modale vista interna
    document.getElementById('btn-chiudi-interno').addEventListener('click', () => {
        document.getElementById('modale-interno').classList.add('nascosta');
    });
    document.getElementById('modale-interno').addEventListener('click', (e) => {
        if(e.target.id === 'modale-interno')
            document.getElementById('modale-interno').classList.add('nascosta');
    });

    // Esporta chip
    document.getElementById('btn-esporta-chip').addEventListener('click', () => {
        document.getElementById('modale-esporta').classList.remove('nascosta');
    });
    document.getElementById('btn-annulla-esporta').addEventListener('click', () => {
        document.getElementById('modale-esporta').classList.add('nascosta');
    });
    document.getElementById('btn-conferma-esporta').addEventListener('click', esportaChip);

    // Modifica chip personalizzato
    document.getElementById('btn-salva-chip-edit').addEventListener('click', salvaModificaChip);
    document.getElementById('btn-annulla-chip-edit').addEventListener('click', annullaModificaChip);

    // Loop rendering
    function renderLoop() {
        ren.disegna(sim, ed);
        aggiornaStatoUI();
        requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);

    // Loop simulazione
    avviaSimLoop();

    // Carica chip personalizzati
    caricaChipPersonalizzati();
}

function avviaSimLoop() {
    if(simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => { sim.tick(); }, 1000/simVelocita);
}

function aggiornaUI() {
    const btn = document.getElementById('btn-play');
    btn.textContent = sim.attivo ? '⏸' : '▶';
    btn.classList.toggle('btn-attivo', sim.attivo);
    document.getElementById('stato-sim').textContent =
        sim.attivo ? '▶ Simulazione attiva' : '⏸ In pausa';
    document.getElementById('stato-sim').style.color =
        sim.attivo ? '#00cc66' : '#ff8800';
}

function aggiornaStatoUI() {
    document.getElementById('stato-info').textContent =
        `Chip: ${sim.chips.size} | Fili: ${sim.fili.size} | Passo: ${sim.passo}`;
    document.getElementById('stato-zoom').textContent =
        `Zoom: ${Math.round(ren.zoom*100)}%`;
    document.getElementById('stato-cursore').textContent =
        `x: ${Math.round(ed.mx)}, y: ${Math.round(ed.my)}`;
}

// ======================== SALVATAGGIO / CARICAMENTO ========================

async function salvaProgetto() {
    const nome = document.getElementById('nome-progetto').value.trim() || 'Nuovo Progetto';
    const data = {
        nome: nome,
        circuito: sim.serializza()
    };
    try {
        const resp = await fetch('/api/progetti', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(data)
        });
        const result = await resp.json();
        if(result.successo){
            mostraNotifica('Progetto salvato con successo!', 'successo');
        } else {
            mostraNotifica('Errore nel salvataggio.', 'errore');
        }
    } catch(e) {
        mostraNotifica('Errore di connessione al server.', 'errore');
    }
}

async function mostraModaleCarica() {
    const modale = document.getElementById('modale-carica');
    const lista  = document.getElementById('lista-progetti');
    modale.classList.remove('nascosta');

    try {
        const resp = await fetch('/api/progetti');
        const progetti = await resp.json();

        if(!progetti.length){
            lista.innerHTML = '<p class="placeholder-text">Nessun progetto salvato.</p>';
            return;
        }

        lista.innerHTML = '';
        progetti.forEach(p => {
            const div = document.createElement('div');
            div.className = 'progetto-item';
            div.innerHTML = `
                <div>
                    <div class="progetto-nome">${p.nome}</div>
                    <div class="progetto-dettagli">Chip: ${p.num_chip} | Fili: ${p.num_fili}</div>
                </div>
                <div class="progetto-azioni">
                    <button class="btn-elimina" title="Elimina">🗑</button>
                </div>`;
            div.addEventListener('click', (e) => {
                if(e.target.classList.contains('btn-elimina')){
                    eliminaProgetto(p.nome);
                    return;
                }
                caricaProgetto(p.nome);
            });
            lista.appendChild(div);
        });
    } catch(e) {
        lista.innerHTML = '<p class="placeholder-text">Errore nel caricamento della lista.</p>';
    }
}

async function caricaProgetto(nome) {
    try {
        const resp = await fetch(`/api/progetti/${encodeURIComponent(nome)}`);
        const data = await resp.json();
        if(data.errore){ mostraNotifica(data.errore, 'errore'); return; }

        document.getElementById('nome-progetto').value = data.nome || nome;
        sim.deserializza(data.circuito || {});
        ed.selChips.clear(); ed.selFili.clear();
        document.getElementById('modale-carica').classList.add('nascosta');
        mostraNotifica(`Progetto "${nome}" caricato!`, 'successo');
    } catch(e) {
        mostraNotifica('Errore nel caricamento.', 'errore');
    }
}

async function eliminaProgetto(nome) {
    if(!confirm(`Eliminare il progetto "${nome}"?`)) return;
    try {
        await fetch(`/api/progetti/${encodeURIComponent(nome)}`, {method:'DELETE'});
        mostraModaleCarica(); // Ricarica lista
    } catch(e) {
        mostraNotifica('Errore nell\'eliminazione.', 'errore');
    }
}

// ======================== MODIFICA CHIP PERSONALIZZATI ========================

let _editMode = false;
let _editChipTipo = null;      // tipoKey del chip in modifica
let _editChipDef = null;       // definizione originale del chip
let _editPrevCircuito = null;  // circuito del progetto salvato prima di entrare in modifica
let _editPrevNome = '';        // nome del progetto salvato

function entraNellaModificaChip(tipoKey) {
    const cd = sim.customDefs.get(tipoKey);
    if(!cd || !cd.circuito) {
        mostraNotifica('Circuito interno non trovato.', 'errore');
        return;
    }

    // Salva stato attuale del progetto
    _editPrevCircuito = sim.serializza();
    _editPrevNome = document.getElementById('nome-progetto').value;

    // Carica il circuito del chip nel canvas principale
    sim.deserializza(cd.circuito);
    sim.attivo = false;
    aggiornaUI();

    // Attiva modalità modifica
    _editMode = true;
    _editChipTipo = tipoKey;
    _editChipDef = cd;

    // Mostra banner e nasconde/modifica UI
    document.getElementById('banner-modifica-chip').classList.remove('nascosta');
    document.getElementById('nome-chip-editing').textContent = cd.nome || tipoKey;
    document.getElementById('nome-progetto').value = '✏️ ' + (cd.nome || tipoKey);
    document.getElementById('nome-progetto').disabled = true;

    // Chiudi modale interna
    document.getElementById('modale-interno').classList.add('nascosta');

    mostraNotifica(`Modifica il chip "${cd.nome}". Quando hai finito, premi "Salva Chip".`, 'info');
}

async function salvaModificaChip() {
    if(!_editMode || !_editChipDef) return;

    // Raccogli il nuovo circuito
    const nuovoCircuito = sim.serializza();

    // Trova ingressi e uscite
    const ingressi = [], uscite = [];
    for(const c of sim.chips.values()){
        if(c.tipo==='INGRESSO') ingressi.push(c.pinU[0]?.etichetta || 'IN');
        if(c.tipo==='USCITA')   uscite.push(c.pinI[0]?.etichetta || 'OUT');
    }

    // Aggiorna definizione
    const chipDef = {
        nome: _editChipDef.nome,
        colore: _editChipDef.colore,
        ingressi: ingressi,
        uscite: uscite,
        circuito: nuovoCircuito
    };

    try {
        const resp = await fetch('/api/chip-personalizzati', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(chipDef)
        });
        const result = await resp.json();
        if(result.successo){
            mostraNotifica(`Chip "${_editChipDef.nome}" salvato!`, 'successo');
            // Aggiorna la definizione in memoria
            _editChipDef.circuito = nuovoCircuito;
            _editChipDef.ingressi = ingressi;
            _editChipDef.uscite = uscite;
            sim.customDefs.set(_editChipTipo, _editChipDef);

            // Aggiorna DEFS
            DEFS[_editChipTipo].ing = ingressi;
            DEFS[_editChipTipo].usc = uscite;
        }
    } catch(e) {
        mostraNotifica('Errore nel salvataggio del chip.', 'errore');
        return;
    }

    // Ripristina il progetto precedente
    _esciDallaModifica();
}

function annullaModificaChip() {
    if(!_editMode) return;
    _esciDallaModifica();
    mostraNotifica('Modifica annullata.', 'info');
}

function _esciDallaModifica() {
    // Ripristina circuito precedente
    if(_editPrevCircuito) {
        sim.deserializza(_editPrevCircuito);
    }

    // Ripristina UI
    document.getElementById('banner-modifica-chip').classList.add('nascosta');
    document.getElementById('nome-progetto').value = _editPrevNome;
    document.getElementById('nome-progetto').disabled = false;

    // Reset stato modifica
    _editMode = false;
    _editChipTipo = null;
    _editChipDef = null;
    _editPrevCircuito = null;
    _editPrevNome = '';

    sim.attivo = false;
    aggiornaUI();
}

// ======================== CHIP PERSONALIZZATI ========================

async function esportaChip() {
    const nome   = document.getElementById('nome-chip-esporta').value.trim();
    const colore = document.getElementById('colore-chip-esporta').value;
    if(!nome){ mostraNotifica('Inserisci un nome per il chip.', 'errore'); return; }
    if(!sim.chips.size){ mostraNotifica('Il circuito è vuoto.', 'errore'); return; }

    // Trova gli input e output del circuito
    const ingressi = [], uscite = [];
    for(const c of sim.chips.values()){
        if(c.tipo==='INGRESSO') ingressi.push(c.pinU[0]?.etichetta || 'IN');
        if(c.tipo==='USCITA')   uscite.push(c.pinI[0]?.etichetta || 'OUT');
    }

    if(!ingressi.length && !uscite.length){
        mostraNotifica('Il circuito deve avere almeno un componente IN o OUT.', 'errore');
        return;
    }

    const chipDef = {
        nome: nome,
        colore: colore,
        ingressi: ingressi,
        uscite: uscite,
        circuito: sim.serializza()
    };

    try {
        const resp = await fetch('/api/chip-personalizzati', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(chipDef)
        });
        const result = await resp.json();
        if(result.successo){
            mostraNotifica(`Chip "${nome}" esportato!`, 'successo');
            document.getElementById('modale-esporta').classList.add('nascosta');
            caricaChipPersonalizzati();
        }
    } catch(e) {
        mostraNotifica('Errore nell\'esportazione.', 'errore');
    }
}

async function caricaChipPersonalizzati() {
    const cont = document.getElementById('cat-custom');
    try {
        const resp = await fetch('/api/chip-personalizzati');
        const chips = await resp.json();

        if(!chips.length){
            cont.innerHTML = '<p class="placeholder-text">Nessun chip personalizzato.<br>Usa "Esporta Chip" per crearne.</p>';
            return;
        }

        cont.innerHTML = '';
        chips.forEach(cd => {
            // Registra definizione per la simulazione
            const tipoKey = 'CUSTOM_'+cd.nome.toUpperCase().replace(/\s/g,'_');
            DEFS[tipoKey] = {
                nome: cd.nome,
                cat: 'custom',
                ing: cd.ingressi || [],
                usc: cd.uscite || [],
                col: cd.colore || '#7f8c8d',
                w: Math.max(90, 30 + Math.max((cd.ingressi||[]).length, (cd.uscite||[]).length)*15 + cd.nome.length*8),
                h: Math.max(50, 22 + Math.max((cd.ingressi||[]).length, (cd.uscite||[]).length)*20 + 10),
                fn: null  // Gestito dal simulatore customDefs
            };
            sim.customDefs.set(tipoKey, cd);

            const btn = document.createElement('button');
            btn.className = 'btn-chip';
            btn.dataset.tipo = tipoKey;
            btn.style.setProperty('--chip-col', cd.colore || '#7f8c8d');
            btn.textContent = cd.nome;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('selezionato'));
                if(ed.tipoPlace===tipoKey){
                    ed.tipoPlace=null; ed.modo='select';
                } else {
                    ed.tipoPlace=tipoKey; ed.modo='place';
                    btn.classList.add('selezionato');
                    ed.filoStart=null;
                }
            });
            cont.appendChild(btn);
        });
    } catch(e) {
        // Server non raggiungibile, ignora
        cont.innerHTML = '<p class="placeholder-text">Server non raggiungibile.</p>';
    }
}

// ======================== AVVIO ========================
document.addEventListener('DOMContentLoaded', init);
