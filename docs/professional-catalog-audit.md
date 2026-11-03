# Jobin — Reglas obligatorias del catálogo profesional

## Jerarquía
**Categoría → Profesión → Especialidad.** El selector personal muestra categorías alfabéticas como encabezados y profesiones alfabéticas dentro de cada categoría. La JCard de negocios selecciona categorías, nunca profesiones. Las especialidades aparecen únicamente tras seleccionar una profesión y se guardan asociadas al código de esa profesión.

## Regla 1: códigos de profesión permanentes
El campo `profession_catalog.code` es una identidad estable. Nunca renombrar, reutilizar ni eliminar un código con referencias existentes. Corregir nombres mediante `label` y `short_label`; mantener intactos historiales, credenciales, sellos, experiencia y especialidades. Para fusiones, diseñar una migración explícita y reversible con auditoría de referencias.

## Regla 2: una categoría principal por profesión
Cada profesión activa debe tener exactamente una categoría principal válida, activa y referenciada por `profession_catalog.category`. Las categorías son agrupadores y no deben utilizarse como nombres de profesiones. Las profesiones similares pueden coexistir solo si su ámbito profesional es distinto.

## Regla 3: especialidades asociadas a profesión, no a categoría
Cada especialidad pertenece a un `profession_code` existente. No inferir especialidades desde `category`, ni transferirlas automáticamente al cambiar de profesión. Revisar duplicados normalizados, cobertura y relevancia. Guardar y mostrar especialidades por profesión.

## Despliegue seguro
1. Inventariar el catálogo actual en Supabase mediante consultas de solo lectura y compararlo con migraciones en GitHub.
2. Corregir nombres, relaciones y tests en `development`; evitar cambios destructivos.
3. Validar CI y ejecutar pruebas de reemplazo de profesión principal, borrado, JCard personal y selector empresarial.
4. Desplegar migraciones solo después de las pruebas; verificar catálogo, registros existentes y permisos.
5. No generar APK durante esta auditoría.

## Hallazgos iniciales (2026-11-03)
- Supabase actual: 24 categorías, 196 profesiones (188 activas), 1040 especialidades.
- Ninguna profesión huérfana de categoría; ninguna profesión activa sin especialidades.
- No se encontraron duplicados exactos normalizados dentro de la misma categoría ni de especialidades por profesión.
- Supabase todavía devuelve `Climatización HVAC` y `Refrigeración` como nombres de profesiones en los códigos `tecnico_hvac_aire_acondicionado` y `refrigeracion`, ambos en `climate`. La migración de GitHub no está desplegada.
- Los nuevos códigos `detallador_vehiculos` y `piloto_drones` aún no existen en Supabase activo.
- El esquema de pruebas de CI carece de la tabla opcional `profession_specialty_options`; las aserciones deben respetar esa diferencia.

## Pendientes de auditoría semántica
- Examinar individualmente los 196 nombres de profesión, las 24 categorías y las 1040 especialidades para identificar equivalencias, solapamientos y asignaciones discutibles.
- Verificar que las pruebas de reemplazo transaccional funcionen en la base de datos de desarrollo y que el nombre de la profesión principal aparezca correctamente en la JCard pública, no solo en el editor.
- No confundir aprobación de CI con despliegue en Supabase.
