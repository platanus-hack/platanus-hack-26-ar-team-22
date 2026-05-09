// Resolución de org al login.
//
// Diferenciamos entre el auth callback (no crea nada) y los call-sites
// específicos:
//   - `/admin/*` crea org como admin si el usuario logueó por web y todavía
//     no tiene member (admin sign-up transparente).
//   - `/cli/connect` joinea como dev si el device code trae `org_invite_id`,
//     y si no, rechaza sin crear nada.
//
// El JWT callback solo llama a `resolveOrgForUser`, que devuelve null cuando
// no hay membership. Los call-sites deciden qué hacer con ese null.

import { prisma } from "@/lib/prisma";

export type OrgResolution = {
  orgId: string;
  memberId: string;
  role: "admin" | "dev";
};

/**
 * Resuelve membership existente. NUNCA crea nada.
 *
 * 1) Si el user ya tiene member.userId === user.id → return.
 * 2) Si hay member con email === user.email y userId === null (admin lo
 *    invitó por email) → linkeamos userId y devolvemos.
 * 3) Si no hay nada → null. El call-site decide (admin onboarding crea org;
 *    CLI rechaza salvo que tenga org_invite_id).
 */
export async function resolveOrgForUser(input: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<OrgResolution | null> {
  const linked = await prisma.member.findUnique({
    where: { userId: input.userId },
  });
  if (linked) {
    return {
      orgId: linked.orgId,
      memberId: linked.id,
      role: linked.role,
    };
  }

  const invited = await prisma.member.findFirst({
    where: { email: input.email, userId: null },
    orderBy: { createdAt: "asc" },
  });
  if (invited) {
    const updated = await prisma.member.update({
      where: { id: invited.id },
      data: { userId: input.userId },
    });
    return {
      orgId: updated.orgId,
      memberId: updated.id,
      role: updated.role,
    };
  }

  return null;
}

// =============================================================
// Helpers para los call-sites que sí pueden crear membership.
// =============================================================

const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "yandex.com",
]);

function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1) return null;
  return email.slice(at + 1).toLowerCase().trim();
}

function slugFromDomain(domain: string): string {
  const base = domain.split(".")[0] ?? domain;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function randomShortId(len = 6): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function nextAvailableOrgId(slug: string): Promise<string> {
  let candidate = slug;
  let n = 2;
  while (await prisma.organization.findUnique({ where: { id: candidate } })) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

function suggestOrgId(email: string): string {
  const domain = emailDomain(email);
  if (domain && !FREE_EMAIL_PROVIDERS.has(domain)) {
    const slug = slugFromDomain(domain);
    if (slug) return slug;
  }
  return `org-${randomShortId(6)}`;
}

function suggestOrgName(email: string, displayName?: string | null): string {
  const domain = emailDomain(email);
  if (domain && !FREE_EMAIL_PROVIDERS.has(domain)) {
    const base = domain.split(".")[0] ?? domain;
    return base.charAt(0).toUpperCase() + base.slice(1);
  }
  const first = displayName?.split(" ")[0];
  return first ? `${first}'s org` : "Mi organización";
}

/**
 * Admin sign-up: crea org nueva + member admin owner. Solo se llama desde
 * el flujo web cuando el user llega a /admin/* sin org. Idempotente: si
 * por race condition ya existe member para este userId, devuelve ese.
 */
export async function createOrgForNewAdmin(input: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<OrgResolution> {
  const existing = await resolveOrgForUser(input);
  if (existing) return existing;

  const orgId = await nextAvailableOrgId(suggestOrgId(input.email));
  const orgName = suggestOrgName(input.email, input.name);

  const org = await prisma.organization.create({
    data: { id: orgId, name: orgName },
  });
  const member = await prisma.member.create({
    data: {
      orgId: org.id,
      email: input.email,
      role: "admin",
      userId: input.userId,
    },
  });

  return {
    orgId: org.id,
    memberId: member.id,
    role: "admin",
  };
}

export type CliJoinError =
  | { kind: "no_invite"; email: string }
  | { kind: "org_not_found"; orgId: string }
  | { kind: "already_in_other_org"; currentOrgId: string };

/**
 * CLI onboarding: el dev viene de `/cli/connect` con un device code que
 * tiene `org_invite_id` opcional.
 *
 * - Si ya tiene member → return ese (idempotente, p.ej. admin que corre el CLI).
 * - Si pidió joinear a una org distinta de la que ya pertenece → error.
 * - Si tiene org_invite_id → crea member como dev en esa org.
 * - Si no → error "no perteneces a ninguna org".
 */
export async function joinViaCli(input: {
  userId: string;
  email: string;
  name?: string | null;
  orgInviteId: string | null;
}): Promise<{ ok: true; resolution: OrgResolution } | { ok: false; error: CliJoinError }> {
  const existing = await resolveOrgForUser(input);
  if (existing) {
    if (input.orgInviteId && existing.orgId !== input.orgInviteId) {
      return {
        ok: false,
        error: { kind: "already_in_other_org", currentOrgId: existing.orgId },
      };
    }
    return { ok: true, resolution: existing };
  }

  if (!input.orgInviteId) {
    return { ok: false, error: { kind: "no_invite", email: input.email } };
  }

  const org = await prisma.organization.findUnique({
    where: { id: input.orgInviteId },
  });
  if (!org) {
    return { ok: false, error: { kind: "org_not_found", orgId: input.orgInviteId } };
  }

  const member = await prisma.member.create({
    data: {
      orgId: org.id,
      email: input.email,
      role: "dev",
      userId: input.userId,
    },
  });

  return {
    ok: true,
    resolution: {
      orgId: org.id,
      memberId: member.id,
      role: "dev",
    },
  };
}
