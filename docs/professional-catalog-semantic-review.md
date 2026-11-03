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

## Lote 2 — Agricultura, animales, automotriz y belleza (119 especialidades)

Se inspeccionaron las etiquetas individuales de todas las especialidades activas de estas cuatro categorías mediante consulta solo lectura al catálogo alojado.

| Categoría | Profesiones | Especialidades | Evaluación |
| --- | ---: | ---: | --- |
| `agriculture` | 5 | 29 | Coherentes: cultivos, apicultura, ganadería, pesca y técnico agropecuario. |
| `animals` | 5 | 24 | Coherentes: adiestramiento, cuidado, paseo, peluquería y veterinaria. |
| `automotive` | 4 | 23 | Coherentes: carrocería, electricidad automotriz, mecánica y neumáticos. |
| `beauty` | 8 | 43 | Coherentes: cejas, pestañas, estética, uñas, maquillaje, masaje, peluquería y tatuaje. |

### Observaciones semánticas y regulatorias
- `mecanico` incluye «Mecánica de motocicletas» y «Mecánica de automóviles»: mantener ambas como especialidades de una profesión genérica; no inventar códigos nuevos.
- «Diagnóstico electrónico» aparece tanto en `mecanico` como en `electricista_automotriz`. Es una habilidad compartida válida, no un duplicado dentro de una misma profesión.
- `adiestrador_de_perros` incluye «Perros de asistencia». La etiqueta de especialidad no debe interpretarse como acreditación para entrenar animales de asistencia.
- `veterinario`, `masajista`, `tatuador` y técnicas estéticas pueden tener requisitos legales según jurisdicción; declarar una profesión no equivale a autorización para ejercer.
- «Microblading» está dentro de especialista en cejas; conservar sin inferir licencia sanitaria.
- `detallador_vehiculos` sigue pendiente de incorporación por migración, por lo que no se cuenta entre las cuatro profesiones automotrices activas de producción.

**Progreso acumulado: 169 / 1.040 especialidades revisadas; 871 pendientes.** La revisión no implica que las migraciones pendientes se hayan aplicado.

## Lote 3 — Arte, negocios, comercio y diseño (173 especialidades)

Revisión de las etiquetas de especialidades de cuatro categorías activas mediante consultas solo lectura al catálogo de producción.

| Categoría | Profesiones | Especialidades | Evaluación |
| --- | ---: | ---: | --- |
| `arts` | 11 | 55 | Actividades coherentes: interpretación, danza, música, producción, dirección, ilustración y sonido. |
| `business` | 9 | 52 | Coherentes: administración, finanzas, contabilidad, proyectos, marketing, recursos humanos, atención, secretariado y trading. |
| `commerce` | 5 | 46 | Coherentes: inmobiliaria, seguros, ventas, comercio electrónico e indumentaria. |
| `design` | 4 | 20 | Coherentes: diseño interior, gráfico, fotografía y edición audiovisual. |

### Consideraciones de producto y seguridad
- «Mezcla» figura tanto en productor musical como en técnico de sonido; no es un duplicado incorrecto porque se refiere a profesiones distintas.
- `trader_mercados_financieros` agrupa instrumentos financieros y técnicas de trading: declararse trader no debe equivaler a acreditación para asesorar inversiones o gestionar fondos ajenos.
- `agente_inmobiliario` y `corredor_de_seguros` pueden requerir autorización local; las especialidades no prueban licencias.
- `especialista_comercio_electronico` incluye herramientas/plataformas (Shopify, WooCommerce, Amazon Seller Central): conservarlas como habilidades, no como certificaciones otorgadas por dichas plataformas.
- `ilustrador` está en `arts` y `disenador_grafico` en `design`; no fusionar por similitud de herramientas.

**Progreso acumulado: 342 / 1.040 especialidades revisadas; 698 pendientes.** No se aplicaron migraciones a producción.

## Lote 4 — Construcción, salud y tecnología (269 especialidades)

Inspección individual de etiquetas agrupadas por profesión en Supabase activo (solo lectura).

| Categoría | Profesiones activas | Especialidades | Evaluación |
| --- | ---: | ---: | --- |
| `construction` | 23 | 125 | Oficios y especialidades congruentes; `ebanista` pendiente de mover desde `fashion`. |
| `health` | 12 | 67 | Especialidades médicas, odontológicas, farmacéuticas, terapéuticas y técnicas congruentes; alta sensibilidad regulatoria. |
| `technology` | 15 | 77 | Software, sistemas, datos, redes, soporte, IA y seguridad congruentes; `piloto_drones` pendiente de migración. |

