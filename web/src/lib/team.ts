// Helpers compartidos entre /admin/team y la API de team.

import type { Member } from "@prisma/client";

export type MemberDTO = {
  id: string;
  email: string;
  role: "admin" | "dev";
  // null si todavía no logueó por primera vez (fue invitado pero no activó).
  linkedAt: string | null;
  createdAt: string;
};

export function toMemberDTO(m: Member & { user?: { emailVerified: Date | null } | null }): MemberDTO {
  return {
    id: m.id,
    email: m.email,
    role: m.role as "admin" | "dev",
    // Usamos createdAt del user vinculado para distinguir "pendiente" vs
    // "activo". Si no hay user, está pendiente.
    linkedAt: m.userId
      ? m.user?.emailVerified?.toISOString() ?? new Date(0).toISOString()
      : null,
    createdAt: m.createdAt.toISOString(),
  };
}

export function isValidEmail(value: string): boolean {
  // No regex perfecta, pero suficiente para feedback de UI antes del backend.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
