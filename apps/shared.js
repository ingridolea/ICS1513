/* ICS1513 — helpers compartidos de dibujo y controles.
   Plot envuelve un <canvas> y trabaja en coordenadas del mercado (Q, P),
   no en pixeles, para que cada modulo escriba economia y no geometria. */

(function (global) {
  "use strict";

  const css = n => getComputedStyle(document.documentElement)
                     .getPropertyValue(n).trim();

  const C = {};
  ["demand","supply","policy","cs","cs-line","ps","ps-line","dwl","dwl-line",
   "fiscal","fiscal-line","transfer","total","total-line","indif","grid","axis","txt","muted"]
    .forEach(k => Object.defineProperty(C, k.replace(/-(\w)/g, (m,c) => c.toUpperCase()), {
      get: () => css("--c-" + k)
    }));

  const FONT = "11px 'Segoe UI', system-ui, sans-serif";

  function Plot(canvasId, opts) {
    this.canvas = document.getElementById(canvasId);
    this.opts = opts || {};
    this.height = this.opts.height || 340;
    this.pad = Object.assign({ l: 52, r: 22, t: 28, b: 42 }, this.opts.pad);
  }

  Plot.prototype.begin = function (maxQ, maxP) {
    const cv = this.canvas, dpr = window.devicePixelRatio || 1;
    cv.style.height = this.height + "px";
    const W = cv.clientWidth || cv.offsetWidth, H = this.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    this.ctx = ctx; this.W = W; this.H = H;
    this.maxQ = maxQ; this.maxP = maxP;
    this.gW = W - this.pad.l - this.pad.r;
    this.gH = H - this.pad.t - this.pad.b;
    return this;
  };

  Plot.prototype.tx = function (q) { return this.pad.l + (q / this.maxQ) * this.gW; };
  Plot.prototype.ty = function (p) { return this.pad.t + this.gH - (p / this.maxP) * this.gH; };
  Plot.prototype.qAt = function (x) { return (x - this.pad.l) / this.gW * this.maxQ; };

  Plot.prototype.grid = function (n) {
    const ctx = this.ctx, k = n || 4;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 0.5;
    for (let i = 0; i <= k; i++) {
      const x = this.pad.l + (i / k) * this.gW, y = this.pad.t + (i / k) * this.gH;
      ctx.beginPath(); ctx.moveTo(x, this.pad.t); ctx.lineTo(x, this.pad.t + this.gH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.pad.l, y); ctx.lineTo(this.pad.l + this.gW, y); ctx.stroke();
    }
    return this;
  };

  /* o.skipQ / o.skipP: valores que el modulo va a rotular a mano (Q*, P*, ...).
     La marca automatica que caiga encima se omite en vez de superponerse. */
  Plot.prototype.axes = function (xLabel, yLabel, o) {
    o = o || {};
    const ctx = this.ctx, f = o.fmt || (v => v.toFixed(1));
    const near = (v, list, span) =>
      (list || []).some(r => Math.abs(v - r) < span * 0.055);

    ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(this.pad.l, this.pad.t);
    ctx.lineTo(this.pad.l, this.pad.t + this.gH);
    ctx.lineTo(this.pad.l + this.gW, this.pad.t + this.gH);
    ctx.stroke();

    ctx.fillStyle = C.muted; ctx.font = FONT;
    ctx.textAlign = "right";
    ctx.fillText(xLabel || "Cantidad", this.pad.l + this.gW, this.pad.t + this.gH + 32);
    ctx.textAlign = "left";
    ctx.fillText(yLabel || "Precio", this.pad.l - 46, this.pad.t - 8);

    // solo 1/4, 2/4 y 3/4: el extremo queda libre para el nombre del eje.
    // o.noQ / o.noP omiten las marcas automaticas cuando el modulo rotula todo a mano.
    for (let i = 1; i <= 3; i++) {
      const qv = this.maxQ * i / 4, pv = this.maxP * i / 4;
      if (!o.noQ && !near(qv, o.skipQ, this.maxQ)) {
        ctx.textAlign = "center";
        ctx.fillText(f(qv), this.tx(qv), this.pad.t + this.gH + 15);
      }
      if (!o.noP && !near(pv, o.skipP, this.maxP)) {
        ctx.textAlign = "right";
        ctx.fillText(f(pv), this.pad.l - 6, this.ty(pv) + 4);
      }
    }
    return this;
  };

  /* Area en coordenadas de mercado: pts = [[q,p], ...] */
  Plot.prototype.area = function (pts, color, edge) {
    const ctx = this.ctx;
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = this.tx(pt[0]), y = this.ty(pt[1]);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke(); }
    return this;
  };

  /* Curva P = fn(Q) sobre un rango de Q */
  Plot.prototype.curve = function (fn, color, o) {
    o = o || {};
    const ctx = this.ctx, from = o.from || 0, to = o.to === undefined ? this.maxQ : o.to;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 240; i++) {
      const q = from + (to - from) * i / 240, p = fn(q);
      if (!isFinite(p)) { started = false; continue; }
      const x = this.tx(q), y = this.ty(p);
      started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), started = true);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = o.width || 2;
    ctx.setLineDash(o.dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
    return this;
  };

  /* Polilinea a partir de una lista de puntos [[x,y], ...] en coordenadas del grafico */
  Plot.prototype.poly = function (pts, color, o) {
    o = o || {};
    const ctx = this.ctx;
    ctx.beginPath();
    let started = false;
    pts.forEach(pt => {
      if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) { started = false; return; }
      const x = this.tx(pt[0]), y = this.ty(pt[1]);
      started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), started = true);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = o.width || 2;
    ctx.setLineDash(o.dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
    return this;
  };

  Plot.prototype.seg = function (q1, p1, q2, p2, color, o) {
    o = o || {};
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.tx(q1), this.ty(p1));
    ctx.lineTo(this.tx(q2), this.ty(p2));
    ctx.strokeStyle = color;
    ctx.lineWidth = o.width || 1.6;
    ctx.setLineDash(o.dash || []);
    ctx.stroke();
    ctx.setLineDash([]);
    return this;
  };

  /* Lineas punteadas desde el punto (q,p) hasta ambos ejes, con punto */
  Plot.prototype.guide = function (q, p, color, o) {
    o = o || {};
    const c = color || C.muted;
    this.seg(q, 0, q, p, c, { dash: [4, 3], width: 1 });
    this.seg(0, p, q, p, c, { dash: [4, 3], width: 1 });
    if (o.dot !== false) this.dot(q, p, o.dotColor || C.txt);
    return this;
  };

  Plot.prototype.dot = function (q, p, color, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(this.tx(q), this.ty(p), r || 3.6, 0, Math.PI * 2);
    ctx.fillStyle = color || C.txt; ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.stroke();
    return this;
  };

  Plot.prototype.label = function (q, p, text, color, o) {
    o = o || {};
    const ctx = this.ctx;
    ctx.fillStyle = color || C.txt;
    ctx.font = o.font || (o.bold ? "600 " + FONT : FONT);
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.baseline || "alphabetic";
    const x = this.tx(q) + (o.dx || 0), y = this.ty(p) + (o.dy || 0);
    if (o.box) {
      const w = ctx.measureText(text).width;
      const bx = o.align === "center" ? x - w / 2 - 4 : o.align === "right" ? x - w - 4 : x - 4;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillRect(bx, y - 11, w + 8, 15);
      ctx.fillStyle = color || C.txt;
    }
    ctx.fillText(text, x, y);
    ctx.textBaseline = "alphabetic";
    return this;
  };

  /* Etiqueta de eje: valor sobre el eje P (izquierda) o Q (abajo).
     Tapa con blanco la marca automatica que quede debajo. */
  Plot.prototype.tickP = function (p, text, color) {
    const ctx = this.ctx, y = this.ty(p) + 4, x = this.pad.l - 6;
    ctx.font = "600 " + FONT;
    const w = ctx.measureText(text).width;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - w - 3, y - 12, w + 6, 15);
    ctx.fillStyle = color || C.txt;
    ctx.textAlign = "right";
    ctx.fillText(text, x, y);
    return this;
  };
  Plot.prototype.tickQ = function (q, text, color) {
    const ctx = this.ctx, y = this.pad.t + this.gH + 15, x = this.tx(q);
    ctx.font = "600 " + FONT;
    const w = ctx.measureText(text).width;
    ctx.fillStyle = "#fff";
    ctx.fillRect(x - w / 2 - 4, y - 11, w + 8, 15);
    ctx.fillStyle = color || C.txt;
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
    return this;
  };

  /* Flecha doble horizontal entre dos cantidades, a un precio dado.
     Se usa para escasez, sobreoferta y la cuna del impuesto. */
  Plot.prototype.spanH = function (q1, q2, p, text, color) {
    const ctx = this.ctx, y = this.ty(p);
    const x1 = this.tx(q1), x2 = this.tx(q2), c = color || C.txt;
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    [[x1, 1], [x2, -1]].forEach(([x, s]) => {
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + 6 * s, y - 3.5); ctx.lineTo(x + 6 * s, y + 3.5);
      ctx.closePath(); ctx.fill();
    });
    if (text) {
      ctx.font = FONT; ctx.textAlign = "center";
      const w = ctx.measureText(text).width;
      const mx = (x1 + x2) / 2;
      ctx.fillStyle = "#fff";
      ctx.fillRect(mx - w / 2 - 5, y - 9, w + 10, 16);
      ctx.strokeStyle = c; ctx.lineWidth = 1;
      ctx.strokeRect(mx - w / 2 - 5, y - 9, w + 10, 16);
      ctx.fillStyle = c;
      ctx.fillText(text, mx, y + 3);
    }
    return this;
  };

  /* Flecha doble vertical entre dos precios, a una cantidad dada. */
  Plot.prototype.spanV = function (p1, p2, q, text, color) {
    const ctx = this.ctx, x = this.tx(q);
    const y1 = this.ty(p1), y2 = this.ty(p2), c = color || C.txt;
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    [[y1, 1], [y2, -1]].forEach(([y, s]) => {
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x - 3.5, y + 6 * s); ctx.lineTo(x + 3.5, y + 6 * s);
      ctx.closePath(); ctx.fill();
    });
    if (text) {
      ctx.save();
      ctx.translate(x, (y1 + y2) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = FONT; ctx.textAlign = "center";
      const w = ctx.measureText(text).width;
      ctx.fillStyle = "#fff"; ctx.fillRect(-w / 2 - 5, -8, w + 10, 16);
      ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(-w / 2 - 5, -8, w + 10, 16);
      ctx.fillStyle = c; ctx.fillText(text, 0, 4);
      ctx.restore();
    }
    return this;
  };

  /* Rectangulo en coordenadas de mercado */
  Plot.prototype.rect = function (q1, p1, q2, p2, color, edge) {
    return this.area([[q1, p1], [q2, p1], [q2, p2], [q1, p2]], color, edge);
  };

  /* Escalera de demanda u oferta a partir de una lista de valores,
     un escalon por unidad. asc=true para oferta (costos crecientes). */
  Plot.prototype.steps = function (values, color, o) {
    o = o || {};
    const ctx = this.ctx, w = o.width || 2.4;
    const top = o.top === undefined ? this.maxP : o.top;
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.setLineDash(o.dash || []);
    ctx.beginPath();
    // tramo vertical inicial, desde el borde del grafico
    ctx.moveTo(this.tx(0), this.ty(o.asc ? 0 : top));
    ctx.lineTo(this.tx(0), this.ty(values[0]));
    values.forEach((v, i) => {
      ctx.lineTo(this.tx(i + 1), this.ty(v));
      if (i < values.length - 1) ctx.lineTo(this.tx(i + 1), this.ty(values[i + 1]));
    });
    // tramo vertical final
    ctx.lineTo(this.tx(values.length), this.ty(o.asc ? top : 0));
    ctx.stroke();
    ctx.setLineDash([]);
    return this;
  };

  /* Flecha doble bajo el eje X, en la fila `fila` (0, 1, 2 …).
     Sirve para los tramos de efecto sustitución y efecto ingreso. */
  Plot.prototype.spanBelow = function (q1, q2, fila, text, color) {
    const ctx = this.ctx, c = color || C.txt;
    const y = this.pad.t + this.gH + 26 + (fila || 0) * 17;
    const x1 = this.tx(q1), x2 = this.tx(q2);
    ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    // punta solo en el extremo de llegada, para que se lea la dirección
    const s = x2 >= x1 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x2, y); ctx.lineTo(x2 + 6 * s, y - 3.2); ctx.lineTo(x2 + 6 * s, y + 3.2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4); ctx.stroke();
    if (text) {
      ctx.font = FONT; ctx.textAlign = "left";
      ctx.fillText(text, Math.max(x1, x2) + 8, y + 3.5);
    }
    return this;
  };

  /* ---------- formato ---------- */
  const fmt = {
    n: (v, d) => (Math.abs(v) < 5e-3 ? 0 : v).toFixed(d === undefined ? 2 : d),
    money: v => "$" + Math.round(v).toLocaleString("es-CL"),
    pct: v => (100 * v).toFixed(0) + "%"
  };

  /* ---------- controles ---------- */

  /* Cablea sliders: para cada input[data-p] actualiza el estado y redibuja.
     El <span> con id "v-<p>" muestra el valor. */
  function bindSliders(state, render, format) {
    const inputs = document.querySelectorAll("input[type=range][data-p]");
    inputs.forEach(inp => {
      const key = inp.dataset.p;
      inp.value = state[key];
      inp.addEventListener("input", () => {
        state[key] = parseFloat(inp.value);
        syncLabels(state, format);
        render();
      });
    });
    syncLabels(state, format);
  }

  function syncLabels(state, format) {
    document.querySelectorAll("input[type=range][data-p]").forEach(inp => {
      const key = inp.dataset.p;
      const el = document.getElementById("v-" + key);
      if (el) el.textContent = format && format[key] ? format[key](state[key]) : state[key];
    });
  }

  /* Chips de capa: <button class="chip" data-layer="cs"> */
  function bindChips(layers, render) {
    document.querySelectorAll(".chip[data-layer]").forEach(btn => {
      const key = btn.dataset.layer;
      const paint = () => btn.classList.toggle("on", !!layers[key]);
      paint();
      btn.addEventListener("click", () => { layers[key] = !layers[key]; paint(); render(); });
    });
  }

  /* Pestanas: <button class="tab" data-tab="cuna">, estado en state[key] */
  function bindTabs(state, key, render) {
    const btns = document.querySelectorAll(".tab[data-tab]");
    const paint = () => btns.forEach(b =>
      b.classList.toggle("active", b.dataset.tab === state[key]));
    btns.forEach(b => b.addEventListener("click", () => {
      state[key] = b.dataset.tab; paint(); render();
    }));
    paint();
  }

  /* Escenarios precargados: <button data-preset="corto"> */
  function bindPresets(presets, state, render, format) {
    document.querySelectorAll("[data-preset]").forEach(b => {
      b.addEventListener("click", () => {
        Object.assign(state, presets[b.dataset.preset]);
        document.querySelectorAll("input[type=range][data-p]").forEach(i => {
          if (state[i.dataset.p] !== undefined) i.value = state[i.dataset.p];
        });
        document.querySelectorAll(".tab[data-tab]").forEach(t =>
          t.classList.toggle("active", t.dataset.tab === state.tab));
        document.querySelectorAll("[data-preset]").forEach(x =>
          x.classList.toggle("active", x === b));
        syncLabels(state, format);
        render();
      });
    });
  }

  /* Barra apilada de incidencia: pares [valor, color, etiqueta] */
  function stackBar(elId, parts) {
    const total = parts.reduce((s, p) => s + p[0], 0) || 1;
    document.getElementById(elId).innerHTML = parts.map(p =>
      '<span class="seg" style="width:' + (100 * p[0] / total).toFixed(1) +
      '%;background:' + p[1] + '">' +
      (100 * p[0] / total >= 12 ? p[2] + " " + (100 * p[0] / total).toFixed(0) + "%" : "") +
      '</span>').join("");
  }

  /* Reset + descarga PNG + redibujo al redimensionar. */
  function initTools(cfg) {
    const render = cfg.render;

    // Dentro del shell el titulo ya lo muestra la barra superior.
    if (window.parent !== window) document.body.classList.add("embedded");

    const reset = document.getElementById("btn-reset");
    if (reset) reset.addEventListener("click", () => {
      Object.assign(cfg.state, cfg.defaults);
      if (cfg.layers && cfg.layerDefaults) Object.assign(cfg.layers, cfg.layerDefaults);
      document.querySelectorAll("input[type=range][data-p]").forEach(inp => {
        if (cfg.state[inp.dataset.p] !== undefined) inp.value = cfg.state[inp.dataset.p];
      });
      document.querySelectorAll(".chip[data-layer]").forEach(b =>
        b.classList.toggle("on", !!(cfg.layers || {})[b.dataset.layer]));
      document.querySelectorAll(".tab[data-tab]").forEach(t =>
        t.classList.toggle("active", t.dataset.tab === cfg.state.tab));
      document.querySelectorAll("[data-preset]").forEach(x => x.classList.remove("active"));
      syncLabels(cfg.state, cfg.format);
      render();
    });

    const png = document.getElementById("btn-png");
    if (png) png.addEventListener("click", () => {
      const cv = document.getElementById(cfg.canvas);
      const a = document.createElement("a");
      a.download = (cfg.file || "grafico") + ".png";
      a.href = cv.toDataURL("image/png");
      a.click();
    });

    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(render, 120); });
    render();
  }

  global.ICS = { Plot, C, fmt, bindSliders, bindChips, bindTabs, bindPresets,
                 stackBar, initTools, syncLabels };
})(window);
