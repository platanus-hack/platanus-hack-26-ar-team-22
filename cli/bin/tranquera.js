#!/usr/bin/env node
// tranquera CLI — onboarding del dev en un comando.
//
//   npx tranquera setup     → device flow + configura tu shell
//   npx tranquera login     → fuerza un nuevo device flow
//   npx tranquera whoami    → muestra a qué org estás vinculado
//   npx tranquera logout    → revoca el token y limpia tu config
//   npx tranquera status    → estado del rc + ping al proxy
//
// El device flow abre el browser para que loguées con Google. Después de
// aprobar, recibís un token que se guarda en ~/.tranquera/config.json.
// Tu admin tiene que haberte invitado primero desde /admin/team.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { stdout } from "node:process";

const DEFAULT_APP_URL =
  process.env.TRANQUERA_APP_URL ?? "http://localhost:3000";
const DEFAULT_PROXY_URL =
  process.env.TRANQUERA_PROXY_URL ??
  "https://platanus-hack-26-ar-team-22-production.up.railway.app";

const CONFIG_DIR = join(homedir(), ".tranquera");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const MARKER = "# tranquera · firewall de Claude Code";
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const c = (color, text) =>
  stdout.isTTY ? `${COLORS[color]}${text}${COLORS.reset}` : text;

// -------------------------------------------------------------
// Config storage
// -------------------------------------------------------------

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return null;
  }
}

function writeConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}

function clearConfig() {
  if (existsSync(CONFIG_PATH)) {
    writeFileSync(CONFIG_PATH, "{}\n", { mode: 0o600 });
  }
}

// -------------------------------------------------------------
// Shell rc
// -------------------------------------------------------------

function detectShellConfig() {
  const shellName = (process.env.SHELL ?? "").split("/").pop() ?? "";
  if (shellName === "fish") {
    return {
      name: "fish",
      rcPath: join(homedir(), ".config/fish/config.fish"),
      exportLine: (url) => `set -gx ANTHROPIC_BASE_URL "${url}"`,
    };
  }
  if (shellName === "zsh") {
    return {
      name: "zsh",
      rcPath: join(homedir(), ".zshrc"),
      exportLine: (url) => `export ANTHROPIC_BASE_URL="${url}"`,
    };
  }
  if (shellName === "bash") {
    return {
      name: "bash",
      rcPath: join(
        homedir(),
        platform() === "darwin" ? ".bash_profile" : ".bashrc",
      ),
      exportLine: (url) => `export ANTHROPIC_BASE_URL="${url}"`,
    };
  }
  return null;
}

function appendIfMissing(rcPath, blockBody) {
  mkdirSync(dirname(rcPath), { recursive: true });
  const current = existsSync(rcPath) ? readFileSync(rcPath, "utf8") : "";
  if (current.includes(MARKER)) return false;
  const sep = current.endsWith("\n") || current === "" ? "" : "\n";
  writeFileSync(rcPath, `${current}${sep}\n${blockBody}\n`);
  return true;
}

function isConfiguredInRc(rcPath) {
  if (!existsSync(rcPath)) return false;
  return readFileSync(rcPath, "utf8").includes(MARKER);
}

// -------------------------------------------------------------
// HTTP helpers
// -------------------------------------------------------------

