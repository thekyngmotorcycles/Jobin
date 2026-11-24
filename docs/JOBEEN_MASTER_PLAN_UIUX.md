# JOBEEN — Master Plan UI/UX v1.5
**Fecha:** 23 de noviembre de 2026  
**Estado:** v1.1 aprobada por el propietario el 23 de noviembre de 2026 como marco de diseño y planificación; v1.2 incorpora su nueva orden expresa de eliminar todas las apariencias globales salvo Royal Hive Light, Dark y selección Sistema. Registro documental autorizado; integración de este PR y ejecución de cada etapa requieren aprobación separada. Medidas candidatas y excepciones pendientes de revisión visual y validación física. No autoriza implementación, publicación ni gasto.  
**Decisión v1.3:** el propietario aprueba la filosofía permanente de producto, el filtro de seis preguntas, la organización funcional sin proliferación de submarcas y la interoperabilidad complementaria con herramientas empresariales. Se mantiene íntegra la decisión visual v1.2 y el alcance autorizado de cada etapa. No autoriza implementación de conectores ni cambios de código.

**Decisión v1.4:** el propietario aprueba un sistema propio de reputación basado en evidencia, independiente de IA. La IA es complementaria y futura; no es requisito, autoridad única ni dependencia del núcleo. Ver §1.6. Se conservan las decisiones v1.2 y v1.3.

**Decisión v1.5 (2026-11-24):** incorporar JQuote AI al plan, con presupuestos privados por voz, fotografía y video, revisión humana y catálogo de precios propio. Consolidar el orden operativo en §10, manteniendo las decisiones anteriores y autorizaciones por entrega.

**Repositorio de referencia:** `thekyngmotorcycles/Jobin`, rama `development`.

## 1. Propósito y decisiones
Jobeen es una plataforma mobile-first de streaming de trabajo real. Descubrir, emitir y participar en Lives es su prioridad; los Flashes amplían el alcance del creador, la identidad profesional genera confianza y las herramientas laborales convierten ese contenido en oportunidades. No es un CRM con video ni una superapp.

**Decisiones expresas:** dirección cromática Royal Hive; opción B para Compartir JCard (icono compacto junto a Panel y Editar JCard); solo diseño y planificación. Se conservan las normas previas de navegación, diseño, privacidad y trabajo. La ubicación propuesta del resto de funcionalidades, el detalle de tokens y los flujos de este documento requieren aprobación antes de implementarse. Los nombres JCenter, JQuote, JAssist, JTeam, JGifts y JStudio son denominaciones de trabajo; no implican nuevas pestañas ni aprobación comercial.

**Fuentes internas consultadas:** `AGENTS.md`, `DESIGN_RULES.md`, `docs/JOBEEN_PRODUCT_VISION.md`, `docs/DEVELOPMENT_STATUS.md`, rutas `src/app`, `src/theme/palettes.ts`, `src/theme/jobeen.ts`, `src/theme/modals.ts`, `src/theme/navigation.ts`, `src/components/JobinCard.tsx`, `src/components/JCardShareSheet.tsx` y decisiones previas. Las rutas existentes no demuestran por sí solas que una función esté lista en producción.

### 1.1 Filosofía permanente de producto — aprobada por el propietario (2026-11-23)

**Jobeen es un ecosistema profesional, potente por dentro y sencillo por fuera.** Su propósito es que las personas muestren su trabajo real, acrediten lo que saben hacer, construyan reputación profesional y generen oportunidades e ingresos. Para los negocios es un canal complementario de descubrimiento, captación de clientes, promoción de sus equipos y coordinación profesional selectiva. No pretende sustituir las herramientas empresariales especializadas ni convertirse en una superapp. El valor se mide por resultados útiles y recorridos fluidos, no por la cantidad de funciones.

**Ciclo de valor:** Live/Flash → descubrir profesional o empresa → consultar JCard y aptitudes acreditadas → contactar o solicitar presupuesto → asignar un trabajo cuando corresponda → completar el servicio y acreditar experiencia → fortalecer reputación y generar nuevas oportunidades. Cada función debe contribuir de forma demostrable a este ciclo o al aprendizaje y la conexión que lo sostienen.

### 1.2 Filtro obligatorio de nuevas funcionalidades

Antes de aprobar, diseñar o programar una función, responder estas seis preguntas:
1. ¿Refuerza la identidad profesional de Jobeen?
2. ¿Se conecta naturalmente con alguna función existente?
3. ¿Resuelve una necesidad real del usuario?
4. ¿Podemos incorporarla sin agregar otra pestaña principal?
5. ¿Podemos reutilizar una pantalla o herramienta existente?
6. ¿Podemos mantenerla fuera de la vista de quien no la necesita?

Las seis respuestas deben estar justificadas brevemente en la propuesta. Si alguna falla, simplificar, fusionar, replantear o posponer la función antes de invertir recursos; cualquier excepción exige aprobación explícita del propietario. Priorizar terminar y validar las funciones centrales; no copiar funciones de competidores solo porque existan. Evaluar recorridos, facilidad de descubrimiento, utilidad, retención y captación real de clientes, sin inventar métricas. Evitar pantallas, controles, nombres, flujos y registros duplicados. Cada vista tendrá una acción principal clara y acciones secundarias contextuales; mostrar capacidades progresivamente según rol, permisos, necesidad y plan contratado. Mantener la navegación global aprobada de cinco pestañas. No ocultar controles imprescindibles ni reducir accesibilidad. No usar estos principios para omitir privacidad, seguridad o moderación.

### 1.3 Límites y organización funcional

| Área | Dirección permanente |
|---|---|
| Lives, Flashes y JCard | Núcleo diferencial; potenciar streaming laboral, contenido y reputación profesional. |
| Casa, Mensajes, JShop | Conservar y enfocar en descubrimiento, relaciones, comercio útil y oportunidades profesionales; no crear feeds o bandejas redundantes. |
| Panel (JCenter) | Una entrada privada, contextual y progresiva; no una nueva pestaña. Adaptar a persona, profesional y empresa. |
| Equipo (JTeam) | Gestión complementaria de vínculos laborales, aptitudes, rendimiento y asignación; reutilizar roles y permisos existentes. |
| Rendimiento (JStats) | Capacidad dentro de Equipo y acreditaciones en JCard; no un producto o pestaña independiente. |
| Asignar trabajo (JDispatch) | Capacidad contextual de Trabajos/Equipo; recomendación explicable y supervisor confirma; no un producto independiente. |
| Presupuestos (JQuote) | Una solicitud/expediente compartido entre Mensajes > Servicios, Panel y accesos contextuales desde contenido y perfil. |
| Asistente (JAssist) | Ayuda contextual, optativa, identificada, con límites y revisión humana; no un chatbot global que compita por atención. |
| Destacados y regalos | Dentro de contenido y Videos; sin pestañas globales ni pagos simulados. |
| Formación (JAcademy) | Complementar aptitudes y reputación; desarrollar posteriormente sin desplazar Live. |
| Historias | Conservar sin expansión desproporcionada. |
| Comunidades independientes | Posponer; cualquier reconsideración debe superar el filtro de seis preguntas. |
| Citas | Fuera del roadmap de producto; no desarrollar. |

Los nombres internos no obligan a inventar submarcas visibles. Usar etiquetas claras: Panel, Equipo, Rendimiento, Asignar trabajo, Presupuestos, Asistente, Destacados y Regalos. Los accesos múltiples deben llevar al mismo objeto y respetar su contexto. Esta decisión fija la dirección, no autoriza eliminar rutas o datos ya existentes sin revisión y aprobación del alcance.

