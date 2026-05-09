# 03 — Landing Page

> Página pública. Vende el producto a jurados, security leaders y curiosos del hack.

---

## Contexto

El equipo va a tener 3 minutos para pitchear y un repo público para que los jurados naveguen después. La landing es la primera impresión cuando alguien abre el link sin contexto.

Para el hack la landing tiene 3 trabajos:

1. Explicar **qué hace el producto** en 5 segundos: *"firewall de Claude Code para empresas"*.
2. Mostrar **el problema concreto**: devs pegando credenciales / nombres de clientes / paths internos en prompts que salen del perímetro corporativo.
3. Llevar al visitante al **admin demo** (`/admin`, spec 04) con la cuenta de demo precargada — para que vea el visual rule builder y el dashboard real-time.

No es un sitio para SEO ni conversión real — es un **showroom**.

---

## Goals

- Página pública en `/` con hero, "el problema", "cómo funciona" (las 4 layers), "por qué LATAM", CTA al admin demo.
- Cargar < 1.5 s en LCP (Next.js + estática).
- Texto en español rioplatense, sin jerga corporativa innecesaria.
- Mobile-friendly al menos para iPhone reciente (no obsesionarse, demo va en desktop).

## Non-Goals

- No formulario de contacto / waitlist real.
- No blog / changelog / docs públicas.
- No internacionalización.
- No analytics complejo (Vercel Analytics on/off OK).

---

## User Stories

- **Como jurado** que recibe el link 30 s antes del pitch, quiero entender de qué se trata sin scrollear.
- **Como visitante random**, quiero ver una demo en un click sin tener que instalar Claude Code yo mismo.
- **Como integrante del team** mostrando el repo a alguien fuera del hack, quiero que la URL pública les venda solo.

---

## Acceptance Criteria

- [ ] Ruta `/` renderiza hero con headline + subheadline + CTA primario "Ver el admin demo →" → `/admin?demo=1`.
- [ ] Sección **"El problema"** con 3 escenarios visuales (leak de credencial, mención de cliente, paste de `.env`).
- [ ] Sección **"Cómo funciona"** mostrando las 4 layers (Claude Code → Interceptor → Admin → AI Suggestor) con la cascada Regex → Pattern → Haiku.
- [ ] Sección **"Por qué LATAM"** cita al menos: PL 2338 (Brasil), S-0071/2025 (Argentina), gap multilingüe (XL-SafetyBench sin pt-BR).
- [ ] Footer con links al repo GitHub, equipo (5 nombres con sus GitHub) y Platanus Hack 26.
- [ ] Deploy en Vercel preview funciona en cada PR a `web/src/app/(landing)/`.
- [ ] Lighthouse Performance ≥ 90 en desktop.

---

## Interfaces / Contratos

### Rutas

| Ruta | Componente | Notas |
|---|---|---|
| `/` | Landing | Hero + el problema + cómo funciona + por qué LATAM + footer |
| `/admin` | (spec 04 — Admin Web) | CTA del hero apunta acá con `?demo=1` para precargar org demo |

### Stack

- Next.js 16 App Router con `'use cache'` donde aplique.
- shadcn/ui (`Button`, `Card`).
- Tailwind 4 con paleta del logo (definir en task T1).
- Imágenes: SVG inline o `next/image` con preload del hero.

### Copy del hero (draft inicial — afinar en task T2)

> **Headline**: "El firewall de Claude Code que tu compliance officer va a aprobar."
>
> **Subheadline**: "Reglas no-code, redacción en runtime, auditoría completa. Tus devs siguen usando Claude Code; vos decidís qué sale del perímetro."
>
> **CTA primario**: "Ver el admin demo →" (a `/admin?demo=1`)
> **CTA secundario**: "Ver en GitHub" (a la URL del repo)

### Diagrama del bloque "Cómo funciona"

Mostrar visualmente las 4 layers (igual que el ASCII en `00-constitution.md`):

```
Claude Code  →  Interceptor  →  Admin no-code
   (dev)        cascada 3       reglas + dashboards
                capas <200ms          ↑
                                  AI Suggestor
                                  sugiere reglas
```

---

## Data model

Sin data model propio — landing es estática.

## Dependencias

- **Spec `00-constitution.md`** — stack y convenciones.
- **Spec `04-admin-web.md`** — para que el CTA tenga destino con la org demo precargada.
- Logo final del proyecto (`project-logo.png` ya existe en root, reemplazar antes de submit).

## Tasks (paralelizables)

- [ ] **T1** — Setup `web/` con shadcn/ui inicializado y paleta definida desde el logo. Done: `pnpm dev` muestra "hello".
- [ ] **T2** — Hero + CTAs con copy final en español. Done: render visual aprobado por el equipo (screenshot en PR).
- [ ] **T3** — Sección "El problema" con 3 cards (leak credencial / mención cliente / paste `.env`). Done: cada card tiene un mini-mockup de chat de Claude Code.
- [ ] **T4** — Sección "Cómo funciona" con el diagrama de 4 layers + breakdown de la cascada. Done: diagrama legible en desktop y mobile.
- [ ] **T5** — Sección "Por qué LATAM" con citas a PL 2338, S-0071, XL-SafetyBench gap. Done: links a las leyes / paper.
- [ ] **T6** — Footer con team (5 nombres + GH avatars) + link al repo + crédito Platanus Hack 26. Done: links funcionan.
- [ ] **T7** — Deploy en Vercel: configurar proyecto, dominio preview por PR. Done: URL pública compartible.
- [ ] **T8** — Lighthouse audit: Performance ≥ 90, Accessibility ≥ 90. Done: screenshot del Lighthouse en el PR.

## Verification

- Abrir la URL preview en navegador limpio (incógnito) y leer el hero en voz alta — ¿se entiende qué hace en 5 s? Sí/no.
- Click en "Ver el admin demo" lleva a `/admin?demo=1` y carga sin errores con la org demo seleccionada.
- Mobile DevTools (iPhone 14): no hay overflow horizontal, los CTAs son tappeables.
- `lighthouse https://<preview>.vercel.app --view` → Performance ≥ 90.
