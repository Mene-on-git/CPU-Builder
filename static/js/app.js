// ============================================================
//  CPU-Builder — Simulatore di Logica Digitale
//  Applicazione principale (engine + editor + UI)
// ============================================================

// ======================== UTILITÀ ========================

let _prossimoId = 1;
function generaId() { return _prossimoId++; }
function aggiornaContatorId(val) { _prossimoId = Math.max(_prossimoId, val + 1); }
function distanza(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
function snap(val, g) { return Math.round(val / g) * g; }

// Colori globali
const COL = {
    SFONDO:     '#12121f',
    GRIGLIA:    '#1e1e35',
    GRIGLIA2:   '#2a2a4a',
    FILO_HI:    '#00ff88',
    FILO_LO:    '#444455',
    PIN_HI:     '#ff4444',
    PIN_LO:     '#666677',
    PIN_HOVER:  '#ffffff',
    SEL:        '#ffdd44',
    ACCENTO:    '#5865f2',
    TESTO:      '#e0e0e0',
    TESTO2:     '#999'
};

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
    USCITA:     { nome:'OUT',   cat:'io', ing:['IN'], usc:[], col:'#e67e22', w:80, h:50, fn:null },
    CLOCK:      { nome:'CLK',   cat:'io', ing:[], usc:['CLK'], col:'#34495e', w:90, h:55,
                  interattivo:true, fn:null },
    COSTANTE_0: { nome:'0',     cat:'io', ing:[], usc:['OUT'], col:'#555555', w:60, h:45, fn:()=>[0] },
    COSTANTE_1: { nome:'1',     cat:'io', ing:[], usc:['OUT'], col:'#00aa55', w:60, h:45, fn:()=>[1] },
    DISPLAY7:   { nome:'7SEG',  cat:'display', ing:['A','B','C','D','E','F','G','DP'], usc:[], col:'#1a1a2e', w:120, h:160, fn:null },
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
                // Chip personalizzati
                if(this.customDefs.has(c.tipo)){
                    const cd = this.customDefs.get(c.tipo);
                    const r = this._valutaCustom(cd, c.pinI.map(p=>p.stato));
                    if(r) r.forEach((v,i) => {
                        if(i<c.pinU.length){ const nv=v?1:0; if(c.pinU[i].stato!==nv){ c.pinU[i].stato=nv; changed=true; }}
                    });
                }
            }
            if(!changed) break;
        }
    }

    _valutaCustom(def, ingressi) {
        // Crea una mini-simulazione interna per il chip personalizzato
        const miniSim = new Simulatore();
        miniSim.attivo = true;
        miniSim.clkStato = this.clkStato;
        miniSim.clkPer = this.clkPer;

        // Deserializza il circuito interno
        const circuito = JSON.parse(JSON.stringify(def.circuito));
        // Crea chip interni con nuovi ID mappati
        const idMap = new Map();
        const oldToNew = (oldId) => {
            if(!idMap.has(oldId)) idMap.set(oldId, generaId());
            return idMap.get(oldId);
        };

        circuito.chips.forEach(cd => {
            const newId = oldToNew(cd.id);
            const chip = new Chip(cd.tipo, cd.x, cd.y, newId);
            chip.stato = cd.stato || 0;
            // Mappa pin IDs
            cd.pinI.forEach((pd, i) => {
                if(i < chip.pinI.length) {
                    const newPinId = oldToNew(pd.id);
                    chip.pinI[i].id = newPinId;
                }
            });
            cd.pinU.forEach((pd, i) => {
                if(i < chip.pinU.length) {
                    const newPinId = oldToNew(pd.id);
                    chip.pinU[i].id = newPinId;
                }
            });
            miniSim.add(chip);
        });

        // Crea fili interni con ID mappati
        circuito.fili.forEach(fd => {
            const newSrc = oldToNew(fd.srcId);
            const newDst = oldToNew(fd.dstId);
            miniSim.addFilo(new Filo(newSrc, newDst, generaId()));
        });

        // Imposta ingressi: trova chip INGRESSO e assegna stati
        let idxIn = 0;
        for(const c of miniSim.chips.values()){
            if(c.tipo === 'INGRESSO' && idxIn < ingressi.length){
                c.stato = ingressi[idxIn++];
            }
        }

        // Simula
        for(let i=0; i<30; i++) miniSim.tick();

        // Leggi uscite: trova chip USCITA e raccogli stati
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
        }
    }

    serializza() {
        const chips=[], fili=[];
        for(const c of this.chips.values())
            chips.push({ id:c.id, tipo:c.tipo, x:c.x, y:c.y, stato:c.stato,
                pinI: c.pinI.map(p=>({id:p.id, et:p.etichetta})),
                pinU: c.pinU.map(p=>({id:p.id, et:p.etichetta})) });
        for(const f of this.fili.values())
            fili.push({ id:f.id, srcId:f.srcId, dstId:f.dstId });
        return { chips, fili };
    }

    deserializza(data) {
        this.chips.clear(); this.fili.clear(); _prossimoId=1;
        if(data.chips) data.chips.forEach(cd => {
            const ch = new Chip(cd.tipo, cd.x, cd.y, cd.id);
            ch.stato = cd.stato||0;
            if(cd.pinI) cd.pinI.forEach((pd,i)=>{ if(i<ch.pinI.length){ ch.pinI[i].id=pd.id; ch.pinI[i].etichetta=pd.et||ch.pinI[i].etichetta; }});
            if(cd.pinU) cd.pinU.forEach((pd,i)=>{ if(i<ch.pinU.length){ ch.pinU[i].id=pd.id; ch.pinU[i].etichetta=pd.et||ch.pinU[i].etichetta; }});
            this.add(ch);
        });
        if(data.fili) data.fili.forEach(fd => {
            this.addFilo(new Filo(fd.srcId, fd.dstId, fd.id));
        });
    }
}

