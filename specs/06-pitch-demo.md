# 06 — Pitch & Demo

> Cómo vendemos lo que construimos. 3 minutos, 1 demo en vivo con Claude Code real, 1 ask.

---

## Contexto

En Platanus Hack 26 cada equipo tiene 3 minutos para pitchear ante jurados. La diferencia entre un proyecto técnico decente y uno **memorable** suele estar acá: el pitch.

El proyecto cae en la **Idea C (variante Claude Code)** del `research/landscape.md`: un firewall específico para Claude Code corporativo, focalizado en data exfiltration, con compliance LATAM como driver. La narrativa de mercado está lista (regulación + dolor real en empresas que ya están dando Claude Code a sus devs). El trabajo de este spec es traducir esa narrativa en **un guion de 3 min + slides + demo script + plan B**.

---

## Goals

- Pitch de **3 minutos exactos** (problema 30 s + producto 30 s + demo 90 s + ask 30 s).
- Slides exportadas a PDF y al repo (`pitch/deck.pdf`).
- **Demo script step-by-step** que cualquiera del equipo pueda ejecutar.
- Video de 60 s grabado con Claude Code real corriendo a través del proxy, como backup en caso de internet caído.
- 1 frase memorable / hook que la gente repita después.

## Non-Goals

- Pitch de 10 min, demo larga, deep dive técnico — eso es para una segunda etapa post-hack.
- Material en inglés (track del hack es regional).
- Métricas inventadas — solo mostramos lo que realmente medimos.

---

## User Stories

- **Como speaker del pitch**, quiero saber qué digo segundo a segundo y qué pantalla mostrar en cada momento.
- **Como speaker de backup**, quiero poder leer el script y dar el mismo pitch.
- **Como jurado**, después de los 3 min quiero recordar **una sola cosa** del proyecto y querer entrar al GitHub.

---

## Acceptance Criteria

- [ ] `pitch/deck.pdf` versionado en el repo, ≤ 10 slides.
- [ ] `pitch/script.md` con guion segundo-a-segundo y pantalla a mostrar en cada bloque.
- [ ] `pitch/demo-runbook.md` con los pasos exactos del demo en vivo (incluye comandos `export ANTHROPIC_BASE_URL=...` y los 3 prompts), con screenshots esperados.
- [ ] Video backup `.mp4` ≤ 30 MB grabado en local con OBS o Loom, mostrando Claude Code real con los 3 escenarios.
- [ ] Pitch completo en el ensayo final dura entre 2:50 y 3:05 (cronometrado por alguien del team distinto al speaker).
- [ ] Hook frase ≤ 12 palabras decidida y escrita en la primera slide.

---

## Interfaces / Contratos

### Estructura del pitch (slides)

| # | Slide | Tiempo | Pantalla / visual |
|---|---|---|---|
| 1 | Hook + nombre del proyecto + 1 frase | 0:00 – 0:15 | Slide |
| 2 | El problema: empresas dan Claude Code a sus devs y no controlan qué sale | 0:15 – 0:45 | Slide con 3 mockups de leak (credencial, cliente, `.env`) |
| 3 | Qué es: las 4 layers + cascada | 0:45 – 1:10 | Slide con el diagrama del whiteboard digitalizado |
| 4 | Demo en vivo — Claude Code real | 1:10 – 2:40 | Terminal con `claude` + admin web split-screen |
| 5 | Por qué LATAM / regulación que crea mercado | 2:40 – 2:55 | Slide |
| 6 | Ask + repo + team | 2:55 – 3:00 | Slide |

### Demo en vivo (90 s)