**Fuera del producto:** contabilidad general, nómina, impuestos, inventario industrial, ERP completo, vigilancia de empleados, rastreo laboral permanente, evaluaciones invasivas y videoconferencias corporativas genéricas. No reconstruir software especializado como ServiceTitan. Una funcionalidad complementaria y limitada de cotización, órdenes, coordinación y asignación es válida si refuerza el ciclo profesional. Las empresas deciden qué capacidades usan; no exigir reemplazar sus herramientas ni migrar todos sus datos.

### 1.4 Interoperabilidad empresarial: complementar, no sustituir

**Ejemplo de dirección, no integración existente:** una empresa que trabaja con ServiceTitan u otro sistema puede conservarlo como su sistema principal de clientes, órdenes, facturación e inventario. Jobeen puede aportar streaming laboral, visibilidad de marca/equipo, clientes potenciales, identidad profesional acreditada, aptitudes, recomendaciones de asignación y presupuestos propios cuando la empresa los necesite. El negocio puede usar solo descubrimiento y contacto, activar únicamente rendimiento/asignación, o utilizar el flujo propio de Jobeen sin depender de otro sistema. Business Premium debe aportar valor modular, sin obligar a contratar o configurar capacidades innecesarias. No fijar precios ni derechos de plan todavía.

- Diseñar contratos de integración desacoplados, adaptadores por proveedor solo cuando exista demanda y aprobación, y usar APIs oficiales y autorizadas, enlaces profundos cuando procedan, webhooks o importación/exportación controlada. Verificar disponibilidad real, permisos, términos, costes, límites y requisitos de asociación antes de prometer compatibilidad con un proveedor. No scraping ni accesos no autorizados.
- Configuración y consentimiento por organización; ámbitos mínimos y revocables, autenticación segura del servidor, secretos fuera del cliente, roles y separación de cuentas. La empresa elige si comparte solicitudes, órdenes, estados, identificadores, disponibilidad u otros campos necesarios. No transferir evaluaciones confidenciales o datos personales por defecto. Ninguna sincronización global automática.
- Definir explícitamente el sistema fuente de verdad para cada entidad/campo. Mantener identificadores externos, procedencia y trazabilidad, evitar dobles clientes, presupuestos, órdenes y asignaciones; sincronización idempotente, manejo de errores, conflictos y reintentos. No sobrescribir registros ni disparar órdenes/cobros/contratos en otro sistema sin autorización. Permitir desconexión y exportación según derechos y obligaciones, sin borrar datos ajenos.
- Preferir inicialmente el recorrido interno y conexiones simples de valor probado. Incorporar conectores de forma incremental sin cambiar el producto para ajustarlo a un único proveedor. Si una integración falla, preservar el trabajo local autorizado y explicar su estado. No crear infraestructura, SDK, conectores ni servicios de pago sin aprobación.

### 1.5 Aptitudes, trayectoria y recomendaciones responsables

JTeam puede registrar trabajos completados, especialidades, certificaciones, aptitudes demostradas, resultados verificables y observaciones internas proporcionales a la actividad. Separar estrictamente datos operativos confidenciales de la empresa y credenciales profesionales portables. Las acreditaciones de JCard deben identificar emisor, periodo, evidencia, nivel de verificación y vigencia; pueden conservar la experiencia histórica incluso tras cambiar de empresa, sin afirmar que una aptitud antigua demuestra capacidad actual. Las acreditaciones históricas previas a Jobeen requieren verificación, no inventar datos. El trabajador controla la visibilidad de sus credenciales compartibles; ofrecer acceso, corrección, impugnación, revocación justificada y tratamiento de información desactualizada. No publicar evaluaciones internas, rankings negativos permanentes ni datos de clientes. Salir de una empresa revoca accesos empresariales y no borra por defecto las acreditaciones legítimas del trabajador.

La recomendación de asignación se basará en requisitos del servicio, aptitudes acreditadas pertinentes, certificaciones vigentes, disponibilidad autorizada, experiencia reciente, distancia aproximada cuando necesaria y carga de trabajo. Explicar motivos, incertidumbre y datos faltantes. No usar rasgos protegidos ni proxies discriminatorios; no puntuar universalmente a todas las profesiones, ni vigilar a trabajadores, ni tomar decisiones automáticas de contratación, despido, sanción, remuneración o acceso al trabajo. El supervisor elige y confirma. Validar legalidad laboral, privacidad, sesgos y obligaciones aplicables antes de implementación real. Comenzar con reglas transparentes; IA solo si demuestra valor adicional y con supervisión humana. No convertir reputación en una sentencia permanente.

**Prioridad de ejecución:** mantener el roadmap vigente de seguridad, streaming, Royal Hive y funciones centrales. Este marco no inicia desarrollo de JStats, JDispatch, conectores, monetización o cambios de navegación; cada entrega requiere alcance, viabilidad y aprobación según AGENTS.md.

### 1.6 Sistema propio de reputación profesional — evidencia antes que IA (decisión permanente del propietario)

**Jobeen construye reputación a partir de evidencias acumuladas, no de opiniones aisladas ni puntuaciones inventadas.** El núcleo de aptitudes, historial, acreditaciones, estadísticas y recomendaciones deberá funcionar íntegramente sin modelos de IA, proveedores de IA, análisis de video ni suscripciones externas. Jobeen será responsable de las reglas, procedencia, registros, validación y cálculos deterministas en servidor. La IA será únicamente una capacidad complementaria futura; nunca la única fuente ni autoridad de acreditación.

**Cinco fuentes de evidencia que deben sostener el sistema propio:**
1. Empleadores o supervisores autorizados, con vínculo y ámbito profesional verificados: acreditaciones respaldadas por trabajos concretos, no concesión libre de aptitudes.
2. Resultados de trabajos reales, vinculados a órdenes y participantes confirmados, en Jobeen o mediante integraciones autorizadas: experiencia por especialidad, trabajos completados, resolución en primera visita y reincidencias atribuibles, con periodo, denominador, contexto y dificultad cuando se conozcan.
3. Certificados, licencias y formación de emisores verificados: distinguir formación teórica, evaluación práctica, licencia vigente y experiencia real.
4. Evaluaciones prácticas de especialistas cualificados y autorizados, con criterios por oficio, evidencia y control de conflictos de interés.
5. Opiniones de clientes vinculadas a servicios efectivamente recibidos: satisfacción, comunicación, puntualidad y atención; no equivalen a certificar competencia técnica.

El trabajador puede declarar una aptitud, aportar evidencia y solicitar revisión, pero nunca aprobar su propia acreditación ni modificar estadísticas verificadas. Distinguir claramente aptitud declarada, experiencia confirmada, evaluación práctica y certificación; no convertir categorías de evidencia en una jerarquía universal de habilidad. Usar un catálogo de aptitudes por oficio, criterios específicos, registros trazables con emisor, fecha, alcance, evidencia y vigencia; mostrar información insuficiente como tal, no como cero competencia. Evitar puntuaciones arbitrarias 0–100, comparaciones entre trabajos de complejidad distinta y rankings laborales permanentes. Las métricas se calculan en servidor desde eventos válidos, deduplicados, confirmados y atribuibles; contemplar correcciones, disputas, fraude, colusión y revisión independiente. El usuario puede consultar, impugnar y corregir datos mediante procedimientos apropiados. Proteger la privacidad de clientes y separar las evaluaciones empresariales confidenciales de las acreditaciones portables de JCard. Los independientes dispondrán de vías reales de validación sin depender de un empleador. Mantener intactos los requisitos de sellos de profesión y vínculos actuales: una acreditación histórica no equivale a una representación empresarial vigente ni restaura automáticamente un sello revocado.

