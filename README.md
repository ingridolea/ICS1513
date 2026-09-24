# ICS1513 — Apps interactivas

Gráficos interactivos para **Introducción a la Economía** (ICS1513, Ingeniería UC).
Publicado en <https://ingridolea.github.io/ICS1513/>

Cada módulo es un gráfico con sliders que recalcula áreas, excedentes y tablas en vivo,
para proyectar en clase en vez de mostrar la lámina estática.

## Estructura

```
index.html          Shell: menú lateral, modo presentación, ancla en la URL
apps/shared.css     Estilos comunes
apps/shared.js      Plot: dibuja en coordenadas de mercado (Q, P), no en píxeles
apps/consumo.js     Motor de teoría del consumidor: familias de preferencias,
                    demandas marshallianas y descomposición de Slutsky
apps/mNN.html       Un módulo por archivo
ics1513_apps.html   Versión anterior, intacta, para los links ya repartidos
```

Sitio estático puro: sin build, sin dependencias, sin backend.

## Módulos

**Eficiencia de mercado** (clase del 01-09-2026)

| | Módulo | Qué hace |
|---|---|---|
| M1 | Demanda escalonada y disposición a pagar | Las 4 compradoras del ejemplo Madonna; subasta o precio dado |
| M2 | De la escalera a la curva continua | De 4 a 200 compradores: por qué aparece la integral |
| M3 | Variación del EC: rectángulo R y triángulo T | Pérdida por mayor costo y por menor consumo |
| M4 | Cálculo de ΔEC con demanda lineal | La integral desarrollada en vivo |
| M5 | Oferta escalonada y costo de oportunidad | Los 4 pintores; licitación o precio dado |
| M6 | EP continuo y su variación | Ganancia por mayor precio y por más comercio |
| M7 | Equilibrio, EC + EP y excedente total | El gráfico base del resto |
| M8 | ¿Por qué el equilibrio es eficiente? | Forzar Q ≠ Q* y ver la pérdida aparecer |

**Control de precios, impuestos y subsidios** (clase del 03-09-2026)

| | Módulo | Qué hace |
|---|---|---|
| M9 | Techo de precios | Escasez, bienestar, arriendos a corto y largo plazo |
| M10 | Precio mínimo y salario mínimo | Sobreoferta, desempleo, sueldo mínimo chileno |
| M11 | Incidencia y método de la cuña | Tres pestañas con el mismo resultado |
| M12 | Elasticidad e incidencia tributaria | Quién carga con el impuesto, e impuesto a la renta |
| M13 | Bienestar con impuesto | Áreas A–F con la tabla de la lámina |
| M14 | Tamaño del impuesto y curva de Laffer | Mercado y trayectorias de bienestar según t |
| M15 | Subsidio: excedentes y gasto fiscal | La cuña al revés; el excedente total cae igual |
| M16 | Ejercicio propuesto no lineal | Qs = √(10P) − 1, Qd = (100 − P)/P, con solución |

**Comercio internacional** (Tema 08)

| | Módulo | Qué hace |
|---|---|---|
| M19 | País exportador e importador | Precio mundial, flujos de comercio, quién gana y quién pierde |
| M20 | Aranceles de importación | Áreas A–G, recaudación y los dos triángulos de pérdida social |

**Sistema tributario** (Tema 09)

| | Módulo | Qué hace |
|---|---|---|
| M21 | Progresividad y regresividad | Tasa efectiva por nivel de ingreso, más la composición real de la recaudación chilena |

**Decisiones del consumidor** (Tema 10)

| | Módulo | Qué hace |
|---|---|---|
| M22 | Curvas de indiferencia y TMS | Cinco familias de preferencias, con tangente y conjunto preferido |
| M23 | Restricción presupuestaria | Pendiente −p₁/p₂, racionamiento, impuesto al exceso y subsidio |
| M24 | Elección óptima | Tangencia TMS = p₁/p₂ y utilidad marginal por peso gastado |
| M25 | Demanda marshalliana | De la cesta óptima a la curva de demanda, vía la curva de oferta-precio |
| M26 | Cambios en el ingreso y curva de Engel | Renta-consumo, elasticidad ingreso, bienes de necesidad |
| M27 | Efecto sustitución, efecto ingreso y Slutsky | X → Y → Z con recta pivotada; demanda compensada frente a la marshalliana |
| M28 | Bienes normales, inferiores y Giffen | Qué pasa cuando el efecto ingreso se come al de sustitución |
| M29 | Ejercicio de descomposición | x₁* = 10 + m/(10p₁), con p₁ de 1 a 0,8 y solución paso a paso |

**Economía del comportamiento** (Tema 11)

| | Módulo | Qué hace |
|---|---|---|
| M30 | Efecto de presentación | El dilema de la enfermedad: elige, revela y compara |

**Fallas de mercado** (módulos previos del repo)

| | Módulo |
|---|---|
| M17 | Monopolio: excedentes y bienestar |
| M18 | Oligopolio: cártel, desvío y Nash |

## Uso en clase

- **Modo presentación** (botón arriba a la derecha) oculta el menú y agranda el gráfico. Se sale con `Esc`.
- **← →** saltan al módulo anterior o siguiente.
- Cada módulo tiene **Reiniciar** y **Descargar PNG**.
- La URL lleva el ancla del módulo, por ejemplo
  `ingridolea.github.io/ICS1513/#m13`, para enlazar desde una diapositiva.

## Una nota sobre el módulo de Slutsky

M27 usa la compensación **de Slutsky**, no la de Hicks: la renta compensada m′ = m + x₁(p₁′ − p₁)
deja alcanzable la cesta *original*, que es exactamente como lo plantea la lámina del curso.
Por eso la recta pivotada pasa por X y el punto Y queda en una curva de indiferencia distinta
de la de X. Todo se deriva de la función de utilidad de cada familia: los puntos no están puestos a mano.

## Convenciones de color

Cromo morado heredado del repo; curvas y áreas siguen las diapositivas del curso:
demanda azul, oferta verde, línea de política roja, excedente del consumidor naranjo,
excedente del productor verde, recaudación celeste, pérdida social roja.
Se definen todas en `apps/shared.css`.