// ======================== RENDERER ========================

class Renderer {
    constructor(canvas) {
        this.cv = canvas;
        this.ctx = canvas.getContext('2d');
        this.camX=0; this.camY=0; this.zoom=1;
        this.hoverPin = null;          // pin sotto il mouse
        this.resize();
    }

    resize() {
        const r = window.devicePixelRatio || 1;
        this.cv.width  = this.cv.clientWidth  * r;
        this.cv.height = this.cv.clientHeight * r;
        this.ctx.setTransform(r,0,0,r,0,0);
        this.W = this.cv.clientWidth;
        this.H = this.cv.clientHeight;
    }

    s2w(sx,sy) {
        return { x: (sx-this.W/2)/this.zoom+this.camX, y: (sy-this.H/2)/this.zoom+this.camY };
    }
    w2s(mx,my) {
        return { x: (mx-this.camX)*this.zoom+this.W/2, y: (my-this.camY)*this.zoom+this.H/2 };
    }

    disegna(sim, ed) {
        const ctx=this.ctx;
        ctx.clearRect(0,0,this.W,this.H);

        // Sfondo
        ctx.fillStyle=COL.SFONDO;
        ctx.fillRect(0,0,this.W,this.H);

        ctx.save();
        ctx.translate(this.W/2, this.H/2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.camX, -this.camY);

        this._griglia(ctx);

        // Fili
        for(const f of sim.fili.values()) this._filo(ctx, f, sim, ed);

        // Filo in costruzione
        if(ed.filoStart) this._filoTemp(ctx, ed);

        // Chip
        for(const c of sim.chips.values()) this._chip(ctx, c, sim, ed);

        // Rettangolo selezione
        if(ed.selRect) this._selRect(ctx, ed.selRect);

        ctx.restore();
    }

    _griglia(ctx) {
        const g1=20, g2=100;
        const tl = this.s2w(0,0);
        const br = this.s2w(this.W, this.H);
        const sx = Math.floor(tl.x/g1)*g1, sy = Math.floor(tl.y/g1)*g1;
        const ex = Math.ceil(br.x/g1)*g1,  ey = Math.ceil(br.y/g1)*g1;

        // Sotto-griglia
        if(this.zoom > 0.4){
            ctx.strokeStyle = COL.GRIGLIA;
            ctx.lineWidth = 0.5/this.zoom;
            ctx.beginPath();
            for(let x=sx;x<=ex;x+=g1){ if(x%g2===0) continue; ctx.moveTo(x,sy); ctx.lineTo(x,ey); }
            for(let y=sy;y<=ey;y+=g1){ if(y%g2===0) continue; ctx.moveTo(sx,y); ctx.lineTo(ex,y); }
            ctx.stroke();
        }

        // Griglia principale
        ctx.strokeStyle = COL.GRIGLIA2;
        ctx.lineWidth = 1/this.zoom;
        const sx2 = Math.floor(tl.x/g2)*g2, sy2 = Math.floor(tl.y/g2)*g2;
        ctx.beginPath();
        for(let x=sx2;x<=ex;x+=g2){ ctx.moveTo(x,sy); ctx.lineTo(x,ey); }
        for(let y=sy2;y<=ey;y+=g2){ ctx.moveTo(sx,y); ctx.lineTo(ex,y); }
        ctx.stroke();

        // Origine
        ctx.fillStyle = COL.ACCENTO;
        ctx.beginPath(); ctx.arc(0,0,3/this.zoom,0,Math.PI*2); ctx.fill();
    }