**Integración y experiencia:** Rendimiento y Asignar trabajo permanecen dentro de Equipo/Trabajos; la JCard muestra credenciales portables autorizadas sin aumentar la navegación global. Reutilizar catálogo profesional, vínculo laboral, documentos y revisores existentes antes de crear servicios nuevos. El motor de recomendaciones podrá funcionar con reglas transparentes de requisitos, certificaciones, disponibilidad, experiencia pertinente y carga de trabajo, indicando razones y datos faltantes; el supervisor conserva la decisión humana. No vigilancia, análisis psicológico ni decisiones laborales automáticas. La integración con ServiceTitan u otros proveedores es optativa: las empresas pueden usar el sistema propio sin integraciones externas. Aplicar §1.4 a las importaciones y no confundir órdenes importadas con una evaluación técnica aprobada.

**IA futura, no requisito:** una vez que el streaming, el sistema propio de evidencia y las evaluaciones estén funcionando y validados, estudiar asistencia voluntaria para identificar procedimientos observables en grabaciones originales de Lives. La IA podrá preparar observaciones con evidencia y limitaciones para revisión humana competente; no podrá conceder, revocar o alterar reputación por sí sola, certificar calidad técnica no observable ni penalizar a quien no transmita. Una transmisión original tampoco demuestra por sí sola autenticidad o competencia. Sin consentimiento, sin evidencia suficiente o con servicio IA caído/no contratado, el núcleo y las vías no automatizadas deben seguir funcionando; no exigir transmitir para acreditar. No entrenar modelos, contratar APIs, analizar videos ni iniciar una función por esta decisión documental. Antes de una futura incorporación, validar precisión por oficio, costes, privacidad, seguridad y requisitos laborales; pedir aprobación expresa.

**Criterio de aceptación futuro:** demostrar un recorrido completo sin IA ni conexión a proveedor externo: registrar trabajo y evidencia, verificar autoridad y alcance, validar por tercero, calcular estadísticas trazables, mostrar acreditación autorizada en JCard, consultar aptitudes pertinentes en Equipo/Trabajos y revisar/impugnar resultados. Probar que autoacreditación, duplicados, accesos ajenos y datos no confirmados no generan reputación acreditada. El desarrollo efectivo de este sistema sigue pendiente y sujeto a prioridades y autorización de cada etapa.

## 2. Design System: Royal Hive
### 2.1 Tokens cromáticos
| Rol | Claro | Oscuro |
|---|---|---|
| Fondo general | #F5F7FA | #0B1422 |
| Superficie de tarjeta | #FFFFFF | #152235 |
| Modal / hoja / menú | #F0F3F7 | #152235 |
| Marca y acción primaria | #FFC629 | #FFC629 |
| Texto sobre amarillo | #0D1B2A | #0D1B2A |
| Texto e iconos principales | #0D1B2A | #F4F6FA |
| Texto secundario | #526071 | #ADB9C8 |
| Divisor decorativo | #DCE3EA | #2D3D51 |
| Contorno funcional | #526071 | #8293A8 |
| Fondo deshabilitado | #E1E5EB | #243348 |
| Texto deshabilitado | #687383 | #8293A8 |
| Fondo seleccionado sutil | #FFF0BC | #3D341C |
| Anillo de foco | #1D497E | #FFC629 |
| Fondo de medios | #0B1422 | #0B1422 |
| Texto sobre medios | #FFFFFF | #FFFFFF |
| Scrim modal | rgba(0,0,0,0.48) | rgba(0,0,0,0.62) |
| Scrim medios (base ajustable) | rgba(0,0,0,0.72) | rgba(0,0,0,0.72) |
| Azul histórico JCard | #00072E | #00072E |
| Plateado de marca | #C9CCD1 | #C9CCD1 |

El amarillo identifica acciones importantes y selección, no rellena todas las pantallas. El logo oficial, arte de las JCards, sellos, QR, fondos personalizados y exportaciones conservan sus contratos actuales. **Decisión permanente v1.2:** solo dos paletas globales, Royal Hive Light y Royal Hive Dark. La tercera opción del menú es Usar configuración del sistema (no una paleta), sigue cambios del OS y es la opción por defecto. Eliminar las cuatro paletas obsoletas y sus ramas de UI; conservar la selección explícita light/dark existente y normalizar cualquier otro valor antiguo a system. Los fondos, acabados, sellos y arte JCard permanecen independientes y no se eliminan. No usar color como única señal de estado.

### 2.2 Estados semánticos
| Estado | Fondo claro / texto claro | Fondo oscuro / texto oscuro |
|---|---|---|
| Éxito, disponible, aceptado | #E6F4EA / #14633A | #123523 / #86E3AB |
| Información | #EAF3FF / #1D497E | #152D4A / #A9CFFF |
| Pendiente, advertencia | #FFF0CA / #71480D | #3D2C14 / #FFD47A |
| Error, destructivo | #FBE8E8 / #922B2B | #482329 / #FFB4B4 |
| EN VIVO / grabación activa | #B91C1C / #FFFFFF | #B91C1C / #FFFFFF |

Botón primario: amarillo con texto oscuro. Secundario: contorno funcional y texto principal. Terciario: texto e icono sin fondo. Destructivo: semántica de error, confirmación si procede. Carga: conservar dimensiones, mostrar progreso y evitar reenvíos. Deshabilitado: explicación cuando sea necesaria. Selección inferior: contorno inactivo y relleno activo, sin círculo amarillo; conservar iconos oficiales y tamaño relativo de Videos.

### 2.3 Medidas, tipografía y comportamiento
| Elemento | Propuesta |
|---|---|
| Área táctil | mínimo 48 × 48 dp |
| Botón estándar | mínimo 48 dp de alto; radio 12 dp |
| Campo de texto | mínimo 48 dp; radio 12 dp; etiqueta persistente |
| Tarjeta | radio 16 dp (JCards excluidas) |
| Menú / diálogo / hoja inferior | radios 18 / 26 / 30 dp |
| Icono estándar / secundario | 24 / 20 dp; área táctil independiente |
| Espaciado | escala 4, 8, 12, 16, 24, 32 dp; margen usual 16 dp |
| Barra inferior | 58 dp + safe area; preservar acordeón |
| Tipografía | reutilizar familia, tamaños y pesos aprobados en `src/theme/typography.ts`; no introducir fuente ni modificar escala sin comparación física |

Menús: título breve, una fila por acción, icono solo si aporta sentido, chevron solo si navega. Hoja inferior para acciones rápidas; página completa para editar, aprobar presupuestos, configurar IA o revisar acuerdos. Diálogo centrado solo para decisiones breves o críticas. Contraste mínimo objetivo 4.5:1 texto normal, 3:1 texto grande y componentes esenciales, comprobando fondos reales, foco y overlays. No bloquear el escalado de texto. Pantallas pequeñas: preservar estructura, evitar cortes; usar scroll o adaptar distribución sin reducir objetivos táctiles. Respetar safe areas, teclado, temas, accesibilidad y reducción de movimiento.

La sección 13 amplía estas reglas con la referencia visual, escala tipográfica candidata, medidas adaptables y pruebas por dispositivo. En caso de diferencia, distinguir siempre los valores actuales de los candidatos; no sustituir automáticamente los tokens existentes.

## 3. Arquitectura de navegación
| Botón inferior (existente) | Contenido principal | Accesos contextuales |
|---|---|---|
| Casa | Para ti, Siguiendo, Empresas, Mapa; historias y publicaciones | Buscar, notificaciones, Crear, configuración |
| JShop | Productos, compras y ventas | Vender, Mis anuncios, ubicación, favoritos; enlace al chat JShop |
| Videos (centro, mayor tamaño) | En vivo, Flashes, JAcademy (propuesta de acceso) | Buscar por formato, Crear; JHighlights como destacados de Lives |
| Mensajes | Chats, JShop, Servicios (tercera bandeja propuesta) | Solicitudes, conversación, presupuesto, asistencia comercial |
| Perfil | JCard personal/empresa, contenido, CV | Panel, Editar JCard, Compartir, opciones del perfil |

