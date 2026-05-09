# tranquera

> CLI para devs que usan **Claude Code** detrás de un firewall corporativo de **[Tranquera](https://github.com/platanus-hack/platanus-hack-26-ar-team-22)**.

Un comando configura tu shell para que cada prompt de Claude Code pase por el proxy de tu organización antes de llegar a Anthropic. Tu admin define las reglas (regex + judge LLM); el CLI te identifica via Google y te asocia a tu org.

## Uso

```bash
npx tranquera setup
```

Hace todo de una:
1. Si no estás logueado, abre el browser para que te autentiques con Google.
2. Te asocia a la org en la que tu admin te invitó.
3. Agrega `export ANTHROPIC_BASE_URL="<proxy>/cli/<token>"` a tu shell rc (`~/.zshrc`, `~/.bashrc`, `~/.bash_profile` o `~/.config/fish/config.fish`). El token va en el path porque Claude Code no permite inyectar headers — así el interceptor sabe a qué dev atribuir cada prompt.
4. Pinguea el proxy para confirmar que responde.

Reabrís la terminal (o `source` del rc) y usás `claude` igual que siempre.

## Comandos

| Comando | Qué hace |
|---|---|
| `setup` | Login + configura shell rc. Idempotente: si ya hay token válido, salta el login. |
| `login` | Fuerza un nuevo device flow (útil después de `logout`). |
| `whoami` | Muestra a qué org / member estás vinculado. |
| `logout` | Revoca tu token y limpia `~/.tranquera/config.json`. |
| `status` | Estado actual: rc + token + ping al proxy. |
| `help` | Esta ayuda. |

## Variables de entorno

| Variable | Default | Para qué |
|---|---|---|
| `TRANQUERA_APP_URL` | `http://localhost:3000` | URL del back-office (donde corre el device flow + login Google). |
| `TRANQUERA_PROXY_URL` | URL del deploy del hack en Railway | URL del proxy (se sobreescribe con la del back-office en el setup). |

## ¿Por dónde anda mi config?

`~/.tranquera/config.json` (permisos `0600`). Contiene tu token de CLI, el `proxy_url` y el `member` resuelto. Es el patrón estándar de CLIs (igual que `~/.aws/`, `~/.gh/`, `~/.docker/`).

## ¿Qué pasa si el proxy se cae?

Tu request va a fallar igual que si Anthropic estuviera caído. El CLI no tiene fallback automático — si querés volver a Anthropic directo, `unset ANTHROPIC_BASE_URL` en tu sesión actual.

Para sacar la export del rc de raíz: borrá las dos líneas que el CLI agregó (las marca con `# tranquera · firewall de Claude Code`).

## ¿Qué viaja al proxy?

El CLI **no toca** lo que Claude Code manda — solo redirige el host (con tu token en el path). Claude Code envía sus headers normales (`x-api-key` o `Authorization`) y el body intacto. El proxy:

1. Extrae tu token del path (`/cli/<token>/...`), lo hashea y resuelve a qué `member` perteneces.
2. Lee las reglas activas de tu org.
3. Corre la cascada **Regex → Haiku judge**.
4. Si todo OK, reenvía a `api.anthropic.com` y devuelve la respuesta tal cual.
5. Si una regla matchea con `BLOCK`, devuelve un `Message` sintético explicando qué pasó.

Cada request queda **auditada en el back-office** de tu admin, atribuida a tu cuenta (`interactions.user_id = members.id`).

> Si tu admin **revoca tu token** desde `/admin/team`, la próxima request va a fallar con `401 unknown or revoked tranquera token`. Corré `npx tranquera login` para generar uno nuevo y editá la export del rc con la URL nueva.

## Requisitos

- Node 18+ (ya lo tenés instalado si usás `claude`).
- Una cuenta de Google y haber sido invitado por el admin de tu org.

## Más info

Repo y documentación completa: <https://github.com/platanus-hack/platanus-hack-26-ar-team-22>

Track AI Security · Platanus Hack 26 · Buenos Aires.
