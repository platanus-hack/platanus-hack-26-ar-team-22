# pitch/ — Tranquera

Deck de pitch para Platanus Hack 26 (Team 22, track AI Security).

## Archivos

- **`deck.html`** — presentación standalone, 8 slides, 16:9, modo dark "paper" del design system.
  - Sin dependencias: IBM Plex se carga desde Google Fonts.
  - Navegación: ← → · PgUp/PgDn · Space · 1–8 · Home/End.
  - Snap-scroll en scroll vertical.

## Abrir local

```bash
open pitch/deck.html
```

## Exportar a PDF (Chrome / Brave / Edge)

1. Abrí `deck.html` en el navegador.
2. `⌘P` (macOS) / `Ctrl+P` (otros).
3. **Destination**: *Save as PDF*.
4. **Layout**: *Landscape*.
5. **Paper size**: *Tabloid* (~13×19) o custom *1280×720* — cualquiera respeta 16:9.
6. **Margins**: *None*.
7. **More settings → Background graphics**: ON. *(crítico — sin esto el deck sale en blanco)*.
8. **Save** → guardalo como `pitch/deck.pdf`.

> Tip: si el PDF queda con scroll dentro de slide en vez de paginar, abrí DevTools (`⌘⌥I`) y revisá que `@media print` esté activándose. Imprimir desde Chrome respetando "Background graphics" es lo que satisface el spec `06-pitch-demo.md` AC #1.

## Estructura — 9 slides

| # | Slide | Foco |
|---|---|---|
| 01 | **Cold open · Samsung** | "3 leaks de código en 20 días" — el caso documentado, abre frío sin marca |
| 02 | Brand reveal | Wordmark + tagline + ícono tranquera |
| 03 | No es una excepción | Cyberhaven 2026 (39,7%) + JetBrains 2026 (18% / 6×) escalan el problema |
| 04 | Antes de que el prompt salga | 3 prompts reales con su decisión (BLOCK / REDACT / WARN) |
| 05 | El reloj regulatorio | LGPD · Habeas Data · LFPDPPP — la regulación LATAM |
| 06 | Las 4 capas | Suggestor / Admin / Interceptor / Claude Code |
| 07 | El motor | Cascada Regex → Pattern → LLM Judge + las 4 acciones |
| 08 | Demo | Mock split-screen terminal ↔ /admin/events con 3 escenarios |
| 09 | Cierre | Wordmark + *"Antes de salir, queda escrito."* + equipo + repo |

## Fuentes de los datos del slide 02 (notas del speaker)

| Dato | Fuente |
|---|---|
| **Samsung — 3 leaks de código en 20 días, abril 2023** | [Bloomberg](https://www.bloomberg.com/news/articles/2023-05-02/samsung-bans-chatgpt-and-other-generative-ai-use-by-staff-after-leak) · [TechRadar](https://www.techradar.com/news/samsung-workers-leaked-company-secrets-by-using-chatgpt) · [The Register](https://www.theregister.com/2023/04/06/samsung_reportedly_leaked_its_own/) |
| **39,7% de prompts a AI tools exponen data sensible** | [Cyberhaven · Insider Threats Report 2026](https://www.cyberhaven.com/blog/insider-threats-in-the-age-of-ai) · [Sensitive Enterprise Data Flowing Into AI Tools](https://www.cyberhaven.com/blog/sensitive-data-flowing-into-ai-tools) |
| **18% adopción enterprise de Claude Code · 6× en 9 meses** | [JetBrains Research · ene 2026](https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/) |
| **LGPD: multa 2% del facturamiento · R$ 50M tope · 3 días para reportar** | [ANPD — Resolución CD/ANPD nº 15/2024](https://www.gov.br/anpd/pt-br/) · [Migalhas · multa R$ 20M por vazamento](https://www.migalhas.com.br/depeso/392981/multa-de-r-20-milhoes-por-vazamento-de-dados) |

## Decisiones de marca aplicadas

- **Modo "paper"** (`design.md` §2): background `--ink #1C1B18`, foreground `--paper #EFEDE6`. Es la variante recomendada para "decks oscuros / pitch / footers".
- **IBM Plex Sans + Mono** vía Google Fonts, pesos 400/500/600/700.
- **Captions `// `** en mono graphite, mayúscula con `letter-spacing: 0.18em` en la línea de header de cada slide.
- **Action pills** con la escala de peso del design system: `LOG` 400 → `WARN` 500 → `REDACT` 600 → `BLOCK` 700, con la barra vertical 2u de ink → paper a la izquierda.
- **Acentos de color funcional** (amber `#D9A441` para WARN, crimson `#B23A3A` para BLOCK) **únicamente** en la slide 06 (demo / monitoreo) — autorizado por la nota explícita del `design.md` §6.
- **Sin emojis**, sin "AI safety", sin "escudo", sin "shield". *"Firewall de Claude Code"* aceptado como categoría B2B en cierre.

## Pendiente (spec 06)

- [ ] `pitch/deck.pdf` exportado y commiteado (instrucciones arriba).
- [ ] `pitch/script.md` con guion segundo-a-segundo.
- [ ] `pitch/demo-runbook.md` con los pasos exactos del demo en vivo.
- [ ] `pitch/backup.mp4` ≤ 30 MB.
- [ ] Cronometrado entre 2:50 y 3:05 en ensayo final.