async function pingHealth(proxyUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${proxyUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function startDeviceFlow(appUrl) {
  const res = await fetch(`${appUrl}/api/cli/device/start`, { method: "POST" });
  if (!res.ok) {
    throw new Error(`backend devolvió ${res.status} en /device/start`);
  }
  return res.json();
}

async function pollDevice(appUrl, deviceCode, intervalSec) {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const res = await fetch(
      `${appUrl}/api/cli/device/poll?device_code=${encodeURIComponent(deviceCode)}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === "approved") return data;
      if (data.status === "expired") throw new Error("código vencido");
      if (data.status === "consumed") throw new Error("token ya recogido por otro proceso");
    }
    await new Promise((r) => setTimeout(r, intervalSec * 1000));
  }
  throw new Error("timeout esperando aprobación");
}

async function fetchMe(appUrl, token) {
  const res = await fetch(`${appUrl}/api/cli/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

async function postLogout(appUrl, token) {
  await fetch(`${appUrl}/api/cli/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// -------------------------------------------------------------
// Browser open
// -------------------------------------------------------------

function openInBrowser(url) {
  const p = platform();
  let cmd, args;
  if (p === "darwin") {
    cmd = "open";
    args = [url];
  } else if (p === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => {}); // si falla, ignoramos — el user puede pegar la URL
    child.unref();
  } catch {
    // mismo: si no hay browser, le mostramos la URL al user para que la pegue.
  }
}

// -------------------------------------------------------------
// Device flow orchestrator (login)
// -------------------------------------------------------------

async function performDeviceFlow() {
  console.log("");
  console.log(`  ${c("bold", "▎ tranquera · login")}`);
  console.log(`  └─ app  ${DEFAULT_APP_URL}`);
  console.log("");

  process.stdout.write("  · iniciando device flow… ");
  const start = await startDeviceFlow(DEFAULT_APP_URL);
  console.log(c("green", "ok"));

  console.log("");
  console.log(`  ${c("bold", "Abrí el browser y aprobá:")}`);
  console.log(`      ${start.verification_uri}`);
  console.log("");
  console.log(`  ${c("dim", "(o pegá este código manualmente)")}`);
  console.log(`      ${c("bold", start.user_code)}`);
  console.log("");

  openInBrowser(start.verification_uri);

  process.stdout.write("  · esperando aprobación… ");
  const approved = await pollDevice(DEFAULT_APP_URL, start.device_code, start.interval);
  console.log(c("green", "ok"));

  return {
    token: approved.token,
    member: approved.member,
    proxyUrl: start.proxy_url ?? DEFAULT_PROXY_URL,
    appUrl: DEFAULT_APP_URL,
  };
}

// Compose the URL Claude Code will hit. The token rides in the path because
// Claude Code respects ANTHROPIC_BASE_URL but won't let us inject headers —
// so this is how the interceptor knows which dev fired each prompt.
function composeProxyBaseUrl(proxyUrl, token) {
  const base = proxyUrl.replace(/\/+$/, "");
  return `${base}/cli/${token}`;
}

// -------------------------------------------------------------
// Commands
// -------------------------------------------------------------

async function cmdSetup() {
  const existing = readConfig();
  let session;

  if (existing?.token && existing?.appUrl) {
    process.stdout.write("  · ya hay un token guardado, validando… ");
    const me = await fetchMe(existing.appUrl, existing.token);
    if (me?.member) {
      console.log(c("green", "ok"));
      session = {
        token: existing.token,
        member: me.member,
        proxyUrl: existing.proxyUrl ?? DEFAULT_PROXY_URL,
        appUrl: existing.appUrl,
      };
    } else {
      console.log(c("yellow", "expirado, vuelvo a loguear"));
    }
  }

  if (!session) {
    session = await performDeviceFlow();
    writeConfig({
      version: 1,
      appUrl: session.appUrl,
      proxyUrl: session.proxyUrl,
      token: session.token,
      member: session.member,
    });
  }

  // Configurar el rc.
  const shell = detectShellConfig();
  if (!shell) {
    const baseUrl = composeProxyBaseUrl(session.proxyUrl, session.token);
    console.error(c("red", "✗ no reconocí tu shell."));
    console.error(`  agregá manualmente: export ANTHROPIC_BASE_URL="${baseUrl}"`);
    process.exit(1);
  }

  const baseUrlForClaude = composeProxyBaseUrl(session.proxyUrl, session.token);

  console.log("");
  console.log(`  ${c("bold", "▎ tranquera · setup")}`);
  console.log(`  ├─ proxy   ${session.proxyUrl}`);
  console.log(`  ├─ shell   ${shell.name}`);
  console.log(`  ├─ rc      ${shell.rcPath}`);
  console.log(`  └─ member  ${session.member.email} · org=${session.member.org.id}`);
  console.log("");

  const block = `${MARKER}\n${shell.exportLine(baseUrlForClaude)}`;
  const wrote = appendIfMissing(shell.rcPath, block);
  if (wrote) {
    console.log(`  ${c("green", "·")} agregué la export a ${shell.rcPath}`);
  } else {
    console.log(`  ${c("dim", "·")} ya estaba configurado en ${shell.rcPath} (si rotaste el token, corré ${c("bold", "npx tranquera login")} y editá la export a mano)`);
  }

  process.stdout.write("  · verificando proxy… ");
  const healthy = await pingHealth(session.proxyUrl);
  console.log(healthy ? c("green", "ok") : c("yellow", "no respondió"));

  console.log("");
  console.log("  Listo. Reabrí tu terminal (o corré `source` del rc) y usá");
  console.log("  Claude Code igual que siempre. Cada prompt va a pasar por la");
  console.log("  tranquera y queda atribuido a vos en el back-office.");
  console.log("");
}

async function cmdLogin() {
  const session = await performDeviceFlow();
  writeConfig({
    version: 1,
    appUrl: session.appUrl,
    proxyUrl: session.proxyUrl,
    token: session.token,
    member: session.member,
  });
  console.log("");
  console.log(`  ${c("green", "✓")} logueado como ${c("bold", session.member.email)} (org ${session.member.org.id})`);
  console.log(`  ${c("dim", `  token guardado en ${CONFIG_PATH}`)}`);
  console.log("");
}

async function cmdWhoami() {
  const cfg = readConfig();
  if (!cfg?.token) {
    console.log("");
    console.log(`  ${c("yellow", "✗")} no estás logueado. Corré: ${c("bold", "npx tranquera login")}`);
    console.log("");
    process.exit(1);
  }

  process.stdout.write("  · validando token… ");
  const me = await fetchMe(cfg.appUrl ?? DEFAULT_APP_URL, cfg.token);
  if (!me?.member) {
    console.log(c("red", "inválido"));
    console.log(`  ${c("yellow", "→")} corré: ${c("bold", "npx tranquera login")}`);
    process.exit(1);
  }
  console.log(c("green", "ok"));

  console.log("");
  console.log(`  ${c("bold", "▎ tranquera · whoami")}`);
  console.log(`  ├─ email   ${me.member.email}`);
  console.log(`  ├─ rol     ${me.member.role}`);
  console.log(`  ├─ org     ${me.member.org.id} (${me.member.org.name})`);
  console.log(`  └─ proxy   ${cfg.proxyUrl ?? DEFAULT_PROXY_URL}`);
  console.log("");
}

async function cmdLogout() {
  const cfg = readConfig();
  if (!cfg?.token) {
    console.log(`  ${c("dim", "no había sesión activa")}`);
    return;
  }
  await postLogout(cfg.appUrl ?? DEFAULT_APP_URL, cfg.token);
  clearConfig();
  console.log("");
  console.log(`  ${c("green", "✓")} sesión cerrada y token revocado`);
  console.log(`  ${c("dim", "el rc no se modifica — si querés sacar el proxy, borralo a mano")}`);
  console.log("");
}

async function cmdStatus() {
  const shell = detectShellConfig();
  const cfg = readConfig();
  console.log("");
  console.log(`  ${c("bold", "▎ tranquera · status")}`);
  console.log(`  ├─ app    ${cfg?.appUrl ?? DEFAULT_APP_URL}`);
  console.log(`  ├─ proxy  ${cfg?.proxyUrl ?? DEFAULT_PROXY_URL}`);
  console.log(`  └─ shell  ${shell?.name ?? "desconocido"}`);
  console.log("");

  if (cfg?.token) {
    console.log(`  ${c("green", "✓")} token guardado en ${CONFIG_PATH}`);
  } else {
    console.log(`  ${c("yellow", "✗")} sin token. Corré: ${c("bold", "npx tranquera login")}`);
  }

  if (shell) {
    if (isConfiguredInRc(shell.rcPath)) {
      console.log(`  ${c("green", "✓")} export configurada en ${shell.rcPath}`);
    } else {
      console.log(`  ${c("yellow", "✗")} export NO está en ${shell.rcPath}`);
    }
  }

  process.stdout.write("  · ping al proxy… ");
  const healthy = await pingHealth(cfg?.proxyUrl ?? DEFAULT_PROXY_URL);
  console.log(healthy ? c("green", "ok") : c("red", "no responde"));
  console.log("");
}

function cmdHelp() {
  console.log(`
  ${c("bold", "tranquera")} · firewall de Claude Code corporativo

  Uso:
    npx tranquera <comando>

  Comandos:
    setup     Login + configura ANTHROPIC_BASE_URL en tu shell rc.
    login     Fuerza un nuevo device flow (útil después de logout).
    whoami    Muestra a qué org / member estás vinculado.
    logout    Revoca tu token y limpia ~/.tranquera/config.json.
    status    Estado actual: rc + token + ping al proxy.
    help      Esta ayuda.

  Variables:
    TRANQUERA_APP_URL      URL del back-office (default: ${DEFAULT_APP_URL}).
    TRANQUERA_PROXY_URL    URL del proxy (default: deploy del hack).

  Más info: https://github.com/platanus-hack/platanus-hack-26-ar-team-22
`);
}

// -------------------------------------------------------------
// Entry
// -------------------------------------------------------------

const command = process.argv[2] ?? "help";
const handlers = {
  setup: cmdSetup,
  login: cmdLogin,
  whoami: cmdWhoami,
  logout: cmdLogout,
  status: cmdStatus,
  help: cmdHelp,
  "--help": cmdHelp,
  "-h": cmdHelp,
};

const handler = handlers[command];
if (!handler) {
  console.error(c("red", `comando desconocido: ${command}\n`));
  cmdHelp();
  process.exit(1);
}

try {
  await handler();
} catch (err) {
  console.error(c("red", `error: ${err instanceof Error ? err.message : err}`));
  process.exit(1);
}