Mantener nombre, iconos, rutas y acordeón. Se propone que Videos priorice En vivo como destino de entrada; actualmente la ruta Videos conduce a Flashes y existe una ruta Streams separada. El propietario aprobó En vivo inicial y recordar la última sección por cuenta (2026-11-24); implementación pendiente tras UI-01. No alterar la navegación desde una transmisión ni crear una sexta pestaña. El buscador conserva filtros y origen preseleccionado (Casa=Todo, Flashes=Flashes, Lives=Streams); ampliar con Cursos y Servicios cuando sus catálogos existan. Historial de búsqueda privado por cuenta. JHighlights no es Reels ni requiere pestaña global.

### 3.1 Casa: espacio de conversación profesional (opción híbrida aprobada)
Casa prioriza consultas, ideas, debates y trabajos compartidos; Videos mantiene la experiencia audiovisual. Autor y descripción primero, hasta tres líneas y expansión en sitio; menciones y enlaces accesibles. Mosaico con márgenes 12–16 dp, radios del sistema y altura acotada; máximo cuatro fotos visibles y contador +N; hasta diez fotos por publicación, compresión automática conservando proporciones, visor a pantalla completa con zoom y navegación. Vista previa reutiliza el mosaico; no crear otro flujo. Barra inferior sólida bajo los iconos y degradada por encima, conservando acordeón y cinco destinos. Comentarios con respuestas anidadas en fase posterior. No agregar dependencias ni desplegar sin aprobación.

### 3.2 Organización permanente de menús (aprobada 2026-11-24)
Casa: Cuenta y privacidad (Cuenta y seguridad, Privacidad, Cuentas bloqueadas cuando disponible); Preferencias (Apariencia, Idioma, Notificaciones, Contenido, Fotos/videos/datos, Accesibilidad); Información y soporte (Normas y políticas, Ayuda y soporte); Cerrar sesión con confirmación existente. Perfil propio: Mi actividad (Guardados generales cuando disponibles, Registro de actividad cuando disponible, Mis contactos), Desarrollo profesional (Certificados y sellos, Oportunidades laborales, Reseñas de empresas, Mi zona profesional). Mantener galería JCards privada en su pestaña, Editar JCard y Compartir en sus accesos propios. Panel: Contenido, Estadísticas, Mi empresa, Equipo, Presupuestos, Cursos, Ingresos, Asistente, revisión de acreditaciones según rol. Mantener accesos empresa/revisor actuales hasta que Panel los sustituya; demo solo desarrollo. Dispositivos/sesiones y verificación en Cuenta y seguridad; permisos en Privacidad; pedidos/pagos en JShop cuando disponible; suscripciones y tiempo pospuestos. Ocultar entradas sin destino funcional, conservar rutas históricas y metadatos de búsqueda. No duplicar datos ni crear funciones nuevas para rellenar menús. Mantener perfiles visitante y permisos independientes.

## 4. Mapa de pantallas y acciones
| Pantalla / destino | Acceso primario | Acción principal | Reutilizar / cambiar |
|---|---|---|---|
| Casa | Casa | Consumir contenido; publicar desde acceso existente | Feed, historias, buscador, mapa; conservar filtros |
| Crear | Acceso Crear existente | Publicación / Historia / Flash / En vivo | `JobeenCreateMenu`; sin opción Video independiente |
| Borradores | Crear; Panel > Contenido | Retomar borrador | Persistencia aislada; no duplicar borradores por acceso |
| Catálogo Live | Videos > En vivo | Abrir directo / iniciar Live | Streams existente; integrar identidad de navegación |
| Preparar Live | Crear > En vivo o catálogo | Iniciar transmisión | `live.tsx`; permisos, red, vista previa y confirmaciones |
| Live espectador | Catálogo, perfil, notificación | Ver e interactuar | `stream/[id]`; chat, seguir, regalos y presupuesto contextuales |
| Live emisor | Inicio de Live | Emitir / finalizar | Controles de cámara, micro, chat, red y moderación; interfaz de una mano |
| Resumen de Live | Finalizar o Panel > Directos | Ver resumen y crear destacado | Solo métricas reales; acceso a replay si autorizado |
| Flashes | Videos > Flashes | Ver / crear Flash | Feed existente; regalos y servicios sin ruido visual |
| Editor multimedia | Crear > Flash/Historia o Live > Crear destacado | Siguiente / publicar | Compartir componentes de FlashComposer; adaptación por formato |
| JHighlights | Replay, perfil > En vivo, Panel > Contenido | Ver o crear destacado | Nuevo flujo previsto; fuente autorizada, no feed duplicado |
| JAcademy | Videos > JAcademy | Explorar / continuar curso | Catálogo nuevo con reproductor compartido cuando proceda |
| Curso / lección | Catálogo Academy | Continuar aprendizaje | Módulos, progreso; cursos gratuitos/premium cuando estén disponibles |
| Mis cursos | Academy; Panel > Cursos | Retomar aprendizaje o gestionar cursos | Separar alumno e instructor; conectar certificados existentes |
| Perfil propio | Perfil | Panel / Editar JCard | `JobinCard`, acordeón y galería JCards |
| Perfil visitante | Autor, buscador, contacto | Seguir / Mensaje / presupuesto si ofrece servicios | Conservar perfil público y acciones actuales; no mostrar Panel ni galería privada |
| Compartir JCard | Icono junto a Editar JCard | Elegir método / QR | `JCardShareSheet`; cara visible, permisos y enlace correcto |
| JShop | JShop | Comprar / vender | Rutas y bandeja existentes; no mover productos a Servicios |
| Solicitar presupuesto | Perfil, Live o Flash elegible | Enviar solicitud | Mismo formulario y expediente; origen registrado |
| Servicios | Mensajes > Servicios | Leer y responder solicitud | Mensajería compartida con ámbito comercial separado |
| Presupuesto | Chat Servicios o Panel > Presupuestos | Enviar / aceptar / revisar | Un objeto con versiones y estado, no copias |
| Panel | Debajo de JCard propia | Gestionar actividad | JCenter; reutilizar Mi empresa, servicios y vínculos laborales |
| Configuración asistente | Panel > Negocio > Asistente | Guardar reglas y activar | JAssist, no acceso a chats personales |
| Equipo | Panel > Negocio > Equipo | Gestionar vínculos y permisos | `employer-links`, `company`; ampliar sin duplicar identidades |
| Acuerdos de ingresos | Panel > Equipo/Ingresos | Revisar y aceptar acuerdo | Consentimiento bilateral y versión por transmisión |
| Regalos | Live y Flash elegibles | Enviar regalo | Hoja compartida; precio y confirmación antes de gasto real |
| Ingresos | Panel > Monetización | Consultar saldo y movimientos | Un historial financiero; retiros solo con proveedor integrado |
| Notificaciones | Campana existente | Abrir objeto autorizado | Unificar enlaces y avisos de todos los módulos |
| Configuración | Menú existente | Gestionar preferencias, seguridad, privacidad | No mezclar tareas comerciales con ajustes de cuenta |

## 5. JCard y Panel (JCenter)
Fila propuesta: `[ Panel ] [ Editar JCard ] [ Compartir (icono) ]`. Panel toma la posición izquierda del antiguo Compartir. Compartir conserva área táctil mínima de 48 dp y abre el menú existente sobre la cara visible. Editar conserva el destino personal/negocio. No cambiar arte, flip, sellos, QR ni gestos internos. En Jelly verificar los tres controles sin truncar etiquetas; adaptar ancho/espaciado antes de reducir áreas táctiles; aprobar alternativa de dos filas si no caben. El perfil visitante conserva Seguir, Mensaje, Guardar contacto y acciones permitidas; añadir presupuesto de modo contextual, no sustituir estas acciones sin aprobación.

