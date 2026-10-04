/* ICS1513 — motor de teoría del productor.
   Familias de funciones de producción con sus productividades, isocuantas,
   minimización de costos y funciones de costo de corto y largo plazo.
   Mismo criterio que consumo.js: los módulos escriben economía, no geometría. */

(function (global) {
  "use strict";

  const pos = v => (v > 0 ? v : 0);

  /* Cada familia expone:
       f(k,l,p)              nivel de producción
       pmK / pmL             productividades marginales
       tst(k,l,p)            tasa marginal de sustitución técnica, PM_k / PM_l
       isocuanta(q,p,kmax)   puntos [[k,l],…] de la isocuanta de nivel q
       minimiza(r,w,q,p)     {k,l,C} que minimizan el costo de producir q
       escala(p)             suma de elasticidades: >1, =1 o <1
       lCorto(q,k1,p)        trabajo necesario con el capital fijo en k1      */
  const FP = {

    /* ---------- Cobb-Douglas: f = A·kᵃ·lᵇ ---------- */
    cobb: {
      id: "cobb",
      nombre: "Cobb-Douglas",
      formula: "f(k,l) = A · k^a · l^b",
      par: { A: 1, a: 0.5, b: 0.5 },
      f: (k, l, p) => p.A * Math.pow(pos(k), p.a) * Math.pow(pos(l), p.b),
      pmK: (k, l, p) => p.A * p.a * Math.pow(pos(k), p.a - 1) * Math.pow(pos(l), p.b),
      pmL: (k, l, p) => p.A * p.b * Math.pow(pos(k), p.a) * Math.pow(pos(l), p.b - 1),
      tst: (k, l, p) => (p.a * l) / (p.b * k),
      isocuanta: (q, p, kmax) => {
        const pts = [], desde = kmax / 500;
        for (let i = 0; i <= 500; i++) {
          const k = desde + (kmax - desde) * i / 500;
          pts.push([k, Math.pow(q / (p.A * Math.pow(k, p.a)), 1 / p.b)]);
        }
        return pts;
      },
      minimiza: (r, w, q, p) => {
        // TST = r/w  ⇒  l = (b·r/(a·w))·k, y se reemplaza en la isocuanta
        const razon = (p.b * r) / (p.a * w);
        const k = Math.pow(q / (p.A * Math.pow(razon, p.b)), 1 / (p.a + p.b));
        const l = razon * k;
        return { k, l, C: r * k + w * l, esquina: false };
      },
      escala: p => p.a + p.b,
      lCorto: (q, k1, p) => Math.pow(q / (p.A * Math.pow(k1, p.a)), 1 / p.b),
      nota: "Con Cobb-Douglas la suma a + b decide los retornos a escala: si vale 1 son constantes, " +
            "si supera 1 son crecientes y si queda bajo 1 son decrecientes."
    },

    /* ---------- Proporciones fijas: f = A·mín{k/a, l/b} ---------- */
    fijas: {
      id: "fijas",
      nombre: "Proporciones fijas",
      formula: "f(k,l) = A · mín{k/a, l/b}",
      par: { A: 1, a: 1, b: 1 },
      f: (k, l, p) => p.A * Math.min(pos(k) / p.a, pos(l) / p.b),
      pmK: () => NaN, pmL: () => NaN,
      tst: () => NaN,
      isocuanta: (q, p, kmax) => {
        const kv = p.a * q / p.A, lv = p.b * q / p.A;
        return [[kv, kmax * 6], [kv, lv], [kmax * 6, lv]];
      },
      minimiza: (r, w, q, p) => {
        const k = p.a * q / p.A, l = p.b * q / p.A;
        return { k, l, C: r * k + w * l, esquina: false };
      },
      escala: () => 1,
      lCorto: (q, k1, p) => (p.A * k1 / p.a >= q ? p.b * q / p.A : Infinity),
      nota: "Con proporciones fijas los factores se usan en una receta rígida: sobrar de uno no aporta nada. " +
            "No hay sustitución posible, así que la TST no está definida en el vértice."
    },

    /* ---------- Lineal (sustitutos perfectos): f = A·(a·k + b·l) ---------- */
    lineal: {
      id: "lineal",
      nombre: "Factores sustitutos",
      formula: "f(k,l) = A · (a·k + b·l)",
      par: { A: 1, a: 1, b: 1 },
      f: (k, l, p) => p.A * (p.a * pos(k) + p.b * pos(l)),
      pmK: (k, l, p) => p.A * p.a,
      pmL: (k, l, p) => p.A * p.b,
      tst: (k, l, p) => p.a / p.b,
      isocuanta: (q, p, kmax) => [[0, q / (p.A * p.b)], [q / (p.A * p.a), 0]],
      minimiza: (r, w, q, p) => {
        // se usa solo el factor con mayor producto marginal por peso
        const porPesoK = p.A * p.a / r, porPesoL = p.A * p.b / w;
        if (porPesoK > porPesoL + 1e-12)
          return { k: q / (p.A * p.a), l: 0, C: r * q / (p.A * p.a), esquina: true };
        if (porPesoL > porPesoK + 1e-12)
          return { k: 0, l: q / (p.A * p.b), C: w * q / (p.A * p.b), esquina: true };
        const k = q / (2 * p.A * p.a), l = q / (2 * p.A * p.b);
        return { k, l, C: r * k + w * l, esquina: false };
      },
      escala: () => 1,
      lCorto: (q, k1, p) => (q / p.A - p.a * k1) / p.b,
      nota: "Con factores perfectamente sustituibles la empresa usa solo el que rinde más por peso gastado: " +
            "compara A·a/r con A·b/w. La isocuanta es una recta y la TST es constante."
    }
  };

  /* Productividad media y marginal del capital, con el trabajo fijo en lBarra */
  function productividades(fam, k, lBarra, par) {
    const f = FP[fam], p = Object.assign({}, f.par, par);
    const q = f.f(k, lBarra, p);
    return { q, pm: f.pmK(k, lBarra, p), pme: k > 0 ? q / k : NaN };
  }

  /* Costo de corto plazo con el capital fijo en k1 */
  function costoCorto(fam, r, w, q, k1, par) {
    const f = FP[fam], p = Object.assign({}, f.par, par);
    const l = f.lCorto(q, k1, p);
    const CF = r * k1, CV = w * l;
    return { l, CF, CV, C: CF + CV };
  }

  /* Costo de largo plazo: la empresa también elige el capital */
  function costoLargo(fam, r, w, q, par) {
    const f = FP[fam], p = Object.assign({}, f.par, par);
    return f.minimiza(r, w, q, p);
  }

  /* Nivel de capital que hace del corto plazo un punto de la envolvente */
  function capitalOptimo(fam, r, w, q, par) {
    return costoLargo(fam, r, w, q, par).k;
  }

  function dibujarIsocuanta(plot, fam, q, par, color, opts) {
    const f = FP[fam], p = Object.assign({}, f.par, par);
    const pts = f.isocuanta(q, p, plot.maxQ)
      .filter(pt => isFinite(pt[1]) && pt[1] >= -plot.maxP * 0.05 && pt[1] <= plot.maxP * 4);
    plot.poly(pts, color, opts || { width: 1.8 });
    return pts;
  }

  /* Recta de isocosto r·k + w·l = C */
  function isocosto(plot, r, w, C, color, opts) {
    plot.seg(0, C / w, C / r, 0, color, opts || { width: 2.2 });
  }

  const LISTA = ["cobb", "fijas", "lineal"];

  global.Produccion = {
    FP, LISTA, productividades, costoCorto, costoLargo, capitalOptimo,
    dibujarIsocuanta, isocosto
  };
})(window);
