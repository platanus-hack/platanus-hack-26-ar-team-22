# Tranquera

> *Un paso controlado entre la intención y la respuesta.*

**Track**: AI Safety — Platanus Hack 26 · Buenos Aires · Team 22

---

## El problema de alineamiento en AI corporativo

Los avances en alineamiento de modelos de lenguaje resuelven el problema a nivel de entrenamiento: cómo lograr que el modelo no produzca respuestas dañinas, sesgadas o fuera de los valores del proveedor. Ese trabajo es fundamental y está razonablemente bien estudiado.

Pero hay una capa de alineamiento que los proveedores de modelos **no pueden resolver solos**: el alineamiento del comportamiento del agente con las políticas específicas de cada organización que lo despliega.

Cuando una empresa le da Claude Code a sus desarrolladores, el modelo está correctamente alineado con los valores de Anthropic. Pero no está alineado con las políticas de esa empresa: no sabe qué información es confidencial para ese cliente, qué datos son sensibles según las regulaciones locales, qué patrones de respuesta están fuera del marco operativo del equipo de seguridad interno.

El resultado es una **brecha de alineamiento organizacional**: el agente actúa con buena intención desde la perspectiva del proveedor, pero opera fuera de los límites que la organización deployer necesita imponer. Sin intervención, un desarrollador puede inadvertidamente exfiltrar credenciales, datos de clientes, o código propietario — no porque el modelo tenga malas intenciones, sino porque nadie le especificó los límites de esa organización.

---

## Qué es Tranquera

Tranquera es una capa de enforcement de alineamiento organizacional para agentes AI, empezando por Claude Code. Es un proxy modificable que se interpone entre el agente y el modelo:

```
Claude Code (dev) → Tranquera (proxy) → Anthropic API
```

La empresa configura `ANTHROPIC_BASE_URL` apuntando al interceptor. Desde ese momento, cada prompt que el agente envía pasa primero por las políticas de la organización, sin necesidad de modificar el modelo, el cliente ni la máquina del desarrollador.

El objetivo no es restringir la utilidad del agente — es permitirle operar dentro de los límites que la organización necesita, de forma transparente, auditable y sin fricción para el desarrollador con buena intención.

---

## Tres mecanismos de alineamiento

### 1. Especificación de políticas en lenguaje natural

La brecha de alineamiento organizacional existe en parte porque especificar límites de comportamiento requería saber programar regex o escribir código. Tranquera invierte esto: un compliance officer puede definir una política escribiendo "no menciones nombres de clientes" y el sistema la hace cumplir en runtime.

Esto democratiza la especificación de alineamiento: las personas que conocen las políticas de la organización (no los ingenieros) pueden expresarlas directamente.

### 2. Enforcement en cascada graduado

El proxy aplica las restricciones en una cascada de 3 capas de menor a mayor costo computacional, cortocircuitando en cuanto una capa decide:

```
prompt del agente
  │
  ├─► [Capa 1 — Regex ~5ms]
  │     Patrones estructurados: credenciales, PII numérica, tokens.
  │     Si matchea → acción → fin.
  │
  ├─► [Capa 2 — Pattern ~20ms]
  │     Heurísticas de contexto: archivos sensibles (.env, id_rsa),
  │     bloques de variables de entorno, paths de configuración.
  │     Si matchea → acción → fin.
  │
  └─► [Capa 3 — Haiku judge ~150ms]
        Evaluación semántica de políticas en lenguaje natural.
        Haiku evalúa con contexto usando las políticas NL de la org
        como few-shots vía prompt caching.
        Si flag → acción → fin. Si pasa → forward a Anthropic.
```

Las 4 acciones del enforcement son graduadas: desde el más liviano (`LOG`, solo observar) hasta el más restrictivo (`BLOCK`, rechazar el request y explicar al agente qué límite se superó). Entre ambos, `WARN` (notificar sin interrumpir) y `REDACT` (intervención quirúrgica que permite que el agente siga siendo útil sin exfiltrar la información sensible).

El overhead total es < 200 ms p50 — el alineamiento es invisible para el desarrollador en el flujo normal de trabajo.

### 3. Alineamiento iterativo con human-in-the-loop

Definir todas las políticas relevantes upfront es imposible. Los patrones problemáticos reales emergen de observar el comportamiento del agente en producción. El **AI Suggestor** (Layer 4) cierra este ciclo:

1. Analiza los prompts que pasaron sin ser interceptados (`LOG`) en los últimos N días.
2. Embebe los prompts redactados y los clusteriza para detectar patrones recurrentes.
3. Por cada cluster representativo, usa Haiku para proponer una política nueva: nombre, tipo de detección, acción recomendada, razonamiento y ejemplos retroactivos.
4. Presenta las propuestas al admin en una approval queue con preview de cuántos eventos pasados hubieran sido interceptados.

El admin aprueba, edita o descarta. **El Suggestor nunca activa políticas por sí solo.** El humano siempre está en el loop.