**Panel privado (una entrada, no una pestaña global):** encabezado con contexto de actuación personal/empresa y permisos; secciones progresivas: Contenido (publicaciones, borradores, Flashes, Lives, destacados, estadísticas); Cursos (aprendizaje y, para instructores, creación); Negocio (solicitudes/presupuestos, clientes como expedientes, configuración de JAssist y Equipo si corresponde); Monetización (regalos, ingresos, acuerdos y retiros cuando estén disponibles). Mostrar solo módulos habilitados. El selector de organización cambia el ámbito de los datos, no la identidad de login. Empresas no acceden a información personal del trabajador. No crear un segundo perfil ni un CRM paralelo.

## 6. Streaming, editores y JAcademy
**Live espectador:** video primero; encabezado EN VIVO, identidad y espectadores verificados; chat, compartir y regalo en zona contextual; presupuesto visible si ofrece servicios, en hoja inferior sin interrumpir el video cuando técnicamente sea viable. Evitar overlays sobre contenido importante. Pausar animaciones de regalos si distraen, respetar reducción de movimiento. **Live creador:** controles de inicio/fin, micrófono, cámara, estado de red, moderación; preseleccionar la modalidad personal/empresa/colaborativa si existe acuerdo; no incentivar manipulación del teléfono en trabajos peligrosos. No presentar demos como transmisiones reales.

**JStudio (nombre interno):** reutilizar selección de medio, línea de tiempo, recorte, previsualización, portada, texto, subtítulos, audio y gestión de borradores. No prometer que todas esas capacidades ya existen. Flash: edición vertical, portada, descripción y publicar. Historia: edición rápida, caducidad y audiencia. JHighlights: escoger fragmento de replay autorizado y conservar atribución. Curso: editor de lección, orden de módulos y progreso. Transiciones comunes: seleccionar/grabar > editar > previsualizar > publicar o guardar borrador. Confirmar salida con cambios no guardados; recuperar borradores de la cuenta correcta. Exportación, transcodificación, subtítulos y publicación dependen de capacidades verificadas; no agregar SDK especulativos.

**JAcademy:** catálogo en Videos, búsqueda por oficio, curso > módulos > lección > progreso. En Panel, acceso a Mis cursos; un instructor elegible administra creación desde allí o desde Academy. Un solo catálogo y un único registro de progreso. Certificados verificables solo al cumplir requisitos; distinguir certificado de curso de licencia profesional. Precios, requisitos de instructor, contenidos premium y pagos requieren decisiones posteriores. La formación no desplaza Lives ni Flashes.

## 7. JQuote, JAssist y JTeam
**JQuote:** el usuario pide presupuesto desde perfil, Flash o Live; elige servicio, ubicación aproximada/privada según necesidad, descripción, fotos opcionales y preferencia horaria. Confirmación de destinatario (profesional o empresa). Expediente único accesible en Mensajes > Servicios y Panel. Estados propuestos: nueva, información pendiente, revisión humana, enviada, aceptada, rechazada, vencida/cancelada. Cambios de precio generan versión explícita y nueva aceptación. Una solicitud no equivale a contratación ni cobro.

**JAssist:** IA opcional en la bandeja comercial, identificada como asistente. Conocimiento autorizado por empresa (servicios, tarifas, horarios, cobertura, garantías, FAQs); cálculos deterministas del servidor, no precios inventados. Responde preguntas, recopila datos, prepara borradores y deriva al humano si faltan datos, hay incertidumbre o compromiso no autorizado. Precio fijo solo con política expresa del negocio; no ejecutar contratos, gastos ni descuentos fuera de reglas. Handoff humano y posibilidad de pausar automatización; límites de gasto, autorización, registros y aislamiento por empresa. El acceso desde Servicios y Panel remite al mismo expediente.

**JTeam:** reutilizar vínculos laborales confirmados. Roles de propietario, administrador, supervisor, ventas y técnico con permisos específicos del servidor; revocación de acceso al salir de la empresa. El trabajador conserva su cuenta, contenido y datos personales. Modalidad de Live personal/empresarial/colaborativa definida antes de iniciar; acuerdo bilateral, participación sobre importe distribuible, vigencia, derechos de contenido, versión fija por emisión, sin modificaciones retroactivas. No asignar ingresos por la simple aparición de una JCard empresarial. Revisar normas laborales y fiscales por jurisdicción antes de operar.

### 7.1 JQuote AI — presupuestos inteligentes (concepto aprobado 2026-11-24)
Extensión opcional de JQuote para profesional independiente o empresa autorizada. Desde el mismo expediente o Panel > Presupuestos, una acción de presupuesto rápido permite dictar voz, fotografiar etiquetas/equipos o grabar un recorrido privado con narración; después de seleccionar el cliente/destinatario y confirmar los datos, Jobeen AI extrae trabajos, cantidades, unidades, materiales, condiciones y preguntas pendientes. Ejemplo HVAC: dos mini splits de 12.000 BTU cada uno, tubería, soportes, drenaje, mano de obra. Distinguir observaciones de datos declarados y estimaciones. No inventar medidas, marcas, modelos, cantidades, precios, impuestos ni necesidades de instalación. La cámara convencional no certifica dimensiones; pedir medida manual o método de medición compatible validado cuando haga falta. No usar IA para afirmar conformidad técnica o de seguridad.
Catálogo de servicios/materiales, tarifas, moneda, vigencia, unidades, mano de obra, márgenes, descuentos e impuestos definidos o autorizados por cada negocio; el servidor calcula importes deterministas y valida cantidades, permisos y versiones. IA propone partidas y preguntas, no determina precios sin fuente. Si falta un precio o dato esencial, marcarlo y pedir confirmación. El trabajador autorizado revisa, corrige y aprueba el borrador antes de enviarlo al cliente. No crear expedientes duplicados ni aceptar/contratar/cobrar automáticamente. Presupuesto manual plenamente funcional aun sin IA. JAssist reutiliza el mismo catálogo y expediente; la automatización comercial tiene límites y autorización expresa según §7.
Usar el motor Jobeen AI común, OpenAI y Gemini como candidatos de voz, extracción estructurada, conversación e interpretación de video/imágenes, seleccionando según mediciones reales. Reutilizar componentes de cámara y archivos privados existentes. Grabación breve y análisis posterior inicialmente; cámara interactiva en tiempo real y medición avanzada solo tras validación de utilidad, coste y hardware. Grabaciones y fotos de clientes son privadas por defecto, no se convierten en Flashes/Lives ni se reutilizan para entrenamiento sin autorización. Aislar por cuenta/empresa/expediente, acceso de rol y plazos de conservación; minimizar datos personales y pedir autorización de grabación; credenciales de proveedor solo en servidor.
Orden dentro de JQuote: (a) catálogo y presupuesto manual con expediente/versiones; (b) voz; (c) fotografías; (d) video breve; (e) cámara interactiva futura. JQuote AI es candidato de valor Business Premium, no precio ni plan comercial confirmado; no exige suscripción ni activa API en esta etapa. Esta aprobación es de incorporación al plan, no de desarrollo anticipado, gastos, dependencias, migraciones ni despliegue.

## 8. Regalos y monetización
JGifts se activa únicamente en Live y Flash elegibles; mismo catálogo y saldo de regalos, hoja inferior con selección, precio, moneda y confirmación. No agregar botón global ni simular pagos. Panel muestra regalos recibidos, saldo disponible/pendiente, movimientos y acuerdos cuando estén integrados. Separar ingresos personales y empresariales. El ledger de pagos debe ser autoritativo en servidor, idempotente y auditable; considerar reembolsos, contracargos, comisiones, impuestos, límites, fraude, menores y políticas de tiendas. No fijar porcentajes, precios ni proveedor de pago sin aprobación. No mezclar estados de presupuesto con ingresos liquidados. Los pagos de cursos, servicios y regalos pueden tener reglas distintas.