    _chip(ctx, c, sim, ed) {
        const sel = ed.selChips.has(c.id);

        // Ombra
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this._rrect(ctx, c.x+3, c.y+3, c.w, c.h, 6); ctx.fill();

        // Corpo
        ctx.fillStyle = c.colore;
        ctx.strokeStyle = sel ? COL.SEL : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = sel ? 2.5/this.zoom : 1/this.zoom;
        this._rrect(ctx, c.x, c.y, c.w, c.h, 6);
        ctx.fill(); ctx.stroke();

        // Nome
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(11,12/this.zoom)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.nome, c.x+c.w/2, c.y+12);

        // Decorazioni speciali
        this._chipExtra(ctx, c);

        // Pin
        c.pinI.forEach(p => this._pin(ctx, c, p));
        c.pinU.forEach(p => this._pin(ctx, c, p));
    }

    _chipExtra(ctx, c) {
        if(c.tipo==='INGRESSO') {
            // Indicatore stato switch
            const on = c.stato;
            ctx.fillStyle = on ? '#00ff88' : '#2a2a2a';
            this._rrect(ctx, c.x+8, c.y+c.h-20, c.w-16, 12, 4); ctx.fill();
            ctx.fillStyle = on ? '#000' : '#666';
            ctx.font = '9px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(on?'ON':'OFF', c.x+c.w/2, c.y+c.h-14);
        }
        if(c.tipo==='USCITA') {
            const on = c.pinI.length ? c.pinI[0].stato : 0;
            ctx.beginPath();
            ctx.arc(c.x+c.w/2, c.y+c.h-16, 9, 0, Math.PI*2);
            ctx.fillStyle = on ? '#ff4444' : '#2a2a2a';
            if(on){ ctx.shadowColor='#ff4444'; ctx.shadowBlur=15; }
            ctx.fill();
            ctx.shadowBlur=0;
            // Bordo LED
            ctx.strokeStyle = on ? '#ff8888' : '#444';
            ctx.lineWidth = 1.5/this.zoom; ctx.stroke();
        }
        if(c.tipo==='CLOCK') {
            const on = c.pinU.length ? c.pinU[0].stato : 0;
            ctx.strokeStyle = on ? '#00ff88' : '#555';
            ctx.lineWidth = 1.5/this.zoom;
            ctx.beginPath();
            const bx=c.x+12, by=c.y+c.h-14, w=c.w-24, h=8;
            ctx.moveTo(bx,by);
            for(let i=0;i<4;i++){
                const sw=w/8;
                ctx.lineTo(bx+sw*(i*2),   by-h);
                ctx.lineTo(bx+sw*(i*2+1), by-h);
                ctx.lineTo(bx+sw*(i*2+1), by);
                ctx.lineTo(bx+sw*(i*2+2), by);
            }
            ctx.stroke();
            // Indicatore attivo
            if(!c.stato){
                ctx.fillStyle='rgba(255,0,0,0.4)';
                ctx.font='8px sans-serif'; ctx.textAlign='center';
                ctx.fillText('OFF', c.x+c.w/2, c.y+c.h-4);
            }
        }
        if(c.tipo==='DISPLAY7') {
            this._display7seg(ctx, c);
        }
    }

    // ---- Display a 7 segmenti ----
    //
    //   Pin: A=seg superiore, B=seg alto-dx, C=seg basso-dx,
    //        D=seg inferiore, E=seg basso-sx, F=seg alto-sx,
    //        G=seg centrale, DP=punto decimale
    //
    //     AAAA
    //    F    B
    //    F    B
    //     GGGG
    //    E    C
    //    E    C
    //     DDDD  .DP
    //
    _display7seg(ctx, c) {
        const pA = c.pinI[0]?.stato || 0;
        const pB = c.pinI[1]?.stato || 0;
        const pC = c.pinI[2]?.stato || 0;
        const pD = c.pinI[3]?.stato || 0;
        const pE = c.pinI[4]?.stato || 0;
        const pF = c.pinI[5]?.stato || 0;
        const pG = c.pinI[6]?.stato || 0;
        const pDP= c.pinI[7]?.stato || 0;

        // Area display interna
        const pad = 10;
        const dx = c.x + pad;
        const dy = c.y + 22;
        const dw = c.w - pad*2;
        const dh = c.h - 32;

        // Sfondo display (nero)
        ctx.fillStyle = '#0a0a0a';
        this._rrect(ctx, dx, dy, dw, dh, 4);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1/this.zoom;
        ctx.stroke();

        // Geometria segmenti
        const mx = dx + dw/2;           // centro X
        const my = dy + dh/2;           // centro Y
        const segL = dw * 0.55;         // lunghezza segmento
        const segW = dw * 0.12;         // spessore segmento
        const hGap = dh * 0.42;         // metà altezza verticale
        const colOn  = '#ff1a1a';
        const colOff = '#1a0a0a';
        const glowOn = '#ff4444';

        const segs = [
            // [acceso, cx, cy, orizzontale]
            { on:pA, cx:mx, cy:my-hGap,     horiz:true  },  // A - superiore
            { on:pB, cx:mx+segL/2, cy:my-hGap/2, horiz:false }, // B - alto dx
            { on:pC, cx:mx+segL/2, cy:my+hGap/2, horiz:false }, // C - basso dx
            { on:pD, cx:mx, cy:my+hGap,     horiz:true  },  // D - inferiore
            { on:pE, cx:mx-segL/2, cy:my+hGap/2, horiz:false }, // E - basso sx
            { on:pF, cx:mx-segL/2, cy:my-hGap/2, horiz:false }, // F - alto sx
            { on:pG, cx:mx, cy:my,           horiz:true  },  // G - centro
        ];

        segs.forEach(s => {
            ctx.save();
            if(s.on) { ctx.shadowColor=glowOn; ctx.shadowBlur=8; }
            ctx.fillStyle = s.on ? colOn : colOff;
            ctx.beginPath();
            if(s.horiz) {
                // Segmento orizzontale (esagono allungato)
                const hw = segL/2, hh = segW/2;
                ctx.moveTo(s.cx-hw+hh, s.cy-hh);
                ctx.lineTo(s.cx+hw-hh, s.cy-hh);
                ctx.lineTo(s.cx+hw,    s.cy);
                ctx.lineTo(s.cx+hw-hh, s.cy+hh);
                ctx.lineTo(s.cx-hw+hh, s.cy+hh);
                ctx.lineTo(s.cx-hw,    s.cy);
            } else {
                // Segmento verticale (esagono allungato ruotato)
                const hw = segW/2, hh = hGap/2-segW*0.3;
                ctx.moveTo(s.cx,    s.cy-hh);
                ctx.lineTo(s.cx+hw, s.cy-hh+hw);
                ctx.lineTo(s.cx+hw, s.cy+hh-hw);
                ctx.lineTo(s.cx,    s.cy+hh);
                ctx.lineTo(s.cx-hw, s.cy+hh-hw);
                ctx.lineTo(s.cx-hw, s.cy-hh+hw);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });

        // Punto decimale (DP)
        ctx.save();
        if(pDP) { ctx.shadowColor=glowOn; ctx.shadowBlur=8; }
        ctx.fillStyle = pDP ? colOn : colOff;
        ctx.beginPath();
        ctx.arc(mx + segL/2 + segW, my + hGap, segW*0.6, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    _pin(ctx, chip, pin) {
        const px = chip.x+pin.offX, py = chip.y+pin.offY;
        const r = 5, hov = this.hoverPin===pin.id;

        // Linea connessione al bordo
        ctx.strokeStyle = pin.stato ? COL.FILO_HI : COL.FILO_LO;
        ctx.lineWidth = 1.5/this.zoom;
        ctx.beginPath();
        if(pin.tipo==='ingresso'){
            ctx.moveTo(px-8, py); ctx.lineTo(px, py);
        } else {
            ctx.moveTo(px, py); ctx.lineTo(px+8, py);
        }
        ctx.stroke();

        // Cerchio
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
        ctx.fillStyle = hov ? COL.PIN_HOVER : (pin.stato ? COL.PIN_HI : COL.PIN_LO);
        ctx.fill();
        ctx.strokeStyle = hov ? COL.ACCENTO : '#000';
        ctx.lineWidth = hov ? 2/this.zoom : 1/this.zoom;
        ctx.stroke();

        // Etichetta
        if(this.zoom > 0.5){
            ctx.fillStyle = COL.TESTO2;
            ctx.font = `${9}px sans-serif`;
            if(pin.tipo==='ingresso'){
                ctx.textAlign='left'; ctx.fillText(pin.etichetta, px+8, py+3);
            } else {
                ctx.textAlign='right'; ctx.fillText(pin.etichetta, px-8, py+3);
            }
        }
    }

    _filo(ctx, filo, sim, ed) {
        const ps = sim.pin(filo.srcId), pd = sim.pin(filo.dstId);
        if(!ps||!pd) return;
        const cs = sim.chipDaPin(filo.srcId), cd = sim.chipDaPin(filo.dstId);
        if(!cs||!cd) return;

        const x1=cs.x+ps.offX, y1=cs.y+ps.offY;
        const x2=cd.x+pd.offX, y2=cd.y+pd.offY;
        const on = ps.stato;

        const sel = ed.selFili.has(filo.id);

        ctx.strokeStyle = sel ? COL.SEL : (on ? COL.FILO_HI : COL.FILO_LO);
        ctx.lineWidth = (on ? 2.5 : 2) / this.zoom;
        ctx.lineCap = 'round';

        ctx.beginPath(); ctx.moveTo(x1, y1);
        const dx = Math.max(Math.abs(x2-x1)*0.4, 30);
        ctx.bezierCurveTo(x1+dx, y1, x2-dx, y2, x2, y2);
        ctx.stroke();

        // Pallino su pin sorgente quando il filo è attivo
        if(on){
            ctx.beginPath(); ctx.arc(x1,y1,3,0,Math.PI*2);
            ctx.fillStyle=COL.FILO_HI; ctx.fill();
            ctx.beginPath(); ctx.arc(x2,y2,3,0,Math.PI*2);
            ctx.fill();
        }
    }

    _filoTemp(ctx, ed) {
        const chip = ed._sim.chipDaPin(ed.filoStart.id);
        if(!chip) return;
        const px = chip.x+ed.filoStart.offX, py = chip.y+ed.filoStart.offY;

        ctx.strokeStyle = COL.ACCENTO;
        ctx.lineWidth = 2/this.zoom;
        ctx.setLineDash([6/this.zoom, 4/this.zoom]);
        ctx.beginPath(); ctx.moveTo(px, py);
        const dx = Math.max(Math.abs(ed.mx-px)*0.4, 30);
        ctx.bezierCurveTo(px+dx, py, ed.mx-dx, ed.my, ed.mx, ed.my);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    _selRect(ctx, r) {
        ctx.strokeStyle = COL.SEL;
        ctx.lineWidth = 1/this.zoom;
        ctx.setLineDash([5/this.zoom, 3/this.zoom]);
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = 'rgba(255,221,68,0.06)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.setLineDash([]);
    }

    _rrect(ctx, x,y,w,h,r) {
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.lineTo(x+w-r,y);   ctx.quadraticCurveTo(x+w,y,   x+w,y+r);
        ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h, x+w-r,y+h);
        ctx.lineTo(x+r,y+h);   ctx.quadraticCurveTo(x,y+h,   x,y+h-r);
        ctx.lineTo(x,y+r);     ctx.quadraticCurveTo(x,y,      x+r,y);
        ctx.closePath();
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

    _onDblClick(e) {
        const w = this._mouseWorld(e);
        const chip = this._hitChip(w.x, w.y);
        if(chip) {
            if(chip.tipo==='INGRESSO'){
                chip.stato = 1 - chip.stato;
            } else if(chip.tipo==='CLOCK'){
                chip.stato = 1 - chip.stato;
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

    // Esporta chip
    document.getElementById('btn-esporta-chip').addEventListener('click', () => {
        document.getElementById('modale-esporta').classList.remove('nascosta');
    });
    document.getElementById('btn-annulla-esporta').addEventListener('click', () => {
        document.getElementById('modale-esporta').classList.add('nascosta');
    });
    document.getElementById('btn-conferma-esporta').addEventListener('click', esportaChip);

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

// ======================== NOTIFICHE ========================

function mostraNotifica(msg, tipo='info') {
    // Rimuovi notifica precedente
    const vecchia = document.querySelector('.notifica');
    if(vecchia) vecchia.remove();

    const div = document.createElement('div');
    div.className = 'notifica';
    div.style.cssText = `
        position: fixed; top: 54px; right: 16px; z-index: 2000;
        background: ${tipo==='errore'?'#c0392b':tipo==='successo'?'#27ae60':'#2980b9'};
        color: #fff; padding: 10px 18px; border-radius: 8px;
        font-size: 13px; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        animation: slideIn 0.3s ease;
        cursor: pointer;
    `;
    div.textContent = msg;
    div.addEventListener('click', () => div.remove());
    document.body.appendChild(div);

    setTimeout(() => { if(div.parentNode) div.remove(); }, 3000);
}

// Stile animazione notifica
const styleNotifica = document.createElement('style');
styleNotifica.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(styleNotifica);

// ======================== AVVIO ========================
document.addEventListener('DOMContentLoaded', init);
