# AI Safety Landscape — Platanus Hack 26 (Team 22)

**Track**: AI Safety · **Output**: dossier de research para decidir qué construir · **Fecha**: 2026-05-09

> Este documento sintetiza papers (`papers.md`), portfolio YC (`yc-ai-safety.csv`) y mapa LATAM (`latam-ai-safety.csv`) en un brief estratégico con oportunidades concretas para 48h de hack.

> **Decisión del equipo (2026-05-09)**: arrancamos con una **variante de la Idea C**, focalizada en **firewall de Claude Code corporativo** para prevenir data exfiltration (credenciales, PII, código propietario, paths internos). Diferenciadores vs ProxyShield genérico:
> - Punto de integración específico (`ANTHROPIC_BASE_URL` de Claude Code), no proxy genérico de LLMs.
> - Cascada Regex → Pattern → Haiku judge con <200 ms overhead (no solo classifier).
> - Admin **no técnico** con visual rule builder no-code.
> - AI Suggestor (Layer 4) que aprende de logs y propone reglas nuevas para approval humana.
>
> La narrativa de mercado (regulación LATAM + dolor en empresas con coding assistants) se mantiene; la implementación se concentra en un único surface area (Claude Code) para que la demo de 3 min sea contundente. Ver `../specs/00-constitution.md` para la visión completa.

---

## TL;DR (5 bullets)

1. **YC está fondeando AI Safety en serio** — al menos 6 startups en W26 (General Analysis, Casco, Mount, Salus, Cascade, Fenrock) y al menos 4 en W25/S25 (Confident AI, Asteroid, Parachute, Bounti). El subárea con más deal flow es **runtime guardrails para agentes** + **red teaming automatizado**.
2. **El frente técnico se movió de jailbreaks de chat → ataques a agentes con tool use**. Papers 2025-2026 muestran ASR > 90% contra GPT-4o y modelos top, y >85% de prompt injections contra coding agents comprometen al menos una plataforma mayor.
3. **El hueco de safety multilingüe está documentado y vacío**: >90% de la literatura es en inglés, los pocos benchmarks "multilingual" traducen prompts (no capturan daño nativo), y XL-SafetyBench (state-of-the-art) **no incluye portugués ni un país LATAM**.
4. **LATAM ya tiene un competidor fuerte (GuardionAI)** — runtime AI firewall fundado por ex-Apple Siri, deployado en fintechs LATAM, LGPD-ready. El espacio "AI firewall genérico" está cerrándose. La diferenciación viable: **vertical (sector específico)** + **regulatorio (compliance LATAM)** + **idioma (PT-BR / es regional)**.
5. **La regulación LATAM 2025-2026 está creando mercado**: Brasil PL 2338 (en Cámara desde abril 2025, risk-based, AIA obligatorio para alto riesgo), Argentina S-0071/2025 (registro nacional + impact assessments), México CONAIA (autorización de alto riesgo), Chile + Colombia avanzando. **Cada ley genera demanda inmediata por evidencia de safety auditable**.

---

## 1. Estado del arte (papers)

Top 3 técnicas más activas en research 2025-2026 (ver `papers.md` para detalle):

| Técnica | Madurez | ASR / efectividad | Oportunidad |
|---|---|---|---|
| **Automated red teaming agente-vs-agente** (J2, JBFuzz, autonomous reasoning models) | Alta — varios papers con código | 93-99% ASR contra modelos top | Construir herramienta abierta que ingiera modelo open-source y devuelva report tipo "AI pen-test" |
| **Defensas runtime para agentes con tools** (ARGUS, SPIN, PromptGuard, DefensiveTokens) | Media — diversidad de enfoques, ninguno domina | 85-88% reducción de attack success | Wrapper que se integre a frameworks de agentes que se usan en LATAM (LangChain, LangGraph, llama-index) |
| **Multilingual + culturally-grounded safety** (ML-Bench&Guard, XL-SafetyBench, LinguaSafe) | Baja — gap explícito | Modelos locales muestran 81% correlación negativa entre ASR y NSR (safety = falla de generación) | **Benchmark nativo LATAM con prompts españoles/portugueses construidos desde leyes locales** — único en el mundo |

---

## 2. Mercado validado (YC)

**Patrón claro en los últimos 3 batches** (ver `yc-ai-safety.csv`):

- **Runtime guardrails / agent supervision**: Salus, Cascade, Asteroid → la urgencia es proteger agentes en producción.
- **Red teaming as a service**: General Analysis, Casco, Mount, Bounti → empresas pagan por automated pen-tests sobre sus modelos.
- **Eval / observability**: Confident AI (DeepEval, 700k evals/día), Atla → la vara es: pruebas reproducibles, métricas confiables.
- **Vertical compliance**: Parachute (clinical AI), Fenrock (financial crime AML) → el playbook 2026 es "AI Safety + sector regulado". YC valida que enterprises pagan más por compliance sectorial que por horizontal genérico.

**Implicancia**: la oportunidad ya no es "guardrails genéricos" (mercado saturado en EEUU). Es **guardrails verticales** + **evidencia auditable para regulador**.

---