### 8.1 Propuesta técnica de pagos y dependencias (2026-11-24)
Consultar [JOBEEN_PAYMENTS_PLAN.md](JOBEEN_PAYMENTS_PLAN.md): JShop es clasificados sin comisión de venta ni checkout físico, monetización exclusiva de publicidad/visibilidad opcional (modalidades pendientes de elección). Compras digitales incluyendo promociones JShop: Google Play/StoreKit con expo-iap propuesto. JQuote presencial y retiros se deciden por separado. Incluir capacidad nativa digital junto a LiveKit y expo-audio sujeto a compatibilidad y aprobación. Fase 04B experiencia JShop; fase 09 promociones reales. No iniciar cobros, comisiones, logística o SDK de publicidad externa por esta decisión.

## 9. Reutilización y estado real
**Conservar:** cinco pestañas, perfiles y JCard, acordeón, iconos, Crear, feed, JShop, mensajería, búsqueda, notificaciones, reglas de diseño y seguridad. **Ampliar:** rutas de Streams/Live, FlashComposer, `company`, `employer-links`, `services`, certificados y tokens semánticos. **Nuevos módulos propuestos:** Panel, catálogo Academy, expediente de presupuesto, IA comercial, ledger/regalos y acuerdos. No asumir que ya están funcionales. En el repositorio se verificaron rutas de Live/Streams, FlashComposer, `services`, `company`, `employer-links`, certificados, perfil e inbox; el grado de integración de cada función debe comprobarse antes de programarla. Google login fue validado por el propietario en su dispositivo; no reabrir ese incidente sin evidencia nueva. Conservar bloqueos de seguridad pendientes según registro vigente; no repetir auditorías cerradas.

## 10. Hoja de ruta operativa consolidada (2026-11-24)
Numeración continua de fases de desarrollo usada por el propietario desde UI-01 y VIDEO-02; reemplaza la tabla de etapas de planificación 0–8, sin repetir trabajo ni cambiar la prioridad aprobada. Estado de referencia: development 4867fe9f, PR #109 candidato 2b466605 CI 45422582074 success; nueva revisión documental requiere CI de su propio SHA. El registro DEVELOPMENT_STATUS.md conserva evidencia y detalles.

| Fase | Entregable | Estado / cierre |
|---|---|---|
| 01 | Royal Hive: tokens, componentes, menús, formularios, temas, navegación adaptable | Implementado e integrado; comprobar dos correcciones UI-01E y validación física restante en siguiente entrega, sin rediseño general |
| 02 | Videos: Flashes inmersivo, En vivo inicial y preferencia por cuenta | Implementado e integrado; validación física pendiente en los recorridos registrados |
| 03 | Streaming + base Jobeen AI de moderación | ACTUAL. Preparación Live integrada; LiveKit, política v2.0 y 60 s en PR #109. Completar 03A–03F debajo; no abrir público sin seguridad efectiva |
| 04 | 04A Creación multimedia; 04B optimización JShop | Editor/historias/destacados; después, catálogo, acciones y mapa personalizado Royal Hive. Ver alcance 04B debajo |
| 05 | Panel y JCard | Fila Panel/Editar/Compartir, gestión de contenido y estadísticas reales, destinos disponibles por rol; preservar JCard y cinco pestañas |
| 06 | JAcademy | Catálogo, cursos/lecciones, progreso, instructores, certificados; no simular acreditaciones |
| 07 | JQuote y JQuote AI | Solicitud contextual, expediente/versiones, precios y presupuesto manual; voz, foto, video después; cámara interactiva pospuesta hasta viabilidad |
| 08 | JAssist, JTeam y reputación propia | Respuestas comerciales autorizadas y borradores con intervención humana; equipo, permisos, trabajos y aptitudes, evidencias/estadísticas y asignación supervisada sin IA obligatoria; reutilizar vínculos y JCard |
| 09 | Monetización | Business Premium, regalos/ingresos, acuerdos, pagos y retiros según proveedores, costes, normas de tienda y revisión legal aprobados; no simular cobros |
| 10 | Beta y publicación | Pruebas integrales dirigidas, Android/web y después iOS según alcance aprobado, seguridad de las nuevas funciones, accesibilidad, fallos/red, límites de coste, revisión legal y tiendas, aprobación de release y lanzamiento gradual |

### Requisito transversal de compilación nativa
Antes de otra APK, aplicar AGENTS.md §0.3 y [NATIVE_CAPABILITY_PLAN.md](NATIVE_CAPABILITY_PLAN.md): revisar todas las fases 01–10 y confirmar el lote completo. LiveKit imprescindible, audio dedicado candidato para JQuote, compras digitales pendientes de elección con propietario; no anticipar pantallas ni activar proveedores. Conservar SDKs existentes y reutilizar procesamiento servidor/OTA. Si una capacidad se aplaza, documentar y aprobar el impacto de una eventual nueva compilación. No confundir capacidad de cámara con transporte en tiempo real.

### Fase 03 — orden inmediato
- 03A preparación Live: integrada en PR #108; revisión física posterior.
- 03B base LiveKit y política de moderación contextual: PR #109 en revisión, límite candidato 60 s, migración no aplicada. Cerrar CI del nuevo SHA y obtener autorización expresa de integración.
- 03C transporte privado: verificar SDK/plugins/lockfile Expo 54, preparar entorno/proyecto LiveKit autorizado, tokens emitidos en servidor, cámara/micrófono y reproducción privada entre cuentas autorizadas. Conservar infraestructura probada; no activar servicios de pago ni generar APK sin autorización.
- 03D Jobeen AI moderación: motor común con adaptadores OpenAI/Gemini, contratos de evidencia/contexto y niveles 0–3, protección infantil especializada, revisión humana, denuncias, apelación, presupuestos y privacidad. Actualizar reglas legadas, consentimiento y términos; validar pruebas representativas, salida protegida, corte inmediato por riesgo y máximo absoluto de 60 s sin supervisión, recuperación sin sanción por fallos técnicos. La IA no es fuente de autorización.
- 03E experiencia emisor/espectador y catálogo real: cámara, micrófono, calidad/red, reconexión, controles a una mano, chat e interacciones reales, perfil y reportes. Se puede desarrollar en privado en paralelo con 03D si está autorizado. No mostrar demos como reales.
- 03F consolidación: probar corte efectivo, aislamiento, reconexión, interacción y consumo; agrupar cambios nativos, solicitar APK y despliegue piloto autorizado, probar en teléfono y cerrar defectos de alcance. Resúmenes reales/replay cuando haya permiso y capacidad; destacados en 04. No habilitar público antes de superar controles esenciales.

