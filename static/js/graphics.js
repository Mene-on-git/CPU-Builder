// ============================================================
//  CPU-Builder — Simulatore di Logica Digitale
//  Rendering, costanti grafiche e schemi interni
// ============================================================

// ======================== COLORI GLOBALI ========================

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

// ======================== SCHEMI INTERNI CHIP NATIVI ========================

const SCHEMI_INTERNI = {
    NAND: {
        titolo: 'NAND — Vista Interna (livello transistor)',
        desc: 'La NAND e\' la porta logica atomica di questo simulatore: tutte le altre porte e chip logici sono costruiti a partire da lei. '
            + 'A livello di transistor (tecnologia CMOS) si realizza con 4 transistor: due PMOS in parallelo verso VDD (si accendono quando l\'ingresso e\' 0) '
            + 'e due NMOS in serie verso massa (conducono solo quando entrambi gli ingressi sono 1). '
            + 'Quindi Q = 0 solo se A=1 e B=1, altrimenti Q = 1.',
        nodi: [
            { id:'in_a',  tipo:'IN',   nome:'A',   x:40,  y:150 },
            { id:'in_b',  tipo:'IN',   nome:'B',   x:40,  y:260 },
            { id:'vdd',   tipo:'VDD',  nome:'VDD', x:240, y:20,  w:120, h:30 },
            { id:'p1',    tipo:'PMOS', nome:'PMOS₁', x:200, y:90 },
            { id:'p2',    tipo:'PMOS', nome:'PMOS₂', x:330, y:90 },
            { id:'n1',    tipo:'NMOS', nome:'NMOS₁', x:265, y:230 },
            { id:'n2',    tipo:'NMOS', nome:'NMOS₂', x:265, y:330 },
            { id:'gnd',   tipo:'GND',  nome:'GND', x:240, y:430, w:120, h:30 },
            { id:'out_q', tipo:'OUT',  nome:'Q',   x:520, y:180 },
        ],
        conn: [
            ['vdd','p1'],['vdd','p2'],
            ['p1','out_q'],['p2','out_q'],
            ['out_q','n1'],['n1','n2'],['n2','gnd'],
            ['in_a','p1'],['in_a','n1'],
            ['in_b','p2'],['in_b','n2'],
        ],
        legenda: [
            { col:'#e67e22', txt:'PMOS (conduce con ingresso 0)' },
            { col:'#3498db', txt:'NMOS (conduce con ingresso 1)' },
            { col:'#c0392b', txt:'VDD / GND' },
        ],
    },
    FLIPFLOP_D: {
        titolo: 'Flip-Flop D — Vista Interna',
        desc: 'Flip-flop D edge-triggered con reset sincrono. Cattura il valore di D sul fronte di salita di CLK. Se RST=1, Q viene forzato a 0.',
        nodi: [
            { id:'in_d',   tipo:'IN',   nome:'D',   x:40,  y:80 },
            { id:'in_clk', tipo:'IN',   nome:'CLK', x:40,  y:190 },
            { id:'in_rst', tipo:'IN',   nome:'RST', x:40,  y:300 },
            { id:'nand1',  tipo:'NAND', nome:'NAND₁', x:200, y:60 },
            { id:'nand2',  tipo:'NAND', nome:'NAND₂', x:200, y:160 },
            { id:'nand3',  tipo:'NAND', nome:'NAND₃', x:380, y:80 },
            { id:'nand4',  tipo:'NAND', nome:'NAND₄', x:380, y:200 },
            { id:'not1',   tipo:'NOT',  nome:'NOT',   x:120, y:140 },
            { id:'and_r',  tipo:'AND',  nome:'AND',   x:120, y:260 },
            { id:'out_q',  tipo:'OUT',  nome:'Q',     x:530, y:80 },
            { id:'out_qn', tipo:'OUT',  nome:'Q̄',    x:530, y:200 },
        ],
        conn: [
            ['in_d','nand1'],['in_clk','nand1'],['in_clk','not1'],
            ['not1','nand2'],['in_d','nand2'],
            ['nand1','nand3'],['nand4','nand3'],
            ['nand2','nand4'],['nand3','nand4'],
            ['nand3','out_q'],['nand4','out_qn'],
            ['in_rst','and_r'],['and_r','nand4'],
        ],
        legenda: [
            { col:'#c0392b', txt:'NAND' },
            { col:'#8e44ad', txt:'NOT' },
            { col:'#16a085', txt:'Ingresso' },
            { col:'#e67e22', txt:'Uscita' },
        ],
    },
    CONTATORE_4BIT: {
        titolo: 'Contatore 4 Bit — Vista Interna',
        desc: 'Contatore binario 4 bit (0-15). Incrementa sul fronte di salita di CLK. RST=1 azzera il contatore. Le uscite Q0-Q3 rappresentano i bit dal meno al più significativo.',
        nodi: [
            { id:'in_clk', tipo:'IN',   nome:'CLK',   x:40,  y:120 },
            { id:'in_rst', tipo:'IN',   nome:'RST',   x:40,  y:300 },
            { id:'ff0',    tipo:'DFF',  nome:'D-FF₀', x:180, y:60 },
            { id:'ff1',    tipo:'DFF',  nome:'D-FF₁', x:180, y:150 },
            { id:'ff2',    tipo:'DFF',  nome:'D-FF₂', x:180, y:240 },
            { id:'ff3',    tipo:'DFF',  nome:'D-FF₃', x:180, y:330 },
            { id:'not0',   tipo:'NOT',  nome:'¬Q₀',   x:320, y:60 },
            { id:'not1',   tipo:'NOT',  nome:'¬Q₁',   x:320, y:150 },
            { id:'not2',   tipo:'NOT',  nome:'¬Q₂',   x:320, y:240 },
            { id:'not3',   tipo:'NOT',  nome:'¬Q₃',   x:320, y:330 },
            { id:'out0',   tipo:'OUT',  nome:'Q0',     x:460, y:60 },
            { id:'out1',   tipo:'OUT',  nome:'Q1',     x:460, y:150 },
            { id:'out2',   tipo:'OUT',  nome:'Q2',     x:460, y:240 },
            { id:'out3',   tipo:'OUT',  nome:'Q3',     x:460, y:330 },
        ],
        conn: [
            ['in_clk','ff0'],['ff0','ff1'],['ff1','ff2'],['ff2','ff3'],
            ['in_rst','ff0'],['in_rst','ff1'],['in_rst','ff2'],['in_rst','ff3'],
            ['ff0','not0'],['ff1','not1'],['ff2','not2'],['ff3','not3'],
            ['not0','ff0'],['not1','ff1'],['not2','ff2'],['not3','ff3'],
            ['ff0','out0'],['ff1','out1'],['ff2','out2'],['ff3','out3'],
        ],
        legenda: [
            { col:'#3498db', txt:'D Flip-Flop' },
            { col:'#8e44ad', txt:'NOT (feedback)' },
            { col:'#16a085', txt:'Ingresso' },
            { col:'#e67e22', txt:'Uscita' },
        ],
    },
    DECODER_BCD7: {
        titolo: 'Decoder BCD → 7 Segmenti — Vista Interna',
        desc: 'Decodificatore combinatorio. Converte un valore BCD (4 bit, 0-9) nei 7 segnali di controllo per un display a 7 segmenti (A-G).',
        nodi: [
            { id:'in_d0', tipo:'IN',   nome:'D0', x:40,  y:50 },
            { id:'in_d1', tipo:'IN',   nome:'D1', x:40,  y:120 },
            { id:'in_d2', tipo:'IN',   nome:'D2', x:40,  y:190 },
            { id:'in_d3', tipo:'IN',   nome:'D3', x:40,  y:260 },
            { id:'rom',   tipo:'ROM',  nome:'ROM\nTruth\nTable',  x:200, y:100, w:120, h:140 },
            { id:'out_a', tipo:'OUT',  nome:'A',  x:430, y:20 },
            { id:'out_b', tipo:'OUT',  nome:'B',  x:430, y:70 },
            { id:'out_c', tipo:'OUT',  nome:'C',  x:430, y:120 },
            { id:'out_d', tipo:'OUT',  nome:'D',  x:430, y:170 },
            { id:'out_e', tipo:'OUT',  nome:'E',  x:430, y:220 },
            { id:'out_f', tipo:'OUT',  nome:'F',  x:430, y:270 },
            { id:'out_g', tipo:'OUT',  nome:'G',  x:430, y:320 },
        ],
        conn: [
            ['in_d0','rom'],['in_d1','rom'],['in_d2','rom'],['in_d3','rom'],
            ['rom','out_a'],['rom','out_b'],['rom','out_c'],['rom','out_d'],
            ['rom','out_e'],['rom','out_f'],['rom','out_g'],
        ],
        tabella: [
            ['BCD','A','B','C','D','E','F','G'],
            ['0','1','1','1','1','1','1','0'],
            ['1','0','1','1','0','0','0','0'],
            ['2','1','1','0','1','1','0','1'],
            ['3','1','1','1','1','0','0','1'],
            ['4','0','1','1','0','0','1','1'],
            ['5','1','0','1','1','0','1','1'],
            ['6','1','0','1','1','1','1','1'],
            ['7','1','1','1','0','0','0','0'],
            ['8','1','1','1','1','1','1','1'],
            ['9','1','1','1','1','0','1','1'],
        ],
        legenda: [
            { col:'#f39c12', txt:'ROM (Truth Table)' },
            { col:'#16a085', txt:'Ingresso' },
            { col:'#e67e22', txt:'Uscita' },
        ],
    },
    DECODER_STRINGA: {
        titolo: 'ROM Immagine 64 bit — Vista Interna',
        desc: 'Memoria di sola lettura da 64 bit (immagine 8x8, modificabile con click sull\'anteprima del chip). '
            + 'Un contatore a 3 bit (0-7) scandisce le righe: durante la fase alta di CLK la riga corrente '
            + 'viene presentata in uscita (indirizzo R0-R2 + pixel D0-D7) con WE=1, cosi\' lo Schermo 8x8 la memorizza; '
            + 'sul fronte di discesa di CLK il contatore avanza alla riga successiva. RST riporta la scansione alla riga 0. '
            + 'Le due meta\' esistono anche come chip modulari separati: "Contatore 0-7" e "ROM 64bit".',
        nodi: [
            { id:'in_clk', tipo:'IN',  nome:'CLK', x:40,  y:80 },
            { id:'in_rst', tipo:'IN',  nome:'RST', x:40,  y:200 },
            { id:'cnt',    tipo:'DFF', nome:'CONT\n0-7', x:190, y:110, w:90, h:70 },
            { id:'rom',    tipo:'ROM', nome:'ROM\n64 bit\n8 righe', x:380, y:100, w:120, h:150 },
            { id:'out_r0', tipo:'OUT', nome:'R0', x:650, y:20,  w:70, h:34 },
            { id:'out_r1', tipo:'OUT', nome:'R1', x:650, y:64,  w:70, h:34 },
            { id:'out_r2', tipo:'OUT', nome:'R2', x:650, y:108, w:70, h:34 },
            { id:'out_d0', tipo:'OUT', nome:'D0', x:650, y:152, w:70, h:34 },
            { id:'out_d1', tipo:'OUT', nome:'D1', x:650, y:196, w:70, h:34 },
            { id:'out_d2', tipo:'OUT', nome:'D2', x:650, y:240, w:70, h:34 },
            { id:'out_d3', tipo:'OUT', nome:'D3', x:650, y:284, w:70, h:34 },
            { id:'out_d4', tipo:'OUT', nome:'D4', x:650, y:328, w:70, h:34 },
            { id:'out_d5', tipo:'OUT', nome:'D5', x:650, y:372, w:70, h:34 },
            { id:'out_d6', tipo:'OUT', nome:'D6', x:650, y:416, w:70, h:34 },
            { id:'out_d7', tipo:'OUT', nome:'D7', x:650, y:460, w:70, h:34 },
            { id:'out_we', tipo:'OUT', nome:'WE', x:650, y:504, w:70, h:34 },
        ],
        conn: [
            ['in_clk','cnt'],['in_rst','cnt'],
            ['cnt','rom'],
            ['cnt','out_r0'],['cnt','out_r1'],['cnt','out_r2'],
            ['rom','out_d0'],['rom','out_d1'],['rom','out_d2'],['rom','out_d3'],
            ['rom','out_d4'],['rom','out_d5'],['rom','out_d6'],['rom','out_d7'],
            ['in_clk','out_we'],
        ],
        legenda: [
            { col:'#3498db', txt:'Contatore 3 bit (riga)' },
            { col:'#f39c12', txt:'ROM 64 bit (immagine)' },
            { col:'#16a085', txt:'Ingresso' },
            { col:'#e67e22', txt:'Uscita' },
        ],
    },
    ROM_8X8: {
        titolo: 'ROM 64 bit a righe — Vista Interna',
        desc: 'Memoria di sola lettura da 64 bit organizzata in 8 righe da 8 bit (immagine 8x8). '
            + 'Lettura combinatoria: l\'indirizzo R0-R2 (0-7) seleziona la riga, i cui 8 bit escono su D0-D7 '
            + '(D0 = pixel piu\' a sinistra). Il contenuto si modifica con click sull\'anteprima del chip.',
        nodi: [
            { id:'in_r0', tipo:'IN',  nome:'R0', x:40,  y:60 },
            { id:'in_r1', tipo:'IN',  nome:'R1', x:40,  y:140 },
            { id:'in_r2', tipo:'IN',  nome:'R2', x:40,  y:220 },
            { id:'rom',   tipo:'ROM', nome:'ROM\n64 bit\n8 righe', x:220, y:80, w:120, h:150 },
            { id:'out_d0', tipo:'OUT', nome:'D0', x:480, y:20,  w:70, h:34 },
            { id:'out_d1', tipo:'OUT', nome:'D1', x:480, y:64,  w:70, h:34 },
            { id:'out_d2', tipo:'OUT', nome:'D2', x:480, y:108, w:70, h:34 },
            { id:'out_d3', tipo:'OUT', nome:'D3', x:480, y:152, w:70, h:34 },
            { id:'out_d4', tipo:'OUT', nome:'D4', x:480, y:196, w:70, h:34 },
            { id:'out_d5', tipo:'OUT', nome:'D5', x:480, y:240, w:70, h:34 },
            { id:'out_d6', tipo:'OUT', nome:'D6', x:480, y:284, w:70, h:34 },
            { id:'out_d7', tipo:'OUT', nome:'D7', x:480, y:328, w:70, h:34 },
        ],
        conn: [
            ['in_r0','rom'],['in_r1','rom'],['in_r2','rom'],
            ['rom','out_d0'],['rom','out_d1'],['rom','out_d2'],['rom','out_d3'],
            ['rom','out_d4'],['rom','out_d5'],['rom','out_d6'],['rom','out_d7'],
        ],
        legenda: [
            { col:'#f39c12', txt:'ROM 64 bit (immagine)' },
            { col:'#16a085', txt:'Ingresso (indirizzo)' },
            { col:'#e67e22', txt:'Uscita (pixel riga)' },
        ],
    },
};

