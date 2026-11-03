# Contrato de ampliación del catálogo profesional (Jobin)

## Modelo y compatibilidad
- `profession_categories.code` y `profession_catalog.code` son identificadores permanentes. Nunca reutilizar un código ni cambiarlo por una corrección ortográfica.
- Las especialidades pertenecen a `profession_catalog.code`, no a una categoría general. Conservar etiquetas existentes si hay selecciones históricas; añadir etiquetas nuevas en lugar de sobrescribir datos asociados.
- Una profesión declarada NO equivale a una credencial, licencia, revisión o sello verificado.
- Categorías y profesiones retiradas deben desactivarse (`active=false`), no eliminarse cuando existan referencias históricas.
- La categoría puede cambiar sin cambiar el código de la profesión. Verificar que la categoría destino existe antes de aplicar.
- Cada nueva profesión debe tener categoría válida, nombre y código únicos, al menos una especialidad útil y orden estable.
- No ejecutar migraciones destructivas sobre `person_professions`, `profession_seals` ni credenciales.

## Procedimiento obligatorio para agregar profesiones
1. Revisar catálogo activo y repositorio para evitar sinónimos duplicados; elegir código permanente en minúsculas con guiones bajos.
2. Definir categoría existente o crear una nueva con código permanente. Registrar profesión y especialidades con migración **aditiva**.
3. Usar `INSERT ... ON CONFLICT (code) DO NOTHING` para códigos existentes; si un código existente tiene otra definición, **detener y revisar**, no reemplazar silenciosamente su categoría o etiqueta.
4. Para especialidades, usar `ON CONFLICT (profession_code,label) DO NOTHING`; nunca borrar selecciones históricas como efecto de una ampliación.
5. Ejecutar pruebas en base desechable: primera aplicación, repetición, duplicados, referencias inválidas, conservación de usuarios/sellos y consulta del catálogo en la aplicación.
6. Comparar los códigos nuevos con Supabase activo mediante consultas **solo lectura**; revisar colisiones y migraciones pendientes antes de autorizar cualquier despliegue.
7. Publicar solo después de aprobar CI y revisar el plan de reversión. Si hay datos reales asociados, desactivar en vez de eliminar.

## Separación de etapas
La ampliación segura del catálogo es independiente de la fase 1 (declaración de profesiones ilimitadas, una principal y cinco secundarias visibles) y de la fase 2 (requisitos legales por jurisdicción). Ninguna ampliación concede verificaciones automáticas.

## Pruebas
`tests/catalog-migration-idempotence.test.sql` simula el catálogo anterior, aplica migraciones dos veces y verifica especialidades y referencias; también prueba la creación de una categoría/profesión futura y restricciones de integridad. Este contrato es una política de mantenimiento, no sustituye una revisión semántica completa de las 1.040 especialidades activas.