### Fase 04B — JShop: experiencia de compra/venta y mapa Royal Hive (incorporación solicitada 2026-11-24)
Mandato posterior del propietario: conservar clasificados/contacto, publicación básica gratuita, sin cobro por venta, checkout ni pedidos; ingresos por anuncios patrocinados y visibilidad opcional. Diseñar acceso contextual a Destacar desde Mis anuncios solo cuando esté funcional; modalidad/precio pendiente, ver JOBEEN_PAYMENTS_PLAN.md.
Después de 03 Streaming y 04A creación multimedia, antes de 05 Panel/JCard. No reabrir el diseño global ni renumerar las fases posteriores. Auditar y optimizar únicamente el flujo de JShop, incluyendo catálogo, búsqueda, categorías, filtros, favoritos, Vender, Mis anuncios, configuración, publicación, detalle y chat JShop. Revisar primero capturas reales y referencias Mobbin de marketplaces; presentar 2–3 propuestas de distribución/densidad con opciones de lista y cuadrícula adaptable, priorizar fotos/precio/ubicación, mantener acciones reconocibles y áreas táctiles de 48dp, reducir duplicados y texto redundante. Reutilizar Royal Hive y componentes existentes, sin sexta pestaña, nuevos temas globales ni cambios a UX aprobada sin validación del propietario.
Hallazgos iniciales de código en 02411c47: src/app/jshop.tsx coloca favoritos/ubicación en cabecera, búsqueda/filtros, categorías, dos botones de venta y otro encabezado antes del catálogo; favoritos y zona también tienen accesos repetidos. JShopItemCard es lista horizontal de una tarjeta por fila, foto de 90–124dp. Revisar jerarquía y carga/vacío/error, sin afirmar un defecto físico a partir de código. Ajustes y plantillas comunes ya homologados; reutilizar, no rehacer.
Mapa personalizado: evaluar Mapbox Studio con estilo propio Royal Hive Light/Dark ligado al tema global (Sistema resuelve tema existente), vías/ciudades legibles, etiquetas no necesarias atenuadas, agua/parques diferenciables y círculo/pin dorado visible. Android usa Mapbox.StyleURL.Light fijo; fallback web/tiles usa mapbox/light-v11 fijo. Verificar soporte del estilo seleccionado en SDK nativo y Static Tiles API (esta última no soporta Standard ni estilos que lo importan a fecha de revisión); escoger estilos compatibles o mantener alternativa explícita sin migración de SDK innecesaria. Conservar atribución/logo, token público restringido y no exponer claves secretas. Revisar cuotas y facturación de geocodificación permanente/temporal y tiles, errores 429/401/403, no agregar gasto ni publicar estilos sin autorización.
Pruebas dirigidas: búsqueda ciudad/zona, ubicación actual con permiso voluntario (ya existe en comprador), arrastre, zoom y radio efectivo vs distancia de resultados, centrado y restauración por cuenta, guardado de ubicación de búsqueda independiente de ubicación de venta y de cada anuncio; sin cambiar retroactivamente anuncios, sin exponer domicilios privados; sin geocodificación redundante al mover mapa, respetar cuotas. Validar recarga, permisos denegados, red mala, fallback, estado vacío, tema claro/oscuro y Jelly con controles completos. No repetir auditorías generales de RLS ya superadas; probar regresiones relacionadas con cambios. Verificar si la entrega puede ser OTA con el binario existente; nueva APK solo si realmente necesaria y autorizada. No crear estilo, solicitar token, cambiar cuenta Mapbox, SDK, base alojada o código UI ahora.
Fuentes oficiales de viabilidad: https://docs.mapbox.com/console-tools/studio/ ; https://docs.mapbox.com/map-styles/ ; https://docs.mapbox.com/api/maps/static-tiles/ . Validar condiciones y compatibilidad al implementar.

### Después del lanzamiento
Medir coste, ingresos y uso para decidir migración progresiva a servidores alquilados/propios, modelos autoalojados, cámara interactiva avanzada, gafas Meta e integraciones empresariales autorizadas. No son requisitos del MVP, no comprar hardware ni contratar infraestructura por anticipado. Comunidades independientes, citas, ERP, nóminas y vigilancia laboral fuera del alcance vigente. No repetir auditorías ya aprobadas sin nueva evidencia; verificar solamente regresiones y funciones cambiadas. Los diseños de nuevas funciones necesitan aprobación visual según DESIGN_RULES.md; todos usan Royal Hive. Mantener autorización separada para merge, datos alojados, costes, OTA, APK y publicación. Esta hoja de ruta ordena trabajo, no autoriza todas las etapas de una vez.

## 11. Decisiones pendientes antes de implementación
1. **RESUELTO E INTEGRADO 2026-11-24:** En vivo es el destino inicial de Videos; recordar después la última sección visitada por cuenta. VIDEO-02 integrado; validación física pendiente. Ubicación definitiva de JAcademy y JHighlights aún pendiente.
2. RESUELTO v1.2: Royal Hive Light/Dark, selector Sistema y migración segura de preferencias obsoletas; validar comportamiento nativo y web antes de publicar.
3. Apariencia final de la fila Panel/Editar/Compartir en Jelly, manteniendo opción B y área táctil.
4. Referencias Mobbin específicas por pantalla: consultarlas e inspeccionar imágenes, sin copiar estilos externos. Las búsquedas previas devolvieron enlaces, pero no se verificaron sus imágenes; no se consideran aprobación visual. No generar bocetos sin solicitud/aprobación.
5. Funciones visibles del Panel en cada etapa; roles comerciales, visibilidad, nombres y política de IA; detalles Academy, pagos/regalos y reparto según etapas.
6. Pruebas de contraste completo (incluido video dinámico), accesibilidad, temas y dispositivos; verificar dependencias nativas y costes antes de comprometerlos.

## 12. Próxima acción
Continuar fase 03B–03C según §10; confirmar CI del PR #109, solicitar integración y preparar la compatibilidad SDK/transportes privados LiveKit, sin iniciar JQuote ni otras fases anticipadamente. JQuote AI queda en fase 07. Revisión física restante de 01/02 acumulada en próxima entrega aprobada. No iniciar gastos, dependencias especulativas, cambios hospedados o compilaciones sin autorización.

## 13. Sistema universal de proporciones, tipografía y diseño adaptable

### 13.1 Referencia y alcance
El propietario autorizó incorporar al plan la imagen de la hoja «Compartir publicación» como referencia de jerarquía, proporciones y composición (23 de noviembre de 2026). La referencia **no** sustituye la paleta Royal Hive ni obliga a copiar su arte, colores, texto o cada medida en píxeles. No es una captura que certifique el comportamiento actual del código ni permite deducir dp/sp exactos de un archivo rasterizado. Las medidas siguientes son candidatas de diseño, no cambios aprobados para ejecución.

**Referencia visual original:** `Jobeen_Referencia_Proporciones.png`, incluida en el paquete v1.1 entregado al propietario. Pendiente incorporar el PNG original al repositorio; no sustituirlo por otra imagen ni declarar validación visual.

Elementos que conservar como patrón: hoja inferior de esquinas superiores redondeadas; asa discreta; encabezado con título y cierre; búsqueda; contactos con selección inequívoca; separación de métodos externos; acción principal a ancho disponible. En pantallas compactas, preservar orden, jerarquía y legibilidad; el carrusel de contactos se desplaza horizontalmente y la hoja admite desplazamiento vertical. No añadir paginación decorativa si no representa una posición real. El título se adapta al contenido (JCard, publicación, curso, etc.). La selección múltiple debe anunciar el estado y el número real de destinatarios. Reutilizar `JCardShareSheet` / `JobeenShareSheet` y sus permisos; el plan no implica habilitar métodos inexistentes.

### 13.2 Escala tipográfica: base existente y propuesta para validar
Se consultó `src/theme/typography.ts` de `development`: la escala vigente ya declara la referencia Premium Clean, conserva el escalado nativo y aplica factor 0.95 a anchos inferiores a 360. No se modifica ese código. La comparación permite evitar un aumento indiscriminado de tipografía. Un valor candidato no sustituye al actual hasta aprobar muestras y pruebas por dispositivo. Usar la familia tipográfica y pesos existentes; la JCard y el wordmark conservan sus reglas específicas.

| Rol | Actual (sp) | Candidato de referencia (sp) | Interlineado candidato (sp) |
|---|---:|---:|---:|
| Display | 30 | 30 | 36 |
| Encabezado / título página | 22 | 22–24 | 28–30 |
| Título navegación | 18 | 18 | 24 |
| Título hoja / diálogo | 17 | 20 | 26 |
| Título sección de hoja | 13 | 17–18 | 22–24 |
| Título sección general | 14 | 17–18 | 22–24 |
| Texto general | 14 | 15–16 | 21–23 |
| Campo de entrada | 13 | 15–16 | 21–23 |
| Etiqueta acción general | 14 | 15–16 | 20–22 |
| Etiqueta acción de hoja | 13 | 15–16 | 20–22 |
| Nombre destinatario | 11 | 14 | 18 |
| Información secundaria | 12 | 12–13 | 17–18 |
| Caption | 11 | 12 | 16 |
| Microtexto no esencial | 10 | 10–11 | 14–16 |

