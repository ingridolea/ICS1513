/* ICS1513 — motor de teoría del consumidor.
   Familias de preferencias con su utilidad, su demanda marshalliana y sus
   curvas de indiferencia, más la descomposición de Slutsky.
   Todo sale de la misma función de utilidad: los módulos no inventan puntos. */

(function (global) {
  "use strict";

  const clamp0 = v => (v > 0 ? v : 0);

  /* Cada familia expone:
       U(x1,x2,par)              nivel de utilidad
       demanda(p1,p2,m,par)      elección óptima {x1,x2,esquina}
       curva(u,par,xmax)         puntos [[x1,x2],…] de la curva de indiferencia
       tms(x1,x2,par)            tasa marginal de sustitución (valor absoluto)
       texto                     rótulos para la interfaz                       */
  const FAM = {

    /* ---------- Cobb-Douglas: el caso de referencia ---------- */
    cobb: {
      id: "cobb",
      nombre: "Cobb-Douglas",
      formula: "U(x₁,x₂) = x₁^α · x₂^(1−α)",
      par: { alpha: 0.5 },
      slider: { clave: "alpha", rotulo: "α", min: 0.15, max: 0.85, paso: 0.05 },
      U: (x1, x2, p) => Math.pow(clamp0(x1), p.alpha) * Math.pow(clamp0(x2), 1 - p.alpha),
      tms: (x1, x2, p) => (p.alpha * x2) / ((1 - p.alpha) * x1),
      demanda: (p1, p2, m, p) => ({
        x1: p.alpha * m / p1,
        x2: (1 - p.alpha) * m / p2,
        esquina: false
      }),
      curva: (u, p, xmax) => {
        const pts = [];
        const a = p.alpha, desde = xmax / 400;
        for (let i = 0; i <= 400; i++) {
          const x1 = desde + (xmax - desde) * i / 400;
          pts.push([x1, Math.pow(u / Math.pow(x1, a), 1 / (1 - a))]);
        }
        return pts;
      },
      nota: "Con Cobb-Douglas el consumidor gasta siempre la fracción α de su ingreso en el bien 1, " +
            "así que la demanda es x₁* = α·m/p₁."
    },

    /* ---------- Cuasilineal: sin efecto ingreso sobre el bien 1 ---------- */
    cuasi: {
      id: "cuasi",
      nombre: "Cuasilineal",
      formula: "U(x₁,x₂) = 2k·√x₁ + x₂",
      par: { k: 3 },
      slider: { clave: "k", rotulo: "k", min: 1, max: 8, paso: 0.5 },
      U: (x1, x2, p) => 2 * p.k * Math.sqrt(clamp0(x1)) + x2,
      tms: (x1, x2, p) => p.k / Math.sqrt(x1),
      demanda: (p1, p2, m, p) => {
        // TMS = k/√x₁ = p₁/p₂  ⇒  x₁* = (k·p₂/p₁)², sin depender del ingreso
        let x1 = Math.pow(p.k * p2 / p1, 2);
        let x2 = (m - p1 * x1) / p2;
        if (x2 < 0) return { x1: m / p1, x2: 0, esquina: true };   // el ingreso no alcanza
        return { x1, x2, esquina: false };
      },
      curva: (u, p, xmax) => {
        const pts = [];
        for (let i = 0; i <= 400; i++) {
          const x1 = xmax * i / 400;
          pts.push([x1, u - 2 * p.k * Math.sqrt(x1)]);
        }
        return pts;
      },
      nota: "Con preferencias cuasilineales la demanda del bien 1 no depende del ingreso: " +
            "x₁* = (k·p₂/p₁)². Por eso su efecto ingreso es cero y todo el cambio es sustitución."
    },

    /* ---------- Sustitutos perfectos: solución de esquina ---------- */
    sust: {
      id: "sust",
      nombre: "Sustitutos perfectos",
      formula: "U(x₁,x₂) = α·x₁ + (1−α)·x₂",
      par: { alpha: 0.5 },
      slider: { clave: "alpha", rotulo: "α", min: 0.15, max: 0.85, paso: 0.05 },
      U: (x1, x2, p) => p.alpha * x1 + (1 - p.alpha) * x2,
      tms: (x1, x2, p) => p.alpha / (1 - p.alpha),
      demanda: (p1, p2, m, p) => {
        const a = p.alpha, b = 1 - p.alpha;
        if (a / p1 > b / p2 + 1e-12)  return { x1: m / p1, x2: 0, esquina: true };
        if (a / p1 < b / p2 - 1e-12)  return { x1: 0, x2: m / p2, esquina: true };
        return { x1: m / (2 * p1), x2: m / (2 * p2), esquina: false };  // indiferente
      },
      curva: (u, p, xmax) => {
        const a = p.alpha, b = 1 - p.alpha;
        return [[0, u / b], [u / a, 0]];
      },
      nota: "Con sustitutos perfectos el consumidor gasta todo en el bien con mayor utilidad " +
            "marginal por peso: compara α/p₁ con (1−α)/p₂."
    },

    /* ---------- Complementos perfectos: siempre en la diagonal ---------- */
    compl: {
      id: "compl",
      nombre: "Complementos perfectos",
      formula: "U(x₁,x₂) = mín{x₁, x₂}",
      par: {},
      slider: null,
      U: (x1, x2) => Math.min(x1, x2),
      tms: () => NaN,
      demanda: (p1, p2, m) => {
        const x = m / (p1 + p2);
        return { x1: x, x2: x, esquina: false };
      },
      curva: (u, p, xmax) => [[u, xmax * 4], [u, u], [xmax * 4, u]],
      nota: "Con complementos perfectos los bienes se consumen juntos: x₁ = x₂ = m/(p₁+p₂), " +
            "como si el consumidor comprara un solo bien de precio p₁+p₂."
    },

    /* ---------- Stone-Geary: bien 1 de primera necesidad ---------- */
    geary: {
      id: "geary",
      nombre: "Necesidad (Stone-Geary)",
      formula: "U(x₁,x₂) = (x₁ − γ)^α · x₂^(1−α)",
      par: { alpha: 0.4, gamma: 8 },
      slider: { clave: "gamma", rotulo: "γ (consumo de subsistencia)", min: 0, max: 20, paso: 1 },
      U: (x1, x2, p) => Math.pow(clamp0(x1 - p.gamma), p.alpha) * Math.pow(clamp0(x2), 1 - p.alpha),
      tms: (x1, x2, p) => (p.alpha * x2) / ((1 - p.alpha) * (x1 - p.gamma)),
      demanda: (p1, p2, m, p) => {
        const sobra = m - p1 * p.gamma;                   // lo que queda tras la subsistencia
        if (sobra <= 0) return { x1: m / p1, x2: 0, esquina: true };
        return {
          x1: p.gamma + p.alpha * sobra / p1,
          x2: (1 - p.alpha) * sobra / p2,
          esquina: false
        };
      },
      curva: (u, p, xmax) => {
        const pts = [], a = p.alpha, g = p.gamma;
        for (let i = 0; i <= 400; i++) {
          const x1 = g + (xmax - g) * (i + 0.5) / 400;
          if (x1 <= g) continue;
          pts.push([x1, Math.pow(u / Math.pow(x1 - g, a), 1 / (1 - a))]);
        }
        return pts;
      },
      nota: "El consumidor cubre primero γ unidades del bien 1 y reparte el resto. " +
            "La demanda x₁* = γ + α(m − p₁γ)/p₁ crece con el ingreso, pero menos que proporcionalmente: " +
            "es un bien normal de primera necesidad."
    }
  };

  /* Elección óptima */
  function optimo(fam, p1, p2, m, par) {
    const f = FAM[fam];
    const d = f.demanda(p1, p2, m, Object.assign({}, f.par, par));
    d.u = f.U(d.x1, d.x2, Object.assign({}, f.par, par));
    return d;
  }

  /* Descomposición de Slutsky tal como la define la lámina:
     la renta compensada m′ deja la cesta ORIGINAL justo alcanzable,
       m′ = m + x₁·(p₁′ − p₁)
     de modo que la recta pivotada pasa por X. */
  function slutsky(fam, p1, p1b, p2, m, par) {
    const X = optimo(fam, p1,  p2, m, par);
    const mPrima = m + X.x1 * (p1b - p1);
    const Y = optimo(fam, p1b, p2, mPrima, par);   // sobre la recta pivotada
    const Z = optimo(fam, p1b, p2, m, par);        // sobre la recta final
    return {
      X, Y, Z, mPrima,
      sust:   Y.x1 - X.x1,      // Δx₁ˢ
      ingreso: Z.x1 - Y.x1,     // Δx₁ⁿ
      total:  Z.x1 - X.x1       // Δx₁
    };
  }

  /* Dibuja una curva de indiferencia recortada al área visible */
  function dibujarCurva(plot, fam, u, par, color, opts) {
    const f = FAM[fam];
    const p = Object.assign({}, f.par, par);
    const pts = f.curva(u, p, plot.maxQ)
      .filter(pt => isFinite(pt[1]) && pt[1] >= -plot.maxP * 0.05 && pt[1] <= plot.maxP * 3);
    plot.poly(pts, color, opts || { width: 1.8 });
    return pts;
  }

  /* Recta presupuestaria p₁x₁ + p₂x₂ = m */
  function recta(plot, p1, p2, m, color, opts) {
    plot.seg(0, m / p2, m / p1, 0, color, opts || { width: 2.2 });
  }

  /* Lista para poblar un <select> de familias */
  const LISTA = ["cobb", "cuasi", "sust", "compl", "geary"];

  global.Consumo = { FAM, LISTA, optimo, slutsky, dibujarCurva, recta };
})(window);
