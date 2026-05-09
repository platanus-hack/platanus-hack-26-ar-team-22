/**
 * Prisma 7 config.
 *
 * En Prisma 7 la `datasource.url` ya no vive en `schema.prisma`. Acá la cargamos
 * desde la env (`.env.local` o el shell). Lo mismo aplica para extensiones
 * postgres como `vector`, que requieren el feature gate experimental.
 *
 * El `PrismaClient` runtime espera un `adapter` (ej. `@prisma/adapter-pg`)
 * cuando lo construimos en el proxy/web — eso vive en el código del cliente,
 * no acá.
 */

import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Cargamos en orden Next.js: `.env.local` gana sobre `.env`.
// `config()` no overridea por default, así que el primero gana.
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  experimental: {
    extensions: true,
  },
});