Para la primera muestra candidata usar el extremo inferior de cada intervalo (p. ej., título de página 22, sección 17, cuerpo 15 y acción 15); ajustar por rol únicamente si la revisión justifica el cambio. No alternar valores arbitrariamente según pantalla. Peso de título fuerte, cuerpo regular, acción semibold; respetar los pesos actuales hasta homologarlos. Mantener escalado de accesibilidad nativo (`allowFontScaling`), evitar truncar títulos y etiquetas esenciales y no usar `adjustsFontSizeToFit` como solución general. Si el usuario amplía el texto, permitir líneas adicionales, crecimiento del control y scroll. No inferir que el factor vigente 0.95 es óptimo: comparar contra factor 1 en Jelly antes de cualquier ajuste.

### 13.3 Componentes y dimensiones candidatas (unidades lógicas, no píxeles físicos)
| Componente | Regla / valor candidato |
|---|---|
| Objetivo táctil | Mínimo 48 × 48 dp; no superponer zonas táctiles |
| Botón primario | 48 dp de alto mínimo; 52 dp si contenido y espacio lo justifican; radio general 12 dp |
| Acción principal de hoja de compartir | 48–52 dp; radio tipo cápsula como variante específica por validar; texto centrado |
| Botón secundario | 48 dp mínimo; radio 12 dp |
| Icono compacto Compartir JCard | 24 dp visual, 48 × 48 dp táctil; conserva cara activa |
| Campo de búsqueda | 48 dp mínimo; icono 20–24 dp; variante cápsula de búsqueda por validar |
| Iconos principales / secundarios | 24 / 20 dp; cierre 24 dp |
| Icono de método de compartir | 28 dp candidato dentro de círculo de 48–60 dp |
| Avatar destinatario | 48–60 dp visual; celda 64–80 dp según ancho; selección no tapa la cara ni el nombre |
| Nombre destinatario | Hasta dos líneas en vista normal; acceso al nombre completo si no cabe; crecer con accesibilidad |
| Tarjetas / menús / diálogos / hojas | Radios 16 / 18 / 26 / 30 dp; excepciones del arte JCard |
| Separación | Escala 4, 8, 12, 16, 24, 32 dp; margen lateral habitual 16 dp |
| Barra inferior | 58 dp + safe area, con objetivos táctiles y acordeón existentes |

Aplicar la jerarquía visual de la referencia y los tokens Royal Hive de la sección 2. Un único botón primario por contexto cuando corresponda. En la fila Panel / Editar JCard / Compartir conservar el icono de 48 dp, etiquetas completas y orden aprobado; si no caben, proponer dos filas antes de reducir objetivos táctiles. La alternativa de dos filas requiere aprobación visual. No alterar acciones de visitante, flip ni arte de JCard.

### 13.4 Composición adaptable por ancho disponible
Los intervalos siguientes son perfiles de prueba de ancho lógico de la ventana, no especificaciones de hardware. Medir en tiempo de ejecución (React Native `useWindowDimensions`, safe areas, escala de fuente, teclado); Android dp y unidades lógicas iOS no se obtienen de la resolución física en píxeles. Los modelos Jelly, Galaxy S22 e iPhone 17 son objetivos de validación, no resultados ya verificados.

| Perfil de prueba | Ancho lógico orientativo | Comportamiento |
|---|---|---|
| Compacto (Jelly) | 280–359 dp | Márgenes 12–16 dp, huecos 8 dp; conservar objetivos táctiles; contactos en carrusel; hoja con scroll y acción final alcanzable; no recortar texto |
| Estándar (Galaxy S22) | 360–399 dp | Márgenes 16 dp, huecos 8–12 dp; composición de referencia, cuatro métodos de compartir cuando caben |
| Amplio (iPhone 17 u otros) | 400–480 dp | Márgenes 16–24 dp, huecos 12–16 dp; aprovechar espacio para contenido, no inflar toda la tipografía |

Mantener mismo orden, número de columnas lógicas, acciones y jerarquía. En la fila de cuatro métodos de compartir, usar anchuras flexibles y etiquetas en dos líneas en condiciones normales; si el ancho o la escala accesible impiden cuatro objetivos completos, permitir desplazamiento horizontal accesible manteniendo las cuatro posiciones lógicas, o presentar una alternativa a aprobar. No ocultar métodos. En contactos, mostrar tantas celdas completas como quepan y permitir desplazamiento hasta las demás. No forzar cuatro avatares de tamaño fijo en Jelly. Con teclado abierto, mantener foco visible, búsqueda y salida alcanzables; evitar que el teclado o barra del sistema tapen la confirmación. En landscape, ventana dividida o anchos fuera del rango, mantener scroll y controles alcanzables; adaptar tablet/web mediante una propuesta aparte si exige variar la composición. No escalar uniformemente toda la UI ni imponer altura fija a texto multilínea.

### 13.5 Matriz de validación antes de aprobar el sistema
| Prueba | Criterio de aceptación |
|---|---|
| Jelly físico o dispositivo compacto equivalente | Panel/Editar/Compartir alcanzables; hoja sin cortes ni superposiciones; controles utilizables con una mano |
| Galaxy S22 físico o perfil Android equivalente | Misma estructura, proporciones y orden; teclado, scroll, safe areas y navegación correctos |
| iPhone 17 físico o simulador equivalente | Misma jerarquía, márgenes, escala y comportamiento; safe areas y gestos iOS correctos |
| Escala tipográfica | Normal y ampliada, incluyendo 130 % y 200 % donde el sistema permita; texto esencial completo, scroll cuando corresponda |
| Temas | Royal Hive Light/Dark; selección Sistema sigue cambios de OS, selección manual persiste y preferencias obsoletas se normalizan; fondos de JCards intactos |
| Compartir | Sin contactos, lista larga, nombres extensos, selección múltiple, carga, error, teclado, QR y cancelación; solo datos autorizados |
| Accesibilidad | Contraste 4.5:1 texto normal, 3:1 texto grande/controles esenciales; foco, lectores de pantalla, etiquetas, objetivos 48 dp y reducción de movimiento |
| Streaming / editores | Controles sin cubrir contenido crítico; contraste con video dinámico, safe areas y salida visible |
| Regresión visual | Capturas de referencia por ancho y tema, comparadas con la composición aprobada; no modificar JCard, acordeón o navegación ajenos al alcance |

La prueba en emulador/simulador se identifica como tal; no equivale a validación física. Si un dispositivo no está disponible, registrar pendiente en lugar de afirmar compatibilidad verificada. Cerrar la especificación solo tras aprobación de muestras y criterios aplicables. Antes de implementar, comparar los tokens existentes (`src/theme/typography.ts`, `src/theme/control-metrics.ts`, `src/theme/modals.ts`) y componentes; reutilizar y consolidar, no duplicar. Consultar referencias Mobbin específicas cuando se diseñe cada flujo y aplicar `DESIGN_RULES.md`.

### 13.6 Aplicación transversal y control de cambios
La escala, tamaños táctiles, estructura de hojas y jerarquía se aplican a Casa, JShop, Videos, Lives, Flashes, JStudio, JAcademy, Mensajes, JQuote, JAssist, JTeam, Panel, regalos y configuración. Los editores y superficies audiovisuales pueden necesitar variantes contextuales justificadas, no un sistema visual paralelo. No se añade un SDK, tema nuevo, pantalla o permiso por incluir esta especificación. Royal Hive y opción B mantienen su aprobación; tamaños candidatos, excepciones y ajustes finales siguen sujetos a validación y autorización. Esta revisión es exclusivamente documental. No modifica código, Supabase, OTA, APK ni gastos; el registro en GitHub requiere promoción separada.