## 3. Realidad LATAM

### Regulación que crea mercado *ahora*

| País | Estado | Obligación que genera demanda |
|---|---|---|
| **Brasil** | PL 2338/2023 — Senate Dec 2024, Chamber especial committee desde abril 2025 | Self-classification de riesgo + Algorithmic Impact Assessment para alto riesgo + supervisión humana obligatoria |
| **Argentina** | S-0071/2025 (Senado, marzo 2025) + propuesta empresas IA sin empleados (mayo 2026) | Registro Nacional de Sistemas IA + impact assessments + clasificación riesgo (mín/limit/alto/inaceptable) |
| **México** | Federal Law Initiative (abril 2025) | CONAIA autoriza sistemas de alto riesgo — requiere documentación de safety/fairness/accountability |
| **Chile** | Bill en Comité Futuro/Ciencia/Tech desde 2024 | Principles-based, accountability + transparencia |
| **Colombia** | Draft AI bill EU-inspired | CON-IA + clasificación de riesgo + sandboxes regulatorios |

**Lectura**: 5 países, 5 leyes risk-based en simultáneo, ninguna armonizada entre sí. Toda empresa LATAM con LLM en producción va a necesitar **documentación específica por país** en los próximos 12-18 meses.

### Ecosistema startup LATAM (oferta actual)

- **GuardionAI** (Brasil) — el player dominante en runtime safety. Ex-Apple Siri, en producción en fintechs LATAM, LGPD compliant. **No competir cabeza-a-cabeza.**
- **Hackmetrix, hunterstack.io** — security compliance generalistas (no AI-native). Adyacentes pero no competidores directos.
- **Resto**: vacío. No encontramos startups LATAM dedicadas a (a) red teaming automatizado, (b) eval/observability AI-native, (c) compliance documental específica para PL 2338 / S-0071, (d) safety en español/portugués.

### Talento y comunidad

- **BAISH** (Buenos Aires AI Safety Hub) — curso 30h, workshops, paper presentations. Pipeline activa.
- **Venten** — newsletter de AI Safety LATAM (autor de UBA).
- **AI Safety Latam (Boske)** — curso BA con 14 inscritos.
- **Brain drain documentado**: Agustín Martínez (UBA PhD) → Oxford. Quote textual del ecosistema: *"we are just starting to build it"*.
- **Implicancia**: hay talento técnico real en BA, pero **no hay producto local** que retenga ese talento. Un hack ganador puede ser semilla de la primera empresa que cierra ese loop.

### Casos de uso locales con dolor real

| Sector | Dolor concreto | Quién paga |
|---|---|---|
| Fintech / banking LATAM | LLMs en KYC, AML, sanction screening multilingual. Compliance LGPD/Argentina/CNBV/SuperFin. | Mercado Pago, Nubank, Ualá, Mercado Libre, Banco Inter, Galicia, BBVA México |
| Retail con agentes en español | Prompt injection en customer support agents, voice agents en es-AR/MX/CO | E-commerce regional (Mercado Libre, Falabella, Magazine Luiza) |
| Gobierno y servicios públicos | Argentina anunció unidad de IA para predicción de crímenes — riesgo de bias y abuso documentado | Sector público |
| Healthtech | Asistentes clínicos en es/pt, regulación local + LGPD para datos médicos | Hospital Italiano, Albert Einstein BR, etc. |

---

## 4. Oportunidades para el hack (decisión equipo)

Cinco ideas concretas, ordenadas de **más diferenciada / defendible** a **más rápida de prototipar**.

### Idea A — *RegBench LATAM*: benchmark de safety construido desde la ley local
**Problema**: no existe ningún benchmark de safety que use las leyes LATAM (PL 2338, S-0071/2025, México CONAIA) como ground truth de "qué considera el regulador local que es daño".

**Inspiración**: ML-Bench&Guard (arXiv 2605.00689) hace esto para 14 idiomas pero ninguno LATAM.

**Demo en 48h**:
- Tomar PL 2338 (Brasil) y S-0071/2025 (Argentina) → extraer categorías de riesgo y prácticas prohibidas
- Generar 200-500 prompts adversariales en pt-BR y es-AR usando esas categorías
- Correr eval contra GPT-4o, Claude, Gemini, Llama, modelos LATAM (Maritaca, Tucano)
- Frontend: leaderboard tipo Open LLM Leaderboard pero filtrable por jurisdicción

**Por qué LATAM tiene ventaja**: solo equipos que entienden las leyes locales en el idioma original pueden construirlo bien. Player global tendría que contratar abogados LATAM.

**Tracción potencial**: GuardionAI, fintechs LATAM, equipos de compliance lo necesitarían como input. Posible distribución vía partnership con BAISH o universidades.

**Riesgos**: requiere lectura legal cuidadosa; resultado depende de calidad de prompts.

---

### Idea B — *AIA-as-Code*: generador de Algorithmic Impact Assessment automatizado
**Problema**: PL 2338 (Brasil) y S-0071/2025 (Argentina) requieren Algorithmic Impact Assessments para sistemas de alto riesgo. Hoy las empresas los hacen manualmente con consultoras → caro, lento, no reproducible.

