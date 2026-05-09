import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/admin-session'

const MAX_DOC_CHARS = 30_000

const EXTRACTION_SYSTEM = `Sos un asistente que digitaliza políticas institucionales de documentos corporativos para que el equipo técnico las reciba como contexto mientras trabaja con un asistente AI. El objetivo no es bloquear sino informar: cada política que extraés se convierte en una regla que Tranquera puede compartir con el dev en el momento oportuno, ayudándolo a entregar el mejor trabajo posible dentro de los lineamientos de la empresa. Las políticas pueden cubrir cualquier área: tecnología, código, comunicación, cultura, objetivos estratégicos, seguridad, legal, o cualquier otra directiva que un dev deba tener presente. Respondé SOLO con JSON válido, sin markdown ni bloques de código.`

const EXTRACTION_USER = (text: string) => `Dado el siguiente documento corporativo, extraé todas las políticas institucionales relevantes para el equipo técnico.

El criterio de inclusión es amplio: incluí cualquier directiva, lineamiento, objetivo, restricción o buena práctica que un dev debería conocer al momento de escribir código, tomar decisiones técnicas o interactuar con un asistente AI. No te limitás a seguridad de datos — también son válidas reglas de arquitectura, estándares de código, objetivos de negocio, restricciones legales, normas de comunicación, valores culturales, etc.

Para cada política encontrada, producí un objeto con:
- slug: identificador snake_case corto y descriptivo (ej: "prefer_typescript", "no_cliente_data_en_prompts", "arquitectura_microservicios")
- domain: el más apropiado de [credentials, pii, internal_paths, business_policy, code]
- layer: "nl" para reglas en lenguaje natural (la mayoría), "regex" solo si el doc especifica un patrón exacto, "pattern" solo si refiere a tipos de archivo
- rule: descripción en español rioplatense (1-2 oraciones) redactada como consejo útil para el dev, no como prohibición. Explicá qué se espera y por qué importa para el trabajo.
- proposed_pattern: null, o regex string si layer='regex'
- default_action: usá "WARN" en la gran mayoría de los casos — es el default para lineamientos, buenas prácticas y objetivos. "BLOCK" es la excepción extrema (restricción legal o de seguridad absolutamente indiscutible); si tenés dudas, usá "WARN". "REDACT" solo para datos sensibles estructurados que nunca deben salir. "LOG" para auditoría silenciosa sin interrumpir al dev.
- severity: "high" para restricciones críticas o legales, "medium" para lineamientos importantes, "low" para buenas prácticas y recomendaciones

Devolvé: { "policies": [ ...objetos... ] }
Si el documento no contiene directivas aplicables al trabajo técnico: { "policies": [] }

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
  const session = await getAdminSession()
  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

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
  } catch {
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
