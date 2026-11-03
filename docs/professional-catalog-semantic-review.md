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
