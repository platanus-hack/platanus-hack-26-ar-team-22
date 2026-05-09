# 09 — Google Docs Policy Import

> El admin pega la URL de un Google Doc **público** con políticas de seguridad escritas en lenguaje natural. Claude extrae las políticas propuestas y las envía a la approval queue (`rule_suggestions`), donde el admin las revisa antes de activarlas.

---

## Contexto

Las empresas ya tienen sus políticas de seguridad documentadas en Google Docs. Hoy el admin tiene que releer ese doc y traducirlo a mano al rule builder de Tranquera.

Con este feature: el admin pega la URL del doc → Claude lo lee y extrae N reglas → el admin las revisa en `/admin/suggestions` y acepta las que tienen sentido. Un doc puede generar múltiples políticas en un solo paso.

**Restricción de etapa**: el doc debe estar compartido públicamente ("cualquier persona con el enlace puede ver"). No hay OAuth ni credenciales de Google — el backend fetchea el contenido usando la URL de exportación pública de Google Docs.

**Bloqueadores**: spec 04 (admin web + approval queue), spec 00 (enums y convenciones).

---

## Goals

- Formulario en `/admin/rules` para pegar una URL de Google Doc público.
- Backend que: (1) convierte la URL al endpoint de exportación de texto plano, (2) fetchea el contenido, (3) manda a Claude Haiku para extracción estructurada de políticas, (4) inserta los resultados en `rule_suggestions` con `status='pending'`.
- Las sugerencias importadas aparecen en `/admin/suggestions` con badge `// gdoc` para distinguirlas de las del AI Suggestor.
- Nuevo valor en enum `PolicySource`: `google_workspace` (para cuando el admin acepta una sugerencia y se promueve a `policies`).

## Non-Goals

- No OAuth / Google Workspace credentials.
- No docs privados — solo públicos ("cualquier persona con el enlace").
- No Google Sheets ni Slides — solo Docs.
- No importación periódica / webhook de cambios.
- No edición del doc desde Tranquera.

---

## User Stories

- **Como compliance officer**, quiero pegar la URL de nuestro "Manual de Seguridad IT" (compartido públicamente) y que Tranquera me proponga las reglas a activar, sin transcribirlas a mano.
- **Como admin**, quiero revisar las reglas extraídas antes de que se activen — si Claude interpretó mal algo, lo rechazo o edito.
- **Como demo runner**, quiero mostrar: "tenemos un doc de políticas en Google Docs → Tranquera las importa → las reviso y acepto con un click".

---

## Acceptance Criteria

- [ ] Formulario "Importar desde Google Doc" en `/admin/rules`: campo URL + botón "Extraer políticas".
- [ ] `POST /api/admin/gdoc/import` extrae el `<DOC_ID>` de la URL, fetchea `https://docs.google.com/document/d/<DOC_ID>/export?format=txt`, llama a Haiku y devuelve las propuestas.
- [ ] Cada propuesta se inserta en `rule_suggestions` con `source_hint='google_workspace'` y `status='pending'`.
- [ ] Las sugerencias aparecen en `/admin/suggestions` con badge `// gdoc` visualmente diferenciado.
- [ ] Si la URL no es un Google Doc válido → error: `"La URL no corresponde a un Google Doc válido"`.
- [ ] Si el doc no es público (fetch devuelve 401/403) → error: `"El documento no es público. Compartilo como 'cualquier persona con el enlace puede ver'"`.
- [ ] Si el doc tiene más de 30 000 caracteres, se trunca antes de mandar a Haiku y se muestra un aviso al admin.
- [ ] Si Haiku no encuentra políticas → mensaje: `"No encontramos políticas de seguridad en el documento. Revisá que el contenido describe reglas de datos."`.
- [ ] El enum `PolicySource` incluye `google_workspace` con su migración correspondiente.

---

## Interfaces / Contratos

### Endpoint