**Demo en 48h**:
- CLI que recibe (a) descripción del sistema IA, (b) modelo en uso, (c) sector
- Genera AIA template pre-llenado mapeando a artículos específicos de PL 2338 / S-0071
- Corre red teaming automático básico (HarmBench / un subset propio en es-AR/pt-BR)
- Output: PDF firmable con evidencia de safety + categorización de riesgo según ley local

**Por qué LATAM tiene ventaja**: el modelo regulatorio es local; las consultoras tradicionales no escalan; las plataformas globales (Credo AI, Holistic AI) no soportan PL 2338.

**Tracción potencial**: cualquier empresa LATAM con LLM en producción + mid-market que no puede pagar consultora.

**Riesgos**: validez legal del documento generado — pivotear a "borrador para abogados" en lugar de documento final.

---

### Idea C — *ProxyShield LATAM*: gateway de prompt injection defense con auditoría LGPD/Habeas Data
**Problema**: ARGUS y SPIN (papers 2026) muestran que prompt injection defense funciona, pero no hay producto LATAM-friendly que combine defensa runtime + log auditable + cumplimiento de leyes de datos locales (LGPD, Habeas Data Argentina, LFPDPPP México).

**Demo en 48h**:
- Reverse proxy (Cloudflare Worker / Vercel Edge) entre app y proveedor LLM
- Detección de prompt injection con classifier + reglas de policy en es/pt
- Logs auditables firmados con timestamp, geo-localizables (compliance data residency LATAM)
- Dashboard básico: ataques bloqueados, cumplimiento por país

**Por qué LATAM tiene ventaja**: GuardionAI no se foca en data residency local. Un proxy que **garantiza que los logs nunca salen del país** es vendible directamente a banco/gobierno.

**Riesgos**: GuardionAI puede agregar este feature; diferenciar por verticalización (ej. solo banking AR).

---

### Idea D — *AgentRedteam-AR*: red teaming automatizado de agentes en español
**Problema**: J2 (paper 2502.09638) muestra que se puede convertir un LLM en red-teamer; los papers de prompt injection en agentic coding (2601.17548) muestran 85%+ de éxito contra plataformas top. Pero **todo está en inglés**.

**Demo en 48h**:
- Tomar agente de un cliente (LangChain / LangGraph) en es-AR
- Pipeline que genera ataques adaptados a contexto cultural argentino (jerga, modismos, contexto local)
- Reporte tipo "OWASP for AI agents" con vulnerabilidades específicas

**Por qué LATAM tiene ventaja**: customer support agents y voice bots en LATAM son masivos (Mercado Libre, Falabella) y atacables en español. Players globales no priorizan español.

**Riesgos**: muy similar a lo que General Analysis y Casco hacen — diferenciar por idioma + sector.

---

### Idea E — *SafeHub LATAM*: marketplace de evals abiertos para modelos locales
**Problema**: Maritaca (Sabiá), Tucano, modelos LATAM open source no tienen evals confiables de safety. Los frontier benchmarks no aplican (XL-SafetyBench no incluye PT-BR).

**Demo en 48h**:
- HF Space con leaderboard de modelos LATAM evaluados con (a) HarmBench traducido, (b) prompts adversariales propios, (c) categorías regulatorias LATAM
- Permitir submission de nuevos modelos con eval automático

**Por qué LATAM tiene ventaja**: integrarse al ecosistema Hugging Face donde Maritaca/Tucano ya viven; comunidad académica BAISH/Venten distribuye.

**Riesgos**: low monetization path inicial — pivotear a partnership con Maritaca o gobierno.

---

## 5. Recomendación

Si el equipo quiere **máxima diferenciación + posibilidad de levantar capital después del hack**, la Idea A (RegBench LATAM) es la más defendible: combina los tres gaps confirmados (papers, mercado, regulación) en algo único en el mundo.

Si el equipo quiere **demo más impactante visualmente**, la Idea D (AgentRedteam-AR) genera videos donde un agente real es jailbreakeado en español → fácil de viralizar.

Si el equipo quiere **path comercial más corto**, la Idea B (AIA-as-Code) ya tiene compradores identificables (cualquier empresa LATAM con LLM en producción que enfrenta PL 2338 o S-0071 en el próximo año).

---

## Fuentes

**Papers**: arXiv (2502.09638, 2602.10453, 2601.17548, 2605.03378, 2605.00689, 2605.05662), ACL 2025 (M2S), Nature Communications 2026, Nature Scientific Reports 2025 (PromptGuard).

**YC**: ycombinator.com/companies/general-analysis, /casco, /confident-ai, /atla; tldl.io batch breakdowns; extruct.ai data rooms; thevccorner.com W26 database.

**LATAM regulación**: PL 2338/2023 (sidi.org.br, leonardi.adv.br), S-0071/2025 Senado AR, Mexico CONAIA bill, Chile Comité Futuro proposal, Colombia AI bill (whitecase.com, fpf.org).

**LATAM ecosistema**: guardion.ai, hackmetrix.com, hunterstack.io, baish.com.ar, venten.substack.com, restofworld.org (brain drain article).