### Riesgos y decisiones
- `plomero` incluye «Gas domiciliario»: **no** inferir habilitación de gasista a partir de esa especialidad. Exigir revisión de licencia por jurisdicción en fase 2.
- `electricista` incluye «Media tensión», «Instalaciones de emergencia» y «Energía solar»: una declaración no habilita a trabajar en instalaciones reguladas.
- `instalador_sistemas_contra_incendios` y `inspector_construccion` requieren tratamiento de permisos y atribuciones legales independiente del catálogo.
- `medico` incluye once especialidades clínicas (incluidas cirugía y psiquiatría); **no** mostrar ninguna como certificación de especialidad médica sin verificación de credenciales.
- `farmaceutico`, `enfermero_a`, `odontologo`, `psicologo`, `paramedico` y otras profesiones de salud requieren verificación jurisdiccional antes de conceder insignias de habilitación.
- `tecnico_de_celulares` especifica «Software y desbloqueo legítimo»; conservar ese alcance y evitar presentar acceso no autorizado como servicio.
- `ciberseguridad` contiene «Análisis de vulnerabilidades»: la declaración de especialidad no autoriza pruebas contra sistemas ajenos.
- `ingeniero_de_software` y `desarrollador_de_software` comparten Frontend/Backend: superposición legítima, no fusionar.
- La categoría `construction` incluye «Asistencia en climatización» en `ayudante_helper_tecnico`; no convertirlo en credencial HVAC.

**Progreso acumulado: 611 / 1.040 especialidades revisadas; 429 pendientes.** Esta revisión semántica no sustituye comprobaciones de migraciones ni verificación legal.

## Lote 5 — 12 categorías restantes (429 especialidades nuevas)

Revisión de etiquetas agrupadas por profesión de las categorías restantes, con consultas solo lectura.

| Categoría | Profesiones activas | Especialidades |
| --- | ---: | ---: |
| `education` | 9 | 47 |
| `engineering` | 8 | 41 |
| `fashion` | 8 | 40 |
| `hospitality` | 9 | 48 |
| `hotels` | 8 | 39 |
| `industry` | 5 | 25 |
| `legal` | 4 | 25 |
| `logistics` | 4 | 20 |
| `maintenance` | 8 | 41 |
| `security` | 3 | 15 |
| `sports` | 7 | 35 |
| `transport` | 12 | 58 |
| **Total de filas revisadas en lote** | **85** | **434** |

**Control de doble conteo:** las cinco especialidades de `ebanista` (en `fashion` activo) ya fueron revisadas en el lote 1. Por tanto, este lote aporta **429 especialidades únicas nuevas**, no 434. **Total acumulado: 1.040/1.040 especialidades activas únicas revisadas por correspondencia semántica con su profesión.**

### Hallazgos y decisiones
- **Clasificación pendiente:** `ebanista` en `fashion` debe pasar a `construction` con la migración ya preparada, sin cambiar su código ni sus cinco especialidades.
- **Tapicero:** incluye muebles, automotriz y náutica. `fashion` funciona como agrupación de oficios textiles, pero puede merecer categoría transversal futura; no migrar sin investigación de búsqueda y filtros.
- **Zapatero:** «Calzado ortopédico» es una habilidad declarada, no acreditación clínica.
- **Abogado, juez y notario:** especialidades jurídicas no equivalen a matrícula, nombramiento ni competencia jurisdiccional.
- **Piloto de avión/helicóptero, capitán marítimo, conductor profesional, operador de grúa:** la profesión declarada y las especialidades no deben presentar habilitación para operar vehículos o maquinaria.
- **Fumigador, técnico de ascensores y montacarguista:** requieren evaluar formación, permisos y seguros por región.
- **Instructor de natación:** «Natación terapéutica» no debe presentarse como licencia sanitaria.
- **Panadero/Repostero:** conservar el solapamiento de Pastelería (ya revisado en lote 1).
- **Docente, ingeniero y arquitecto:** distinguir credenciales académicas, títulos habilitantes y atribuciones locales.

### Cierre de la revisión semántica inicial
Se inspeccionaron las **1.040 especialidades activas únicas** en las 24 categorías de Supabase. La inspección fue una revisión de pertinencia por profesión, **no** una certificación de calidad terminológica, cobertura exhaustiva de oficios, cumplimiento legal o compatibilidad de todas las migraciones.

**Bloqueos antes de fase 1:** confirmar el estado de migraciones pendientes, reconciliar fixture GitHub (116 profesiones) con producción (196), probar preservación de asociaciones y sellos en una base de prueba representativa y auditar límites de profesiones en RPC/UI. No ejecutar migraciones en Supabase activo sin autorización.

## Corrección de conciliación de conteos (2026-11-03)

**Corrección importante del cierre anterior:** Supabase confirma **1.040 especialidades históricas en total, de las cuales 1.030 pertenecen a profesiones activas y 10 a profesiones inactivas**. El cierre previo de «1.040 especialidades activas» era incorrecto.

El lote 5 duplicó **15**, no cinco, especialidades ya inspeccionadas en el lote 1: cinco de `ebanista`, cinco de `panadero_pastelero` y cinco de `repostero`. Por ello el lote 5 aportó **419** especialidades únicas nuevas (434 − 15), y el acumulado real es **1.030/1.030 especialidades de profesiones activas**. Las **10 especialidades asociadas a profesiones inactivas siguen pendientes de revisión semántica específica**, aunque sus filas deben preservarse por compatibilidad histórica.

Esta conciliación se comprobó con `count(*) filter (where p.active)` y `count(*) filter (where not p.active)` sobre `profession_specialty_options` unida a `profession_catalog`. Ningún registro fue modificado.
