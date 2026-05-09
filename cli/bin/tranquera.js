#!/usr/bin/env node
// tranquera CLI — onboarding del dev en un comando.
// `npx tranquera setup` deja Claude Code apuntando al firewall de tu org.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { stdout } from "node:process";

const DEFAULT_PROXY_URL =
  process.env.TRANQUERA_PROXY_URL ??
  "https://platanus-hack-26-ar-team-22-production.up.railway.app";

const MARKER = "# tranquera · firewall de Claude Code";
const FETCH_TIMEOUT_MS = 5000;

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
// Shell detection
// -------------------------------------------------------------

function detectShellConfig() {
  const shellPath = process.env.SHELL ?? "";
  const shellName = shellPath.split("/").pop() ?? "";

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
      rcPath: join(homedir(), platform() === "darwin" ? ".bash_profile" : ".bashrc"),
      exportLine: (url) => `export ANTHROPIC_BASE_URL="${url}"`,
    };
  }
  return null;
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

async function pingHealth(proxyUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${proxyUrl}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

function appendIfMissing(rcPath, blockBody) {
  mkdirSync(dirname(rcPath), { recursive: true });
  const current = existsSync(rcPath) ? readFileSync(rcPath, "utf8") : "";
  if (current.includes(MARKER)) return false;
  const sep = current.endsWith("\n") || current === "" ? "" : "\n";
  writeFileSync(rcPath, `${current}${sep}\n${blockBody}\n`);
  return true;
}

function isConfigured(rcPath) {
  if (!existsSync(rcPath)) return false;
  return readFileSync(rcPath, "utf8").includes(MARKER);
}

// -------------------------------------------------------------
// Commands
// -------------------------------------------------------------

async function cmdSetup() {
  const shell = detectShellConfig();
  if (!shell) {
    console.error(c("red", "✗ no reconocí tu shell."));
    console.error(`  agregá manualmente: export ANTHROPIC_BASE_URL="${DEFAULT_PROXY_URL}"`);
    process.exit(1);
  }

  console.log("");
  console.log(`  ${c("bold", "▎ tranquera · setup")}`);
  console.log(`  ├─ proxy  ${DEFAULT_PROXY_URL}`);
  console.log(`  ├─ shell  ${shell.name}`);
  console.log(`  └─ rc     ${shell.rcPath}`);
  console.log("");

  const block = `${MARKER}\n${shell.exportLine(DEFAULT_PROXY_URL)}`;
  const wrote = appendIfMissing(shell.rcPath, block);
  if (wrote) {
    console.log(`  ${c("green", "·")} agregué la export a ${shell.rcPath}`);
  } else {
    console.log(`  ${c("dim", "·")} ya estaba configurado en ${shell.rcPath} — no toco nada`);
  }

  process.stdout.write("  · verificando proxy… ");
  const healthy = await pingHealth(DEFAULT_PROXY_URL);
  console.log(
    healthy
      ? c("green", "ok")
      : c("yellow", `no respondió (timeout ${FETCH_TIMEOUT_MS}ms)`),
  );

  console.log("");
  console.log("  Listo. Reabrí tu terminal o corré:");
  console.log("");
  console.log(`      ${c("bold", `source ${shell.rcPath}`)}`);
  console.log("");
  console.log("  Después usá Claude Code igual que siempre. Cada prompt va a pasar");
  console.log("  por la tranquera de tu organización. Si te bloquea algo legítimo,");
  console.log("  contactá a tu admin con el trace id de la respuesta.");
  console.log("");
}

async function cmdStatus() {
  const shell = detectShellConfig();
  console.log("");
  console.log(`  ${c("bold", "▎ tranquera · status")}`);
  console.log(`  ├─ proxy  ${DEFAULT_PROXY_URL}`);
  console.log(`  └─ shell  ${shell?.name ?? "desconocido"}`);
  console.log("");

  if (!shell) {
    console.log(c("yellow", "  ⚠ shell no soportado, no puedo chequear el rc."));
  } else if (isConfigured(shell.rcPath)) {
    console.log(`  ${c("green", "✓")} configurado en ${shell.rcPath}`);
  } else {
    console.log(`  ${c("yellow", "✗")} NO configurado. Corré: ${c("bold", "npx tranquera setup")}`);
  }

  process.stdout.write("  · ping al proxy… ");
  const healthy = await pingHealth(DEFAULT_PROXY_URL);
  console.log(healthy ? c("green", "ok") : c("red", "no responde"));
  console.log("");
}

function cmdHelp() {
  console.log(`
  ${c("bold", "tranquera")} · firewall de Claude Code corporativo

  Uso:
    npx tranquera <comando>

  Comandos:
    setup     Configura ANTHROPIC_BASE_URL en tu shell rc (zsh/bash/fish).
    status    Muestra si estás configurado y si el proxy responde.
    help      Esta ayuda.

  Variables:
    TRANQUERA_PROXY_URL    Override de la URL del proxy (default: deploy del hack).

  Más info: https://github.com/platanus-hack/platanus-hack-26-ar-team-22
`);
}

// -------------------------------------------------------------
// Entry
// -------------------------------------------------------------

const command = process.argv[2] ?? "help";
const handlers = {
  setup: cmdSetup,
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