const COLORI_NODO = {
    IN:   '#16a085', OUT:  '#e67e22', NAND: '#c0392b', AND: '#2980b9',
    OR:   '#27ae60', NOT:  '#8e44ad', XOR:  '#d35400', DFF:  '#3498db',
    ROM:  '#f39c12', NOR:  '#1abc9c', XNOR: '#e91e63', BUF:  '#607d8b',
    PMOS: '#e67e22', NMOS: '#3498db', VDD:  '#c0392b', GND:  '#c0392b',
};

// Rettangolo (in coordinate mondo) dell'anteprima cliccabile del chip DECODER_STRINGA.
// Usato sia dal rendering (graphics.js) sia dall'editor per l'hit test del click (app.js).
function romPreviewRect(c) {
    const dim = 48;
    return { x: c.x + (c.w - dim)/2 - 3, y: c.y + c.h - dim - 26 - 3, w: dim + 6, h: dim + 6 };
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

    // Disegna il pannello frontale stilizzato della calcolatrice al posto del circuito
    disegnaPannelloCalcolatrice(pannello) {
        const ctx = this.ctx;
        ctx.clearRect(0,0,this.W,this.H);
        ctx.fillStyle = COL.SFONDO;
        ctx.fillRect(0,0,this.W,this.H);
        pannello.disegna(ctx, this.W, this.H);
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

        // Nome (usa nomeCustom per INGRESSO/USCITA se disponibile)
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.max(11,12/this.zoom)}px monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const nomeVisualizzato = (c.nomeCustom) ? c.nomeCustom : c.nome;
        ctx.fillText(nomeVisualizzato, c.x+c.w/2, c.y+12);

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
        if(c.tipo==='PULSANTE') {
            // Indicatore pulsante momentaneo
            const on = c.stato;
            const cx = c.x+c.w/2, cy = c.y+c.h-16;
            // Cerchio esterno
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI*2);
            ctx.fillStyle = on ? '#ff2222' : '#3a3a3a';
            ctx.fill();
            ctx.strokeStyle = on ? '#ff6666' : '#555';
            ctx.lineWidth = 1.5/this.zoom;
            ctx.stroke();
            // Cerchio interno (bottone)
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI*2);
            ctx.fillStyle = on ? '#ff4444' : '#555';
            if(on){ ctx.shadowColor='#ff4444'; ctx.shadowBlur=12; }
            ctx.fill();
            ctx.shadowBlur=0;
            // Testo
            ctx.fillStyle = on ? '#fff' : '#888';
            ctx.font = '7px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(on?'1':'0', cx, cy);
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
        if(c.tipo==='DISPLAY7_TRIO') {
            this._display7segTrio(ctx, c);
        }
        if(c.tipo==='SCHERMO_8X8') {
            this._schermo8x8(ctx, c);
        }
        if(c.tipo==='DECODER_STRINGA' || c.tipo==='CUSTOM_ROM_IMMAGINE') {
            this._decoderStringa(ctx, c);
        }
        if(c.tipo==='ROM_8X8') {
            this._rom8x8(ctx, c);
        }
        if(c.tipo==='CUSTOM_ROM_64BIT') {
            // Il chip personalizzato "ROM 64bit" ha la stessa anteprima cliccabile del nucleo nativo
            this._rom8x8(ctx, c);
        }
        if(c.tipo==='FLIPFLOP_D') {
            this._flipflopD(ctx, c);
        }
        if(c.tipo==='CONTATORE_4BIT') {
            this._contatore4bit(ctx, c);
        }
        if(c.tipo==='DECODER_BCD7') {
            this._decoderBcd7(ctx, c);
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
        const pins = c.pinI.slice(0,8).map(p => p?.stato || 0);

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

        this._disegnaCifra7SegGeom(ctx, dx, dy, dw, dh, pins);
    }

    // Disegna i 7 segmenti + DP di UNA cifra dentro il riquadro (dx,dy,dw,dh),
    // senza disegnare lo sfondo (usato sia dal display singolo che da quello triplo).
    // pins: [A,B,C,D,E,F,G,DP] (0/1)
    _disegnaCifra7SegGeom(ctx, dx, dy, dw, dh, pins) {
        const [pA,pB,pC,pD,pE,pF,pG,pDP] = pins;

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

    // ---- Display a 3 cifre a 7 segmenti (raggruppa 3 DISPLAY7 in un solo chip) ----
    //
    //  Pin di ingresso: A1..G1,DP1 (cifra piu' significativa, a sinistra),
    //                    A2..G2,DP2 (cifra centrale),
    //                    A3..G3,DP3 (cifra meno significativa, a destra).
    //  Utile per avere un unico "blocco display" pulito al posto di 3 chip
    //  DISPLAY7 separati collegati singolarmente (es. decine/unita/decimi).
    //
    _display7segTrio(ctx, c) {
        const N_CIFRE = 3;
        const pad = 10;
        const dx = c.x + pad;
        const dy = c.y + 22;
        const dw = c.w - pad*2;
        const dh = 150; // altezza fissa dell'area display (indipendente da c.h)

        // Sfondo unico del display (nero)
        ctx.fillStyle = '#0a0a0a';
        this._rrect(ctx, dx, dy, dw, dh, 4);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1/this.zoom;
        ctx.stroke();

        const digitW = dw / N_CIFRE;
        for(let i=0; i<N_CIFRE; i++) {
            const pins = c.pinI.slice(i*8, i*8+8).map(p => p?.stato || 0);
            this._disegnaCifra7SegGeom(ctx, dx + i*digitW, dy, digitW, dh, pins);
            if(i < N_CIFRE-1) {
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 1/this.zoom;
                ctx.beginPath();
                ctx.moveTo(dx + (i+1)*digitW, dy+4);
                ctx.lineTo(dx + (i+1)*digitW, dy+dh-4);
                ctx.stroke();
            }
        }
    }

    // ---- Schermo a matrice 8x8 (64 bit) ----
    //
    //  Framebuffer interno: 8 righe da 8 bit. Pixel accesi = rossi, spenti = neri.
    //  Si scrive una riga alla volta tramite R0-R2 (indirizzo) + D0-D7 (dati) + WE.
    //
    _schermo8x8(ctx, c) {
        const righe = Array.isArray(c.statoInterno?.righe) ? c.statoInterno.righe : [0,0,0,0,0,0,0,0];

        // Area schermo interna
        const pad = 10;
        const gx = c.x + pad;
        const areaW = c.w - pad*2;
        const cella = areaW / 8;
        const gy = c.y + 30;
        const gh = cella * 8;

        // Sfondo schermo (nero)
        ctx.fillStyle = '#0a0a0a';
        this._rrect(ctx, gx, gy, areaW, gh, 4);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1/this.zoom;
        ctx.stroke();

        // Pixel
        const colOn  = '#ff1a1a';
        const colOff = '#1a0a0a';
        const glowOn = '#ff4444';
        const raggio = cella * 0.38;
        for(let r=0; r<8; r++){
            for(let col=0; col<8; col++){
                const on = (righe[r] >> col) & 1;
                const px = gx + col*cella + cella/2;
                const py = gy + r*cella + cella/2;
                ctx.save();
                if(on){ ctx.shadowColor = glowOn; ctx.shadowBlur = 8; }
                ctx.fillStyle = on ? colOn : colOff;
                ctx.beginPath();
                ctx.arc(px, py, raggio, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    // ---- Decoder ROM 64 bit (sorgente immagini per SCHERMO_8X8) ----
    //
    //  Mostra una mini-anteprima dell'immagine contenuta e la riga
    //  attualmente in uscita. Click sull'anteprima = modifica immagine,
    //  doppio click sul corpo del chip = vista interna.
    //
    _decoderStringa(ctx, c) {
        const dati = c.statoInterno?.dati || ROM_DEFAULT_8X8;

        // Mini-anteprima 8x8 centrata (area cliccabile: vedi romPreviewRect)
        const pr = romPreviewRect(c);
        const dim = 48;
        const cella = dim / 8;
        const gx = pr.x + 3;
        const gy = pr.y + 3;

        ctx.fillStyle = '#0a0a0a';
        this._rrect(ctx, pr.x, pr.y, pr.w, pr.h, 3);
        ctx.fill();

        for(let r=0; r<8; r++){
            for(let col=0; col<8; col++){
                if(dati[r*8+col] === '1'){
                    ctx.fillStyle = '#ff1a1a';
                    ctx.fillRect(gx + col*cella + 0.5, gy + r*cella + 0.5, cella-1, cella-1);
                }
            }
        }

        // Riga corrente in uscita (solo se il chip la tiene internamente)
        const riga = c.statoInterno?.riga;
        if(riga !== undefined){
            ctx.fillStyle = '#ccc';
            ctx.font = `${10/this.zoom}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('riga ' + riga + '/7', c.x + c.w/2, c.y + c.h - 12);
        }

        // Hint per le interazioni
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = `${8/this.zoom}px sans-serif`;
        ctx.fillText('click img = modifica', c.x + c.w/2, pr.y - 14);
        ctx.fillText('2x click = vista interna', c.x + c.w/2, pr.y - 5);
    }

    // ---- ROM 64 bit a righe (contenuto immagine 8x8, lettura combinatoria) ----
    //
    //  Ingressi R0-R2 = indirizzo riga, uscite D0-D7 = pixel di quella riga.
    //  Click sull'anteprima = modifica immagine, doppio click sul corpo = vista interna.
    //
    _rom8x8(ctx, c) {
        const dati = c.statoInterno?.dati || ROM_DEFAULT_8X8;

        // Mini-anteprima 8x8 centrata (area cliccabile: vedi romPreviewRect)
        const pr = romPreviewRect(c);
        const dim = 48;
        const cella = dim / 8;
        const gx = pr.x + 3;
        const gy = pr.y + 3;

        ctx.fillStyle = '#0a0a0a';
        this._rrect(ctx, pr.x, pr.y, pr.w, pr.h, 3);
        ctx.fill();

        for(let r=0; r<8; r++){
            for(let col=0; col<8; col++){
                if(dati[r*8+col] === '1'){
                    ctx.fillStyle = '#ff1a1a';
                    ctx.fillRect(gx + col*cella + 0.5, gy + r*cella + 0.5, cella-1, cella-1);
                }
            }
        }

        // Riga attualmente letta (indirizzo in ingresso)
        const addr = (c.pinI[0]?.stato||0) | ((c.pinI[1]?.stato||0)<<1) | ((c.pinI[2]?.stato||0)<<2);
        ctx.fillStyle = '#ccc';
        ctx.font = `${10/this.zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('lettura riga ' + addr, c.x + c.w/2, c.y + c.h - 12);

        // Hint per le interazioni
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = `${8/this.zoom}px sans-serif`;
        ctx.fillText('click img = modifica', c.x + c.w/2, pr.y - 14);
        ctx.fillText('2x click = vista interna', c.x + c.w/2, pr.y - 5);
    }

    // ---- Flip-flop D ----
    _flipflopD(ctx, c) {
        // Disegna simbolo > per indicare edge-triggered
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5/this.zoom;
        ctx.beginPath();
        const tx = c.x + 8, ty = c.y + 48;
        ctx.moveTo(tx, ty-4);
        ctx.lineTo(tx+5, ty);
        ctx.lineTo(tx, ty+4);
        ctx.stroke();

        // Mostra valore memorizzato Q
        const Q = c.statoInterno?.Q || 0;
        ctx.fillStyle = Q ? '#00ff88' : '#666';
        ctx.font = `bold ${18/this.zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Q.toString(), c.x + c.w/2, c.y + c.h - 15);

        // Label "Q="
        ctx.fillStyle = '#aaa';
        ctx.font = `${10/this.zoom}px sans-serif`;
        ctx.fillText('Q=', c.x + c.w/2, c.y + c.h - 28);
    }

    // ---- Contatore 4 bit ----
    _contatore4bit(ctx, c) {
        const val = c.statoInterno?.valore || 0;
        // Mostra valore decimale grande
        ctx.fillStyle = '#00ff88';
        ctx.font = `bold ${22/this.zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val.toString(), c.x + c.w/2, c.y + c.h/2 + 8);
        // Mostra valore binario
        ctx.fillStyle = '#aaa';
        ctx.font = `${10/this.zoom}px monospace`;
        const bin = val.toString(2).padStart(4,'0');
        ctx.fillText(bin, c.x + c.w/2, c.y + c.h - 10);
        // Simbolo > per edge-triggered
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5/this.zoom;
        ctx.beginPath();
        const tx = c.x + 8, ty = c.y + 42;
        ctx.moveTo(tx, ty-4);
        ctx.lineTo(tx+5, ty);
        ctx.lineTo(tx, ty+4);
        ctx.stroke();
    }

    // ---- Decoder BCD → 7 segmenti ----
    _decoderBcd7(ctx, c) {
        const d0 = c.pinI[0]?.stato || 0;
        const d1 = c.pinI[1]?.stato || 0;
        const d2 = c.pinI[2]?.stato || 0;
        const d3 = c.pinI[3]?.stato || 0;
        const digit = d0 | (d1<<1) | (d2<<2) | (d3<<3);
        // Mostra cifra decodificata
        ctx.fillStyle = digit <= 9 ? '#ffdd44' : '#ff4444';
        ctx.font = `bold ${24/this.zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(digit <= 9 ? digit.toString() : '?', c.x + c.w/2, c.y + c.h/2 + 10);
        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = `${9/this.zoom}px sans-serif`;
        ctx.fillText('digit=' + (digit<=9 ? digit : 'ERR'), c.x + c.w/2, c.y + c.h - 10);
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

// ======================== PANNELLO FRONTALE CALCOLATRICE ========================
//
// Skin grafica "a fine progetto" per il progetto Calcolatrice 3 cifre:
// nasconde chip/fili e mostra solo display + tastierino stilizzati,
// mantenendo il progetto sottostante intatto e funzionante (gli stessi
// PULSANTE/INGRESSO/USCITA vengono pilotati direttamente).

// Tabella cifra decimale -> segmenti [A,B,C,D,E,F,G] (stessa codifica di DECODER_BCD7)
const CALC_SEG_DIGITI = {
    0:[1,1,1,1,1,1,0], 1:[0,1,1,0,0,0,0], 2:[1,1,0,1,1,0,1], 3:[1,1,1,1,0,0,1],
    4:[0,1,1,0,0,1,1], 5:[1,0,1,1,0,1,1], 6:[1,0,1,1,1,1,1], 7:[1,1,1,0,0,0,0],
    8:[1,1,1,1,1,1,1], 9:[1,1,1,1,0,1,1]
};

// Layout tastierino stile calcolatrice: [riga][colonna] -> cifra (o null = vuoto)
const CALC_TASTIERA_GRID = [
    [7,8,9],
    [4,5,6],
    [1,2,3],
    [null,0,null]
];

// Disegna una cifra a 7 segmenti centrata in (cx,cy) dentro un riquadro dw x dh.
// digit: 0-9 oppure null per display spento.
function disegnaCifra7SegPanel(ctx, cx, cy, dw, dh) {
    return function(digit) {
        const segL = dw * 0.55, segW = dw * 0.16, hGap = dh * 0.42;
        const colOn = '#ff2222', colOff = '#331414', glowOn = '#ff5555';
        const pat = (digit!==null && CALC_SEG_DIGITI[digit]) ? CALC_SEG_DIGITI[digit] : [0,0,0,0,0,0,0];
        const segs = [
            { on:pat[0], cx:cx, cy:cy-hGap,        horiz:true  },
            { on:pat[1], cx:cx+segL/2, cy:cy-hGap/2, horiz:false },
            { on:pat[2], cx:cx+segL/2, cy:cy+hGap/2, horiz:false },
            { on:pat[3], cx:cx, cy:cy+hGap,        horiz:true  },
            { on:pat[4], cx:cx-segL/2, cy:cy+hGap/2, horiz:false },
            { on:pat[5], cx:cx-segL/2, cy:cy-hGap/2, horiz:false },
            { on:pat[6], cx:cx, cy:cy,             horiz:true  },
        ];
        segs.forEach(s => {
            ctx.save();
            if(s.on){ ctx.shadowColor=glowOn; ctx.shadowBlur=10; }
            ctx.fillStyle = s.on ? colOn : colOff;
            ctx.beginPath();
            if(s.horiz){
                const hw=segL/2, hh=segW/2;
                ctx.moveTo(s.cx-hw+hh, s.cy-hh); ctx.lineTo(s.cx+hw-hh, s.cy-hh);
                ctx.lineTo(s.cx+hw, s.cy); ctx.lineTo(s.cx+hw-hh, s.cy+hh);
                ctx.lineTo(s.cx-hw+hh, s.cy+hh); ctx.lineTo(s.cx-hw, s.cy);
            } else {
                const hw=segW/2, hh=hGap/2-segW*0.3;
                ctx.moveTo(s.cx, s.cy-hh); ctx.lineTo(s.cx+hw, s.cy-hh+hw);
                ctx.lineTo(s.cx+hw, s.cy+hh-hw); ctx.lineTo(s.cx, s.cy+hh);
                ctx.lineTo(s.cx-hw, s.cy+hh-hw); ctx.lineTo(s.cx-hw, s.cy-hh+hw);
            }
            ctx.closePath(); ctx.fill(); ctx.restore();
        });
    };
}

class PannelloCalcolatrice {
    constructor(sim, config) {
        this.sim = sim;
        this.config = config;
        this._rects = [];       // aree cliccabili in coordinate schermo (calcolate a ogni disegno)
        this.PW = 760; this.PH = 1020;
    }

    // Rileva nel circuito caricato la struttura attesa della "Calcolatrice 3 cifre"
    // (6 tastierini Keypad-BCD, switch OP, LED riporto/negativo, 3 display7).
    // Restituisce un'istanza pronta all'uso, oppure null se il progetto non è compatibile.
    static rileva(sim) {
        const NOMI_GRUPPI = ['A-centinaia','A-decine','A-unita','B-centinaia','B-decine','B-unita'];

        function wireSrc(dstId){
            for(const f of sim.fili.values()) if(f.dstId===dstId) return f.srcId;
            return null;
        }
        function chipOfPin(pid){
            for(const c of sim.chips.values()){
                const all=[...(c.pinI||[]), ...(c.pinU||[])];
                if(all.some(p=>p.id===pid)) return c;
            }
            return null;
        }

        const keypads = [...sim.chips.values()].filter(c => c.tipo === 'CUSTOM_KEYPAD-BCD');
        const gruppi = {};
        for(const nome of NOMI_GRUPPI){
            const kp = keypads.find(k => k.nomeCustom === nome);
            if(!kp || kp.pinI.length < 10) return null;
            const bottoni = [];
            for(let k=0;k<10;k++){
                const srcId = wireSrc(kp.pinI[k].id);
                const btn = srcId ? chipOfPin(srcId) : null;
                if(!btn || !btn.pinU.length) return null;
                bottoni.push(btn);
            }
            gruppi[nome] = bottoni;
        }

        const op = [...sim.chips.values()].find(c => c.tipo==='INGRESSO' && c.nomeCustom && c.nomeCustom.toUpperCase().startsWith('OP'));
        const led = [...sim.chips.values()].find(c => c.tipo==='USCITA' && c.nomeCustom && /RIPORTO|NEGATIV/i.test(c.nomeCustom));
        const displaysGrezzi = [...sim.chips.values()].filter(c => c.tipo==='DISPLAY7');
        if(!op || !led || displaysGrezzi.length < 3) return null;

        // Ordina per coordinata Y: nel progetto generato i display sono impilati
        // dall'alto in basso nell'ordine centinaia, decine, unità.
        const displays = displaysGrezzi.slice().sort((a,b)=>a.y-b.y).slice(0,3);

        return new PannelloCalcolatrice(sim, { gruppi, op, led, displays });
    }

    // Forza una propagazione immediata del circuito (senza dover avviare/attendere il clock)
    _tick() {
        const wasActive = this.sim.attivo;
        this.sim.attivo = true;
        this.sim.tick();
        this.sim.attivo = wasActive;
    }

    _digitOf(displayChip) {
        const segs = displayChip.pinI.slice(0,7).map(p => p.stato ? 1 : 0);
        for(const d of Object.keys(CALC_SEG_DIGITI)){
            const pat = CALC_SEG_DIGITI[d];
            if(pat.every((v,i) => v===segs[i])) return parseInt(d);
        }
        return null;
    }

    _cifraSelezionata(nomeGruppo) {
        const bottoni = this.config.gruppi[nomeGruppo];
        for(let i=0;i<10;i++) if(bottoni[i].stato) return i;
        return null;
    }

    // Preme una cifra su un gruppo (tastierino); ripremere la stessa cifra la deseleziona (torna a 0).
    premiCifra(nomeGruppo, cifra) {
        const bottoni = this.config.gruppi[nomeGruppo];
        const attuale = this._cifraSelezionata(nomeGruppo);
        const spegni = (attuale === cifra);
        for(let i=0;i<10;i++){
            const nuovo = (!spegni && i===cifra) ? 1 : 0;
            bottoni[i].stato = nuovo;
            bottoni[i].pinU[0].stato = nuovo;
        }
        this._tick();
    }

    // Azzera tutte le cifre di entrambi gli operandi
    azzeraTutto() {
        for(const nome of Object.keys(this.config.gruppi)){
            const bottoni = this.config.gruppi[nome];
            bottoni.forEach(b => { b.stato = 0; b.pinU[0].stato = 0; });
        }
        this._tick();
    }

    setOp(valore) {
        this.config.op.stato = valore;
        if(this.config.op.pinU.length) this.config.op.pinU[0].stato = valore;
        this._tick();
    }

    hitTest(sx, sy) {
        for(const r of this._rects){
            if(sx>=r.sx && sx<=r.sx+r.sw && sy>=r.sy && sy<=r.sy+r.sh) return r;
        }
        return null;
    }

    handleClick(sx, sy) {
        const r = this.hitTest(sx, sy);
        if(!r) return;
        if(r.tipo==='cifra') this.premiCifra(r.gruppo, r.cifra);
        else if(r.tipo==='op') this.setOp(r.valore);
        else if(r.tipo==='azzera') this.azzeraTutto();
    }

    // ---- Disegno ----

    disegna(ctx, W, H) {
        const rectsPannello = [];
        const PW = this.PW, PH = this.PH;
        const scale = Math.max(0.1, Math.min((W-40)/PW, (H-40)/PH));
        const ox = (W - PW*scale)/2, oy = (H - PH*scale)/2;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        this._disegnaCorpo(ctx, PW, PH);
        this._disegnaDisplay(ctx, PW);
        this._disegnaOp(ctx, PW, rectsPannello);
        let y = 350;
        y = this._disegnaTastiere(ctx, PW, y, 'A', ['A-centinaia','A-decine','A-unita'], rectsPannello);
        y += 30;
        this._disegnaTastiere(ctx, PW, y, 'B', ['B-centinaia','B-decine','B-unita'], rectsPannello);
        this._disegnaAzzera(ctx, PW, PH, rectsPannello);

        ctx.restore();

        // Converte le aree cliccabili in coordinate schermo
        this._rects = rectsPannello.map(r => ({
            ...r, sx: ox+r.x*scale, sy: oy+r.y*scale, sw: r.w*scale, sh: r.h*scale
        }));
    }

    _disegnaCorpo(ctx, PW, PH) {
        ctx.fillStyle = '#0d0d16';
        ctx.fillRect(0,0,PW,PH);
        // Corpo calcolatrice
        const grad = ctx.createLinearGradient(0,0,0,PH);
        grad.addColorStop(0,'#2b2b40'); grad.addColorStop(1,'#1a1a2a');
        ctx.fillStyle = grad;
        this._rrectPanel(ctx, 10,10, PW-20, PH-20, 22);
        ctx.fill();
        ctx.strokeStyle = '#454568'; ctx.lineWidth = 3;
        ctx.stroke();
        // Titolo
        ctx.fillStyle = '#8890c0';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('CALCOLATRICE — 3 CIFRE', PW/2, 26);
    }

    _disegnaDisplay(ctx, PW) {
        const dx=40, dy=60, dw=PW-80, dh=180;
        ctx.fillStyle = '#081008';
        this._rrectPanel(ctx, dx,dy,dw,dh,10); ctx.fill();
        ctx.strokeStyle = '#0a3d0a'; ctx.lineWidth=3; ctx.stroke();

        const digitW = 160, gap = 30;
        const totalW = digitW*3 + gap*2;
        let cx = dx + (dw-totalW)/2 + digitW/2;
        const cy = dy + dh/2 + 5;
        for(const display of this.config.displays){
            const digit = this._digitOf(display);
            disegnaCifra7SegPanel(ctx, cx, cy, digitW*0.6, dh*0.55)(digit);
            cx += digitW + gap;
        }

        // Indicatore RIPORTO/NEGATIVO
        const ledOn = this.config.led.pinI.length && this.config.led.pinI[0].stato;
        const opValue = this.config.op.stato;
        const testoLed = opValue ? '⚠ RIPORTO (overflow)' : '⚠ NEGATIVO (compl. a 10)';
        ctx.font = 'bold 14px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillStyle = ledOn ? '#ff5555' : '#3a2020';
        if(ledOn){ ctx.shadowColor='#ff5555'; ctx.shadowBlur=6; }
        ctx.fillText(testoLed, dx+14, dy+dh-24);
        ctx.shadowBlur = 0;
    }

    _disegnaOp(ctx, PW, rects) {
        const w=320, h=56, x=(PW-w)/2, y=270;
        const opValue = this.config.op.stato;

        ctx.fillStyle = '#111120';
        this._rrectPanel(ctx, x,y,w,h,10); ctx.fill();
        ctx.strokeStyle='#3a3a58'; ctx.lineWidth=2; ctx.stroke();

        // Metà sinistra: SOTTRAZIONE (op=0), metà destra: SOMMA (op=1)
        const half = w/2;
        ctx.fillStyle = (opValue===0) ? '#e74c3c' : '#1a1a2e';
        this._rrectPanel(ctx, x+3, y+3, half-6, h-6, 8); ctx.fill();
        ctx.fillStyle = (opValue===1) ? '#2ecc71' : '#1a1a2e';
        this._rrectPanel(ctx, x+half+3, y+3, half-6, h-6, 8); ctx.fill();

        ctx.font='bold 22px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('− SOTTRAI', x+half/2, y+h/2);
        ctx.fillText('+ SOMMA',  x+half+half/2, y+h/2);

        rects.push({ tipo:'op', valore:0, x:x, y:y, w:half, h:h });
        rects.push({ tipo:'op', valore:1, x:x+half, y:y, w:half, h:h });
    }

    _disegnaTastiere(ctx, PW, yStart, etichettaOperando, gruppi, rects) {
        ctx.fillStyle = '#8890c0';
        ctx.font = 'bold 15px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
        ctx.fillText('OPERANDO ' + etichettaOperando, 40, yStart);

        const margine = 40, gap = 20;
        const larghezzaGruppo = (PW - margine*2 - gap*2) / 3;
        const etichette = ['CENTINAIA','DECINE','UNITA\''];
        let alturaMax = 0;
        gruppi.forEach((nomeGruppo, idx) => {
            const gx = margine + idx*(larghezzaGruppo+gap);
            const gy = yStart + 14;
            const h = this._disegnaMiniTastiera(ctx, gx, gy, larghezzaGruppo, nomeGruppo, etichette[idx], rects);
            alturaMax = Math.max(alturaMax, h);
        });
        return yStart + 14 + alturaMax;
    }

    _disegnaMiniTastiera(ctx, gx, gy, gw, nomeGruppo, etichetta, rects) {
        ctx.fillStyle = '#666a90';
        ctx.font = '11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='alphabetic';
        ctx.fillText(etichetta, gx+gw/2, gy+12);

        const cifraSel = this._cifraSelezionata(nomeGruppo);
        const cols=3, rows=CALC_TASTIERA_GRID.length;
        const cellGap = 6;
        const cellW = (gw - cellGap*(cols-1)) / cols;
        const cellH = 42;
        const top = gy + 20;

        CALC_TASTIERA_GRID.forEach((riga, r) => {
            riga.forEach((cifra, c) => {
                if(cifra===null) return;
                const bx = gx + c*(cellW+cellGap);
                const by = top + r*(cellH+cellGap);
                const attiva = (cifraSel === cifra);
                ctx.fillStyle = attiva ? '#2ecc71' : '#26263c';
                this._rrectPanel(ctx, bx, by, cellW, cellH, 6); ctx.fill();
                ctx.strokeStyle = attiva ? '#5cffa0' : '#3a3a58';
                ctx.lineWidth = attiva ? 2 : 1;
                ctx.stroke();
                ctx.fillStyle = attiva ? '#08210f' : '#d0d0e8';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign='center'; ctx.textBaseline='middle';
                ctx.fillText(cifra.toString(), bx+cellW/2, by+cellH/2+1);

                rects.push({ tipo:'cifra', gruppo:nomeGruppo, cifra, x:bx, y:by, w:cellW, h:cellH });
            });
        });

        return 20 + rows*(cellH+cellGap);
    }

    _disegnaAzzera(ctx, PW, PH, rects) {
        const w=160, h=44, x=(PW-w)/2, y=PH-70;
        ctx.fillStyle = '#3a2020';
        this._rrectPanel(ctx, x,y,w,h,8); ctx.fill();
        ctx.strokeStyle='#a04040'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle='#ffaaaa'; ctx.font='bold 15px sans-serif';
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('C — Azzera tutto', x+w/2, y+h/2+1);
        rects.push({ tipo:'azzera', x, y, w, h });
    }

    _rrectPanel(ctx, x,y,w,h,r) {
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.lineTo(x+w-r,y);   ctx.quadraticCurveTo(x+w,y,   x+w,y+r);
        ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h, x+w-r,y+h);
        ctx.lineTo(x+r,y+h);   ctx.quadraticCurveTo(x,y+h,   x,y+h-r);
        ctx.lineTo(x,y+r);     ctx.quadraticCurveTo(x,y,      x+r,y);
        ctx.closePath();
    }
}

// ======================== VISTA INTERNA CHIP ========================

function apriVistaInterna(chip, simRef) {
    const modale = document.getElementById('modale-interno');
    const canvas = document.getElementById('canvas-interno');
    const titolo = document.getElementById('titolo-interno');
    const info   = document.getElementById('info-chip-interno');
    const legenda= document.getElementById('legenda-interno');
    const btnModifica = document.getElementById('btn-modifica-chip');

    modale.classList.remove('nascosta');

    // Se è un chip custom, mostra il pulsante Modifica
    if(simRef.customDefs.has(chip.tipo)) {
        btnModifica.style.display = '';
        btnModifica.onclick = () => entraNellaModificaChip(chip.tipo);
        _mostraCircuitoCustom(chip, simRef, canvas, titolo, info, legenda);
    } else {
        btnModifica.style.display = 'none';
        btnModifica.onclick = null;
        if(SCHEMI_INTERNI[chip.tipo]) {
            _mostraSchematico(chip, SCHEMI_INTERNI[chip.tipo], canvas, titolo, info, legenda);
        }
    }
}

function _mostraSchematico(chip, schema, canvas, titoloEl, infoEl, legendaEl) {
    titoloEl.textContent = '🔍 ' + schema.titolo;

    // Info box
    let infoHtml = `<strong>Tipo:</strong> ${chip.nome} &nbsp;|&nbsp; <strong>ID:</strong> ${chip.id}<br>`;
    infoHtml += schema.desc;
    if(chip.statoInterno) {
        infoHtml += '<br><strong>Stato attuale:</strong> ';
        if(chip.tipo === 'CONTATORE_4BIT') infoHtml += `valore = ${chip.statoInterno.valore} (${chip.statoInterno.valore.toString(2).padStart(4,'0')}b)`;
        else if(chip.tipo === 'FLIPFLOP_D') infoHtml += `Q = ${chip.statoInterno.Q}`;
    }
    infoEl.innerHTML = infoHtml;

    // Legenda
    legendaEl.innerHTML = schema.legenda.map(l =>
        `<span class="leg-item"><span class="leg-dot" style="background:${l.col}"></span>${l.txt}</span>`
    ).join('');

    // Disegna sullo schematico
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);

    // Sfondo
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // Griglia leggera
    ctx.strokeStyle = '#15152a';
    ctx.lineWidth = 0.5;
    for(let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Calcola scala e offset per centrare lo schema
    const nodi = schema.nodi;
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    nodi.forEach(n => {
        const nw = n.w || 80, nh = n.h || 50;
        if(n.x < minX) minX = n.x;
        if(n.y < minY) minY = n.y;
        if(n.x + nw > maxX) maxX = n.x + nw;
        if(n.y + nh > maxY) maxY = n.y + nh;
    });
    const schW = maxX - minX, schH = maxY - minY;
    const scala = Math.min((W - 80) / schW, (H - 60) / schH, 1.3);
    const offX = (W - schW * scala) / 2 - minX * scala;
    const offY = (H - schH * scala) / 2 - minY * scala;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scala, scala);

    // Mappa posizioni nodi per connessioni
    const pos = {};
    nodi.forEach(n => {
        const nw = n.w || 80, nh = n.h || 50;
        pos[n.id] = {
            x: n.x, y: n.y, w: nw, h: nh,
            cx: n.x + nw/2, cy: n.y + nh/2,
            left: n.x, right: n.x + nw,
            top: n.y, bottom: n.y + nh,
        };
    });

    // Disegna connessioni
    schema.conn.forEach(([fromId, toId]) => {
        const from = pos[fromId], to = pos[toId];
        if(!from || !to) return;
        const x1 = from.right, y1 = from.cy;
        const x2 = to.left, y2 = to.cy;

        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const dx = Math.max(Math.abs(x2 - x1) * 0.4, 25);
        ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
        ctx.stroke();

        // Freccia
        const angle = Math.atan2(y2 - (y2 - (y2-y1)*0.05), x2 - (x2 - dx*0.3));
        ctx.fillStyle = '#4a5568';
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 8*Math.cos(angle - 0.3), y2 - 8*Math.sin(angle - 0.3));
        ctx.lineTo(x2 - 8*Math.cos(angle + 0.3), y2 - 8*Math.sin(angle + 0.3));
        ctx.closePath();
        ctx.fill();
    });

    // Disegna nodi
    nodi.forEach(n => {
        const p = pos[n.id];
        const col = COLORI_NODO[n.tipo] || '#7f8c8d';

        // Ombra
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        _rrectPath(ctx, p.x+2, p.y+2, p.w, p.h, 6);
        ctx.fill();

        // Corpo
        ctx.fillStyle = col;
        _rrectPath(ctx, p.x, p.y, p.w, p.h, 6);
        ctx.fill();

        // Bordo
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Nome (supporta multiline con \n)
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = n.nome.split('\n');
        const lh = 14;
        const startY = p.cy - (lines.length - 1) * lh / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, p.cx, startY + i * lh);
        });

        // Indicatore tipo (piccola etichetta)
        if(n.tipo !== 'IN' && n.tipo !== 'OUT') {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '9px sans-serif';
            ctx.fillText(n.tipo, p.cx, p.bottom - 6);
        }

        // Pin indicators
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(p.left, p.cy, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.right, p.cy, 3, 0, Math.PI*2);
        ctx.fill();
    });

    ctx.restore();

    // Per il decoder BCD, disegna la truth table nel canvas
    if(schema.tabella) {
        _disegnaTruthTable(ctx, schema.tabella, W, H);
    }
}

function _disegnaTruthTable(ctx, tabella, W, H) {
    const startX = W - 210;
    const startY = 10;
    const cellW = 24;
    const cellH = 18;
    const cols = tabella[0].length;

    // Sfondo tabella
    ctx.fillStyle = 'rgba(10,10,30,0.85)';
    const tw = cols * cellW + 16;
    const th = tabella.length * cellH + 12;
    ctx.fillRect(startX - 8, startY - 4, tw, th);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX - 8, startY - 4, tw, th);

    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    tabella.forEach((row, ri) => {
        row.forEach((cell, ci) => {
            const cx = startX + ci * cellW + cellW/2;
            const cy = startY + ri * cellH + cellH/2;

            if(ri === 0) {
                ctx.fillStyle = '#ffdd44';
                ctx.font = 'bold 10px monospace';
            } else {
                ctx.fillStyle = cell === '1' ? '#00ff88' : '#555';
                ctx.font = '10px monospace';
            }
            ctx.fillText(cell, cx, cy);
        });

        // Riga separatrice header
        if(ri === 0) {
            ctx.strokeStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(startX - 4, startY + cellH);
            ctx.lineTo(startX + cols * cellW + 4, startY + cellH);
            ctx.stroke();
        }
    });
}

function _mostraCircuitoCustom(chip, simRef, canvas, titoloEl, infoEl, legendaEl) {
    const cd = simRef.customDefs.get(chip.tipo);
    if(!cd || !cd.circuito) return;

    titoloEl.textContent = '🔍 ' + (cd.nome || chip.tipo) + ' — Circuito Interno';

    let infoHtml = `<strong>Tipo:</strong> ${cd.nome} &nbsp;|&nbsp; <strong>ID:</strong> ${chip.id}<br>`;
    if(cd.descrizione) infoHtml += `<em>${cd.descrizione}</em><br>`;
    infoHtml += `<strong>Ingressi:</strong> ${(cd.ingressi||[]).join(', ')} &nbsp;|&nbsp; <strong>Uscite:</strong> ${(cd.uscite||[]).join(', ')}`;
    infoHtml += `<br>Chip personalizzato — contiene ${cd.circuito.chips.length} componenti e ${cd.circuito.fili.length} connessioni`;
    infoEl.innerHTML = infoHtml;

    // Legenda dinamica basata sui tipi di chip interni
    const tipiInterni = new Set(cd.circuito.chips.map(c => c.tipo));
    const legItems = [];
    tipiInterni.forEach(t => {
        const def = DEFS[t];
        if(def) legItems.push({ col: def.col, txt: def.nome });
    });
    legendaEl.innerHTML = legItems.map(l =>
        `<span class="leg-item"><span class="leg-dot" style="background:${l.col}"></span>${l.txt}</span>`
    ).join('');

    // Setup canvas
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width, H = rect.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // Griglia
    ctx.strokeStyle = '#15152a';
    ctx.lineWidth = 0.5;
    for(let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const chips = cd.circuito.chips;
    const fili = cd.circuito.fili;
    if(!chips.length) return;

    // Calcola bounding box
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    chips.forEach(c => {
        const def = DEFS[c.tipo];
        const cw = def ? def.w : 100, ch = def ? def.h : 60;
        if(c.x < minX) minX = c.x;
        if(c.y < minY) minY = c.y;
        if(c.x+cw > maxX) maxX = c.x+cw;
        if(c.y+ch > maxY) maxY = c.y+ch;
    });

    const schW = maxX - minX || 200, schH = maxY - minY || 200;
    const scala = Math.min((W-60)/schW, (H-40)/schH, 2);
    const offX = (W - schW * scala) / 2 - minX * scala;
    const offY = (H - schH * scala) / 2 - minY * scala;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scala, scala);

    // Prepara pin map per i fili
    const pinMap = {};  // pinId -> {x, y}
    const chipMap = {}; // chipId -> chip data + calculated pins

    chips.forEach(c => {
        const def = DEFS[c.tipo];
        const cw = def ? def.w : 100, ch = def ? def.h : 60;
        const mt = 22, hu = ch - mt;

        chipMap[c.id] = { ...c, w: cw, h: ch, def };

        if(c.pinI) c.pinI.forEach((p, i) => {
            const s = hu / (c.pinI.length + 1);
            pinMap[p.id] = { x: c.x, y: c.y + mt + s*(i+1) };
        });
        if(c.pinU) c.pinU.forEach((p, i) => {
            const s = hu / (c.pinU.length + 1);
            pinMap[p.id] = { x: c.x + cw, y: c.y + mt + s*(i+1) };
        });
    });

    // Disegna fili
    fili.forEach(f => {
        const src = pinMap[f.srcId], dst = pinMap[f.dstId];
        if(!src || !dst) return;
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        const dx = Math.max(Math.abs(dst.x - src.x) * 0.4, 25);
        ctx.bezierCurveTo(src.x + dx, src.y, dst.x - dx, dst.y, dst.x, dst.y);
        ctx.stroke();
    });

    // Disegna chip
    chips.forEach(c => {
        const def = DEFS[c.tipo];
        const cw = def ? def.w : 100, ch = def ? def.h : 60;
        const col = def ? def.col : '#7f8c8d';
        const nome = def ? def.nome : c.tipo;

        // Ombra
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        _rrectPath(ctx, c.x+2, c.y+2, cw, ch, 5);
        ctx.fill();

        // Corpo
        ctx.fillStyle = col;
        _rrectPath(ctx, c.x, c.y, cw, ch, 5);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Nome
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nome, c.x + cw/2, c.y + 12);

        // Pin
        const mt = 22, hu = ch - mt;
        if(c.pinI) c.pinI.forEach((p, i) => {
            const s = hu / (c.pinI.length + 1);
            const px = c.x, py = c.y + mt + s*(i+1);
            ctx.fillStyle = '#888';
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#aaa';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(p.et || '', px + 6, py + 3);
        });
        if(c.pinU) c.pinU.forEach((p, i) => {
            const s = hu / (c.pinU.length + 1);
            const px = c.x + cw, py = c.y + mt + s*(i+1);
            ctx.fillStyle = '#888';
            ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#aaa';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(p.et || '', px - 6, py + 3);
        });
    });

    ctx.restore();
}

function _rrectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);   ctx.quadraticCurveTo(x+w, y,   x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);   ctx.quadraticCurveTo(x, y+h,   x, y+h-r);
    ctx.lineTo(x, y+r);     ctx.quadraticCurveTo(x, y,      x+r, y);
    ctx.closePath();
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