```
Pre-demo setup (antes del pitch):
  - Terminal con $ANTHROPIC_BASE_URL=https://proxy.team22.dev exportado.
  - Admin web abierta en otra ventana en /admin/events.

[1:10] Speaker: "Acá tengo Claude Code real, configurado para pasar por nuestro proxy."
       Mostrar `echo $ANTHROPIC_BASE_URL`.

[1:20] Demo 1 — Prompt benigno.
       $ claude "explicame el patrón Observer en TypeScript"
       Speaker: "Pregunta normal. Pasó por la cascada en 8ms. La respuesta llega como siempre."
       Pantalla derecha: aparece event LOG en /admin/events.

[1:40] Demo 2 — Leak de credencial.
       $ claude "ayudame con esto: AKIAIOSFODNN7EXAMPLE"
       Speaker: "Acto reflejo del dev — pegó una AWS key. Capa Regex matcheó en 3ms."
       Claude Code muestra: "🛡️ Tu request fue bloqueado por la política aws-access-key..."
       Pantalla derecha: aparece event BLOCK en rojo.

[2:10] Demo 3 — Mención de cliente (REDACT).
       $ claude "escribime un email para el cliente Acme Corp explicando el bug"
       Speaker: "Esto es lo distinto: no es injection, es legítimo. Pero la regla NL del admin dice
                'no menciones nombres de clientes'. Haiku decidió REDACT."
       Claude Code muestra una respuesta normal pero sin nombre de cliente.
       Pantalla derecha: event REDACT en amarillo, prompt `[REDACTED:client]`.

[2:30] Speaker: "Cada decisión queda con traceId — auditable, regulator-ready. Y arriba hay un
                Layer 4 que aprende: en 3 días te sugiere reglas nuevas en base a lo que vio."
```

### Frase hook (candidatas — elegir una en task T2)

- "Tus devs siguen usando Claude Code. Vos decidís qué sale."
- "El firewall de Claude Code que tu compliance officer va a aprobar."
- "Cada prompt corporativo, auditado. Cero fricción para el dev."

---

## Data model

N/A — todos artefactos son archivos en el repo bajo `pitch/`.

## Dependencias

- **Specs 01, 02, 03, 04, 08** — necesitan estar funcionando para que la demo no se rompa en vivo.
- `research/landscape.md` — fuente de los datos del slide 5.
- Claude Code instalado y configurado en la máquina del speaker.

## Tasks (paralelizables)

- [ ] **T1** — Estructura de slides en `pitch/deck.{slides|pdf}`. 6 slides con los títulos de la tabla. Done: PDF exportado, ≤ 10 slides.
- [ ] **T2** — Decidir frase hook (votación equipo) y escribirla en slide 1. Done: 1 frase elegida, ≤ 12 palabras.
- [ ] **T3** — `pitch/script.md` con guion segundo-a-segundo. Done: speaker hace ensayo y queda entre 2:50–3:05.
- [ ] **T4** — `pitch/demo-runbook.md` con pasos del demo + screenshots esperados + comandos exactos. Done: alguien que no programó puede correrlo siguiendo el doc.
- [ ] **T5** — Video backup grabado con Claude Code real (los 3 escenarios). Done: archivo `.mp4` en `pitch/backup.mp4`, ≤ 30 MB.
- [ ] **T6** — Diagrama del slide 3 (4 layers + cascada) digitalizado del whiteboard. Done: imagen en `pitch/assets/architecture.png`.
- [ ] **T7** — Ensayo final de equipo: 2 vueltas cronometradas + feedback round. Done: acta en `pitch/rehearsal-notes.md`.

## Verification

- Cronometrar el pitch completo 2 veces: ambas entre 2:50 y 3:05.
- Probar la demo en vivo con internet apagado → fallback al video graba en menos de 5 s.
- Pedir a alguien fuera del equipo (otro hacker) que escuche el pitch y le pregunte: "¿qué hace el producto?". Si en una frase puede explicarlo, el pitch funciona.
- Slide 1 visible desde 5 m de distancia (texto grande, contraste).
- Demo en vivo: los 3 prompts disparan el resultado esperado en `/admin/events` con la coloración correcta.