Este ciclo permite que la especificación de alineamiento evolucione junto con los patrones de uso real, sin requerir que el admin anticipe cada caso posible desde el día uno.

---

## Las 4 layers

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 4 — AI Suggestor                                          │
│  Detecta patrones de comportamiento no cubiertos y propone       │
│  nuevas políticas. Human-in-the-loop: el admin aprueba.          │
└──────────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3 — Admin Backoffice (Web UI)                             │
│  Visual rule builder no-code · dashboards · approval queue       │
└──────────────────────────────────────────────────────────────────┘
                            ▲ políticas sincronizadas
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2 — Interceptor Engine (proxy modificable)                │
│  Cascada: Regex (~5ms) → Pattern (~20ms) → Haiku judge (~150ms)  │
│  Acciones: BLOCK · REDACT · WARN · LOG  —  <200ms overhead       │
└──────────────────────────────────────────────────────────────────┘
                            ▲ ANTHROPIC_BASE_URL
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Claude Code (máquina del desarrollador)               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Supervisión humana y trazabilidad

Una propiedad central de un sistema de alineamiento es que sus decisiones sean **interpretables y auditables**. Tranquera garantiza:

- Cada request genera un `traceId` único que registra qué capas evaluaron el prompt, qué políticas matchearon, qué acción se tomó y cuánto tardó cada capa.
- El prompt nunca se persiste sin redacción previa — las mismas reglas de detección corren sobre el log antes del insert.
- Cuando el proxy interviene con `BLOCK`, el agente recibe una respuesta sintética que explica la política violada y el patrón detectado. La intervención es transparente: el desarrollador sabe exactamente qué límite se superó y por qué.
- Si el juez Haiku falla (timeout, error de API), el sistema hace fail-closed con `WARN` en vez de interrumpir al dev o silenciar el evento. La supervisión no puede desaparecer silenciosamente.

---

## Admin Backoffice

Diseñado para compliance officers y security leads, **no para desarrolladores**. La persona que especifica el alineamiento de la organización no necesita saber regex ni SQL.

- **Eventos** — feed en tiempo real de cada request: acción aplicada, política que matcheó, prompt redactado truncado.
- **Reglas** — visual rule builder con 3 tipos:
  - *Preset*: galería de patrones estructurados conocidos (AWS Access Key, Email, JWT, Credit Card, IBAN, CUIT/CUIL).
  - *Filename / Path*: archivos y rutas sensibles sin escribir código.
  - *Lenguaje natural*: especificación semántica directa ("no menciones nombres de clientes").
- **Dashboard** — KPIs: eventos en las últimas 24h, distribución por acción, latencia p50 del proxy.
- **Equipo** — atribución por dev via CLI device flow (`npx tranquera setup`).
- **Sugerencias** — approval queue con preview retroactivo de cada propuesta del Suggestor.

Cambios en políticas se reflejan en el proxy en menos de 5 segundos, sin restart.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Interceptor (Layer 2) | Python 3.12 + FastAPI · deployado en Railway |
| Web admin (Layer 3) | Next.js 16 App Router + Tailwind 4 + TypeScript · deployado en Vercel |
| LLM de juicio | Claude Haiku 4.5 con prompt caching activo |
| Base de datos | Postgres 16 + pgvector (Supabase en producción) |
| ORM | Prisma — fuente de verdad del schema y migraciones |
| Auth | Auth.js v5 + Google OAuth + CLI device flow |
| UI components | shadcn/ui |

### Integración con Claude Code

```bash
# El dev ejecuta una sola vez
npx tranquera setup

# Device flow → browser → Google login → aprobación del admin
# Resultado: ~/.tranquera/config.json con token atribuido al dev

export ANTHROPIC_BASE_URL=https://proxy.tranquera.dev/cli/<token>

# A partir de acá, el agente opera dentro de las políticas de la org
claude "explicame el patrón Observer"        # → LOG, pasa normal
claude "acá va mi AWS_SECRET_ACCESS_KEY..."  # → BLOCK, mensaje explicativo en pantalla
```

---

## Identidad

**Tranquera** es la palabra rioplatense para la portera rural: se abre cuando corresponde, se cierra cuando hay que cerrar — sin alarmas, sin ruido. Una aduana silenciosa entre la intención del agente y la respuesta del modelo.

Sistema visual monocromo cálido basado en IBM Plex Sans + IBM Plex Mono, paleta `paper` / `ink` / `graphite`. Los estados de acción (BLOCK, REDACT, WARN, LOG) se diferencian por jerarquía tipográfica y, en superficies de monitoreo en vivo, por acentos de color funcionales.

---

## Equipo

| Nombre | GitHub |
|---|---|
| Christian Rojas Rodriguez | @Christian-Rojas-Rodriguez |
| Federico Hörl | @fede-h |
| Mauricio Genta | @5y5F4il |
| Jaime Aza | @Jjat00 |
| Tomás Leonel Degese | @tomileonel |
