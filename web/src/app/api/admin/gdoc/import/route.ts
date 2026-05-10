import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-session'

const MAX_DOC_CHARS = 30_000

const EXTRACTION_SYSTEM = `Sos un asistente que digitaliza políticas institucionales de documentos corporativos para que el equipo técnico las reciba como contexto mientras trabaja con un asistente AI. Tu trabajo es extraer TODAS las políticas que el documento mencione, sin importar si parecen técnicas, culturales, legales, comunicacionales o de cualquier otra índole. Si el documento dice que algo es una política, regla, lineamiento, directiva o restricción — la extraés, sin filtrar. Respondé SOLO con JSON válido, sin markdown ni bloques de código.`

const EXTRACTION_USER = (text: string) => `Extraé TODAS las políticas, reglas, directivas o restricciones que mencione el siguiente documento. Tu criterio es maximalista: si el texto dice que "no se debe hacer X", "está prohibido Y", "la empresa requiere Z", o cualquier formulación similar — es una política y la incluís.

No filtrés por relevancia técnica. Una política cultural, de comunicación, de comportamiento, legal, de seguridad, de datos o de cualquier otro tipo — todas se incluyen. Si el documento explícitamente llama a algo "política", incluílo siempre.

Para cada política encontrada, producí un objeto con:
- slug: identificador snake_case corto y descriptivo
- domain: el más apropiado de [credentials, pii, internal_paths, business_policy, code] — cuando no encaje bien en ningún otro, usá "business_policy"
- layer: "nl" para lenguaje natural (usá este por defecto), "regex" solo si hay un patrón exacto, "pattern" solo si refiere a tipos de archivo
- rule: la política tal como está expresada en el documento, en español rioplatense, 1-2 oraciones
- proposed_pattern: null (salvo que sea un regex literal)
- default_action: "WARN" por defecto para casi todo; "BLOCK" solo para restricciones absolutas e indiscutibles; "REDACT" solo para datos sensibles estructurados; "LOG" para auditoría silenciosa
- severity: "high" para restricciones críticas, "medium" para lineamientos importantes, "low" para recomendaciones

Devolvé: { "policies": [ ...objetos... ] }
Solo devolvés { "policies": [] } si el documento literalmente no contiene ninguna regla, directiva o restricción de ningún tipo.

Documento:
${text}`

const PolicySchema = z.object({
  slug: z.string(),
  domain: z.enum(['credentials', 'pii', 'internal_paths', 'business_policy', 'code']),
  layer: z.enum(['regex', 'pattern', 'nl']),
  rule: z.string(),
  proposed_pattern: z.string().nullable().optional(),
  default_action: z.enum(['BLOCK', 'REDACT', 'WARN', 'LOG']),
  severity: z.enum(['low', 'medium', 'high']),
})

const HaikuResponseSchema = z.object({ policies: z.array(PolicySchema) })

function extractDocId(url: string): string | null {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  return match?.[1] ?? null
}

async function fetchDocText(docId: string): Promise<{ text: string; truncated: boolean }> {
  const res = await fetch(
    `https://docs.google.com/document/d/${docId}/export?format=txt`,
    { redirect: 'follow' }
  )

  if (!res.ok) throw new Error('private_or_not_found')

  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('text/plain')) throw new Error('private_or_not_found')

  const raw = await res.text()
  return { text: raw.slice(0, MAX_DOC_CHARS), truncated: raw.length > MAX_DOC_CHARS }
}

function parseHaikuJson(raw: string): z.infer<typeof HaikuResponseSchema> {
  // Strip optional markdown code fences before parsing
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
  return HaikuResponseSchema.parse(JSON.parse(cleaned))
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole()
  if (!auth.ok) return auth.response
  const session = auth.session

  let docUrl: string
  try {
    const body = await request.json()
    docUrl = body.docUrl
    if (!docUrl || typeof docUrl !== 'string') throw new Error()
  } catch {
    return Response.json({ error: 'docUrl requerido' }, { status: 400 })
  }

  const docId = extractDocId(docUrl)
  if (!docId) {
    return Response.json(
      { error: 'La URL no corresponde a un Google Doc válido' },
      { status: 400 }
    )
  }

  let text: string
  let truncated: boolean
  try {
    ;({ text, truncated } = await fetchDocText(docId))
  } catch (err) {
    if (err instanceof Error && err.message === 'private_or_not_found') {
      return Response.json(
        {
          error:
            "El documento no es público. Compartilo como 'cualquier persona con el enlace puede ver'",
        },
        { status: 400 }
      )
    }
    throw err
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: 'ANTHROPIC_API_KEY no configurada en el servidor. Contactá al administrador.' },
      { status: 500 }
    )
  }

  const client = new Anthropic()
  let rawJson: string
  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: [{ type: 'text', text: EXTRACTION_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: EXTRACTION_USER(text) }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('unexpected_response_type')
    rawJson = block.text
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('API key') || msg.includes('authentication') || msg.includes('auth_token')) {
      return Response.json(
        { error: 'Error de autenticación con la API de IA. Verificá que ANTHROPIC_API_KEY esté configurada.' },
        { status: 500 }
      )
    }
    return Response.json(
      { error: 'Error al procesar el documento con IA. Intentá de nuevo.' },
      { status: 500 }
    )
  }

  let parsed: z.infer<typeof HaikuResponseSchema>
  try {
    parsed = parseHaikuJson(rawJson)
  } catch {
    return Response.json(
      { error: 'No pudimos interpretar la respuesta de IA. Intentá de nuevo.' },
      { status: 500 }
    )
  }

  if (parsed.policies.length === 0) {
    return Response.json(
      {
        error:
          'No encontramos políticas institucionales en el documento. Revisá que el contenido describe directivas, reglas o lineamientos corporativos.',
      },
      { status: 400 }
    )
  }

  const orgId = session.orgId

  const suggestions = await Promise.all(
    parsed.policies.map((p) =>
      prisma.ruleSuggestion.create({
        data: {
          orgId,
          proposedSlug: p.slug,
          proposedDomain: p.domain,
          proposedLayer: p.layer,
          proposedRule: p.rule,
          proposedPattern: p.proposed_pattern ?? null,
          proposedAction: p.default_action,
          proposedSeverity: p.severity,
          sourceHint: 'google_workspace',
          matchCount: 0,
          examples: [],
        },
      })
    )
  )

  return Response.json({
    imported: suggestions.length,
    truncated,
    suggestions: suggestions.map((s) => ({
      id: s.id,
      proposedSlug: s.proposedSlug,
      proposedDomain: s.proposedDomain,
      proposedRule: s.proposedRule,
      proposedAction: s.proposedAction,
      proposedSeverity: s.proposedSeverity,
    })),
  })
}