```
POST /api/admin/gdoc/import
Body: { docUrl: string }
Headers: admin session cookie

Response 200:
{
  imported: number,
  truncated: boolean,
  suggestions: [{
    id: string,
    proposedSlug: string,
    proposedDomain: string,
    proposedRule: string,
    proposedAction: "BLOCK" | "REDACT" | "WARN" | "LOG",
    proposedSeverity: "low" | "medium" | "high"
  }]
}

Response 400: { error: string }
```

### Extracción del ID y fetch del contenido

```
URL de entrada:  https://docs.google.com/document/d/<DOC_ID>/edit
                 https://docs.google.com/document/d/<DOC_ID>/view
                 https://docs.google.com/document/d/<DOC_ID>/  (cualquier sufijo)

URL de export:   https://docs.google.com/document/d/<DOC_ID>/export?format=txt

El fetch es un GET sin headers de auth. Si el doc es privado, Google responde
con redirect a login (status 200 con HTML de login) o 403 directo.
Validar que la respuesta es text/plain antes de procesar.
```

### Prompt de extracción a Haiku

```
System: Sos un asistente de compliance que extrae políticas de seguridad de datos
        de documentos corporativos. Respondé SOLO con JSON válido, sin markdown
        ni bloques de código.

User: Dado el siguiente texto de un documento de políticas corporativas,
      extraé todas las reglas de seguridad de datos que debería aplicar
      un firewall de prompts de IA.

      Para cada regla identificada, producí un objeto con:
      - slug: identificador snake_case corto (ej: "no_customer_names")
      - domain: uno de [credentials, pii, internal_paths, business_policy, code]
      - layer: "nl" para reglas en lenguaje natural (la mayoría),
               "regex" solo si el doc especifica un patrón exacto,
               "pattern" solo si refiere a tipos de archivo
      - rule: descripción clara en español rioplatense (1-2 oraciones)
      - proposed_pattern: null, o regex string si layer='regex'
      - default_action: "BLOCK" | "REDACT" | "WARN" | "LOG"
      - severity: "low" | "medium" | "high"

      Devolvé: { "policies": [ ...objetos... ] }
      Si no hay políticas de seguridad de datos: { "policies": [] }

      Documento:
      <DOCUMENT_TEXT>
```

---

## Schema — cambios en Prisma

### Enum `PolicySource` (nuevo valor)

```prisma
enum PolicySource {
  seed
  admin
  ai_suggestor     @map("ai-suggestor")
  google_workspace @map("google-workspace")  // ← nuevo
}
```

### Campo `sourceHint` en `RuleSuggestion`

```prisma
sourceHint  String?  @map("source_hint")  // "google_workspace" | null
```

Permite distinguir el origen en la UI sin romper el flujo de aprobación existente.

---

## Componentes UI clave

- `<GdocImportForm>` — input URL + botón "Extraer políticas" + estado loading + resultado inline ("N políticas enviadas a la cola de revisión").
- Badge `// gdoc` en `<SuggestionCard>` en `/admin/suggestions`.

---

## Tasks

- [ ] **T1** — Migración Prisma: valor `google_workspace` en `PolicySource`, campo `source_hint` en `rule_suggestions`. Done: `pnpm prisma migrate dev` corre sin errores.
- [ ] **T2** — `POST /api/admin/gdoc/import`: parseo de URL, fetch del contenido, llamada a Haiku con validación zod de la respuesta, inserción en `rule_suggestions`. Done: dado un doc público de prueba, se generan filas en la tabla.
- [ ] **T3** — UI en `/admin/rules`: `<GdocImportForm>` con estados (idle / loading / success / error). Done: flujo completo desde el admin sin tocar la consola.
- [ ] **T4** — Badge `// gdoc` en `/admin/suggestions`. Done: las sugerencias de GDocs son visualmente distinguibles de las del AI Suggestor.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Doc privado que devuelve HTML de login en vez de 403 | Verificar `Content-Type: text/plain` antes de procesar; si es HTML → error claro al admin |
| Doc muy largo (> 30k chars) | Truncar antes de mandar a Haiku + flag `truncated: true` en la respuesta |
| Haiku devuelve JSON malformado | Validar con zod; si falla parseo → error 500 con mensaje de retry |
