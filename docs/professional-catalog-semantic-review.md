# Revisión semántica del catálogo activo — lote 1

Fecha: 2026-11-03. Fuente: consultas **solo lectura** al catálogo de Supabase activo. Esta revisión no modifica datos ni reemplaza la auditoría integral de 1.040 especialidades.

## Profesiones inspeccionadas (50 especialidades)
| Código permanente | Categoría actual | Especialidades | Hallazgo y decisión |
| --- | --- | ---: | --- |
| `tecnico_hvac_aire_acondicionado` | `climate` | 24 | Correcto: climatización, equipos, controles, VRF, inverter y mantenimiento. Mantener código; migración pendiente ajusta etiqueta a «Técnico HVAC». |
| `refrigeracion` | `climate` | 11 | Correcto: frío comercial/industrial, cámaras, transporte, máquinas de hielo. Migración pendiente separa categoría `refrigeration` sin cambiar código. |
| `ebanista` | `fashion` | 5 | **Clasificación incorrecta**: muebles, madera, tallado, enchapado y restauración pertenecen a carpintería/oficios de construcción. Migración pendiente mueve a `construction` sin alterar especialidades. |
| `panadero_pastelero` | `hospitality` | 5 | Etiqueta visible «Panadero» y especialidad «Pastelería». No borrar: existe solapamiento legítimo de habilidades. El código histórico combinado no debe renombrarse. |
| `repostero` | `hospitality` | 5 | Especialidades distintas y coherentes: pastelería fina, tortas, chocolatería, postres fríos, sin gluten. Conservar como profesión separada. |

## Decisiones de compatibilidad
1. No mover «Pastelería» de Panadero automáticamente: una selección existente podría representar experiencia real.
2. No fusionar Panadero y Repostero: cambiaría asociaciones y verificaciones históricas.
3. No convertir Refrigeración en subespecialidad de HVAC: son profesiones independientes.
4. Aplicar cambios de categoría mediante migraciones con código estable; no actualizar registros de usuarios o sellos.
5. **Pendiente**: revisar semánticamente las otras 990 especialidades y validar las migraciones pendientes contra un clon representativo antes de desplegar.

## Riesgos para fase 1
Las profesiones declaradas deben permanecer separadas de credenciales y sellos; el límite de profesiones no se elimina hasta verificar los RPC, la vista pública de JCard y las pruebas de regresión. La aprobación de CI sobre datos sintéticos no acredita seguridad de despliegue en producción.
