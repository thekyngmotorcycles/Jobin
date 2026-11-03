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

## Segunda pasada: clasificación semántica
- **Ebanista** (código `ebanista`): se encontró en `fashion` pese a especialidades de muebles, madera, enchapados y restauración. Corregido en migración de desarrollo para `construction`, sin cambiar código ni especialidades.
- **Panadero** (`panadero_pastelero`): incluye «Pastelería» entre especialidades, mientras «Repostero» es profesión independiente. Mantener temporalmente ambas opciones: pueden coexistir como habilidades; revisar si hay duplicación funcional antes de retirar una especialidad.
- **HVAC y Refrigeración**: 24 y 11 especialidades respectivamente en Supabase; ambos códigos siguen bajo `climate` en la base activa. No desplegar sin validar la migración y la compatibilidad de perfiles.
- **Calidad de la auditoría**: comprobación estructural de todas las filas realizada; la revisión semántica individual de las 1.040 especialidades sigue abierta. No presentar como concluida.
- **CI**: las ejecuciones `4f068774` pasaron tanto Universal app checks como Expo development preview, antes de la nueva corrección de Ebanista.

## Tercera pasada — integridad y CI (2026-11-03)
- Falló la prueba «cabinetmaker belongs to construction and woodworking»: el fixture de CI clasifica originalmente `ebanista` como `design`, mientras Supabase activo lo clasifica como `fashion`. La migración ahora cambia a `construction` desde cualquier categoría previa, preservando código y especialidades.
- Se revisaron las 8 profesiones inactivas: instalador de cerámica y porcelanato, operador de excavadora, técnico de calderas/calefacción, vigilador y cuatro variantes de repartidor. No se reactivaron automáticamente: requieren decisión semántica sobre redundancia y alcance.
- No se encontraron nombres de profesión idénticos (normalizados) entre las profesiones activas, incluso comparando distintas categorías.
- Las pruebas del commit `d4e225cd` están pendientes al registrar esta nota. No se ha desplegado nada en Supabase.

## Cuarta pasada — CI y especialidades
- `4f366b6f`: **Universal app checks** y **Expo development preview** aprobados.
- Supabase: **0 especialidades huérfanas**; **10 especialidades** pertenecen a profesiones inactivas (conservar para no romper historial).
- La base activa aún no tiene `detallador_vehiculos` ni `piloto_drones`, y no tiene aplicada la corrección de `ebanista`; la aprobación CI no equivale a despliegue.
- Se agregaron aserciones automáticas sobre códigos/categorías obligatorios, nombres únicos de profesiones activas y categorías, especialidades sin referencias huérfanas y especialidades no duplicadas dentro de cada profesión. La comprobación de especialidades es condicional porque el fixture CI base no siempre instala esa tabla.

## Quinta pasada — especialidades y clasificación
- Commit `20a7d037`: ambas ejecuciones CI completaron con éxito.
- Consulta de integridad de Supabase: 0 especialidades huérfanas; 10 especialidades de profesiones inactivas.
- Cinco profesiones activas tienen 4 especialidades (el resto tiene 5 o más): `valet_parking`, `farmaceutico`, `paseador_de_perros`, `repartidor_alimentos_insumos` y `repartidor_cartas_paqueteria`. **Cuatro no es un error por sí solo**; revisar cobertura de especialidades por calidad, no por cantidad.
- `joyero_relojero`, `tapicero` y `zapatero` están en `fashion`; mantener provisionalmente: la artesanía, el calzado y la tapicería pueden tener ámbitos de moda/interiorismo. La asignación no es inequívocamente errónea.
- Se confirmó que Supabase activo aún mantiene `ebanista` en `fashion`; la migración de corrección aprobada por CI no se ha desplegado.
- Pendiente: pruebas funcionales de reemplazo de profesión principal y lectura pública de JCard; la aprobación de CI actual no garantiza ese flujo.
