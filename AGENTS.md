## Seguridad y aislamiento de cuentas — regla permanente no negociable
### Arquitectura aprobada: opción 2, aislamiento reforzado
- **Compilación APK (orden expresa del propietario):** antes de crear cualquier APK nuevo, informar qué cambio nativo lo requiere y solicitar aprobación. No iniciar EAS Build, GitHub workflows de compilación Android ni instalar un APK nuevo sin autorización expresa. Los cambios de código y verificaciones sin compilación pueden continuar.
- Una sola identidad autenticada activa por instancia/dispositivo, sin selector multicuenta persistente ni unión automática de perfiles. No limitar arbitrariamente las sesiones legítimas en otros dispositivos.
- Separar el estado de todos los proveedores, navegación, cachés, borradores y eventos por UUID; cerrar la sesión anterior y desechar respuestas asíncronas antiguas. Verificar identidad antes y después de operaciones que esperen red o disco.
- Credenciales, tokens de sesión y persistencia privada sensible: almacén seguro nativo (KeyStore/Keychain), cifrado autenticado con claves protegidas y migración sin importar datos de propietarios desconocidos. No sustituir cifrado por claves de AsyncStorage con sufijo UUID. Si el APK actual no incluye el módulo nativo, exigir compilación y pruebas de un APK nuevo. No declarar este requisito implementado hasta verificarlo.
- Exigir reautenticación reciente para acciones críticas (cambio de contraseña/correo, eliminación de cuenta, pagos y retiros futuros, exportación privada). No depender solamente de una confirmación visual; validar la sesión en servidor. Comprobar la API directa tanto con sesiones recientes como antiguas y verificar que se rechacen códigos inválidos, caducados o reutilizados cuando el flujo los exige. No imponer MFA a sesiones ordinarias sin proceso de recuperación.
- Estado de incidente actual: suspender cambios de UX, preservar la versión estable y contener regresiones. Auditoría de registros existentes y pruebas reales A→B→A, offline y API directa son bloqueo de publicación. Nunca borrar ni asignar copias a una cuenta por inferencia; confirmar propiedad y estrategia de recuperación. Registrar el cumplimiento por fases en docs/ACCOUNT_ISOLATION.md.

- Cada cuenta constituye un espacio privado independiente, identificado por el UUID autenticado de Supabase, nunca por correo, dispositivo, nombre o última cuenta utilizada. Ningún dato privado de A puede aparecer, copiarse, escribirse, sincronizarse o restaurarse en B.
- Denegar por defecto. Solo permitir lectura/escritura de datos propios o acceso explícitamente autorizado por una función social (publicaciones públicas, JCards con campos visibles, participantes de conversación, etc.). Aplicar autorización en servidor, no solo UI: RLS, grants mínimos, RPC y Storage; comprobar auth.uid() para propiedad y permisos, incluidas inserciones y actualizaciones. No exponer claves service_role al cliente.
- Toda caché, borrador, archivo temporal, preferencia personal, cola offline y suscripción debe pertenecer a un UUID verificable. Prohibidas claves globales con información de usuarios. Nunca importar ni subir automáticamente datos heredados sin propietario demostrado. Preservar datos ambiguos para investigar y recuperar con autorización, sin reasignarlos ni borrarlos por suposición.
- Ante cambio de identidad o cierre de sesión: invalidar solicitudes y suscripciones anteriores, limpiar estado visual y memoria, impedir que respuestas tardías rellenen la nueva sesión, reiniciar pantallas privadas y verificar identidad antes de leer/escribir/sincronizar. No mostrar datos privados durante transiciones.
- Revisar todas las superficies: JCards personales/empresariales/guardadas, CV, mensajes, contactos, seguidores, borradores, publicaciones, Flashes, directos, JShop, búsqueda, notificaciones, fotos, certificados, ajustes y futuros pagos/regalos.
- Minimizar persistencia de información privada, proteger credenciales y tokens mediante almacenamiento seguro del sistema y cifrar persistencia sensible conforme a OWASP MASVS. Nunca registrar secretos ni PII innecesaria en logs. Mantener los enlaces firmados de archivos privados fuera de la persistencia del cliente y de logs. Si se requiere revocación por solicitud, verificar permisos y sesión vigentes en servidor y comprobar que los endpoints originales y las cachés respetan ese control.
- Pruebas obligatorias A→B→A, cierre y reapertura, offline, solicitudes concurrentes/retardadas, sesión expirada y acceso directo a API/Storage. A y B no deben leer/escribir datos privados ajenos; comprobar también que el contenido deliberadamente compartido siga funcionando.
- Ante sospecha de contaminación: priorizar contención antes de UX, inspección de solo lectura, preservar evidencia, identificar registros afectados y propietario real; no borrar datos ni migrar registros entre cuentas sin evidencia y aprobación específica. No publicar una corrección como verificada hasta superar pruebas. main/producción requieren autorización.
- Conservar las restricciones de privacidad en las reversiones. Si un cliente anterior depende de un permiso inseguro, mantenerlo revocado y suspender el flujo afectado.
- Referencias: https://mas.owasp.org/MASVS/ y https://supabase.com/docs/guides/database/postgres/row-level-security . La selección de arquitectura adicional (sesión única reforzada o multicuenta) requiere aprobación del propietario.

# Jobin — Reglas permanentes de trabajo (AGENTS.md)

Este archivo es la fuente de referencia para asistentes y desarrolladores que continúen el proyecto Jobin, incluso desde otro chat.

## Repositorio y arquitectura
- Repositorio GitHub: thekyngmotorcycles/Jobin.
- App web y móvil: Expo Router / React Native / TypeScript. Backend: Supabase. Preview Android: Expo EAS OTA.
- Idioma de la interfaz: español, excepto nombres propios Jobin y JCard.
- Diseño de marca: wordmark Jobin cursivo, tarjetas JCard con temas y detalles satinados.
- No incluir tokens, contraseñas, claves de Supabase ni credenciales en prompts, commits o archivos de traspaso.

## Visión del producto y prioridades (norma permanente; aprobada por el propietario)
- **Jobeen es una red social de transmisiones EN VIVO, mobile-first, para personas que muestran su trabajo real.** Su propuesta principal no es un tablón genérico de empleos ni una copia de Twitch para escritorio: es permitir a trabajadores y creadores profesionales transmitir desde el teléfono mientras ejercen su oficio en la calle, un taller, obra, vehículo u oficina.
- **Usuarios principales:** electricistas, mecánicos, técnicos, profesionales de servicios, pilotos, artesanos, trabajadores de campo y otros creadores de contenido laboral. El espectador puede observar, interactuar, descubrir talento y conectar con profesionales o negocios. La JCard y la identidad laboral respaldan al creador; **el EN VIVO es el centro del producto**.
- **Jerarquía de producto:** (1) descubrir/ver directos reales; (2) iniciar un directo desde móvil de forma rápida, confiable y segura; (3) conversar e interactuar durante el directo; (4) descubrir creadores y su trabajo mediante Flashes (videos cortos editados) y perfiles/JCards; (5) facilitar contactos profesionales, JShop y otras funciones complementarias. No inventar espectadores, emisiones, verificaciones ni disponibilidad.
- **Visión futura de monetización:** espectadores podrán enviar **regalos con valor monetario** a creadores durante directos y también en sus Flashes. Diseñar la IA/UX para dejar espacio a la función, pero **no presentarla como disponible** hasta implementar pagos, liquidación, políticas de plataforma, prevención de fraude, controles de edad y legislación aplicable.
- **Creación móvil profesional:** priorizar acciones de una mano, visibilidad exterior, uso seguro de cámara/micrófono, estado de red, pausas e interrupciones, ahorro de batería y claridad de controles durante un trabajo real. Considerar soporte futuro para captura manos libres, incluidos anteojos inteligentes compatibles, **sin afirmar que la integración ya existe**. Nunca diseñar flujos que incentiven manipular el teléfono mientras se conduce o realiza una tarea peligrosa.
- **No desperdiciar el espacio principal:** un creador en vivo debe poder emitir/gestionar el directo sin obstáculos ni menús invasivos; su audiencia debe descubrir y entrar a transmisiones con pocas acciones. Las funciones laborales complementan el contenido, no compiten con él en jerarquía.
- **Para decisiones futuras de UX y priorización:** elegir primero lo que mejore transmisión, audiencia, interacción, creación móvil y seguridad del creador. Revisar `docs/JOBEEN_PRODUCT_VISION.md` antes de proponer o implementar cambios mayores.

## Protocolo obligatorio de diseño UI/UX
- Leer `DESIGN_RULES.md` antes de cualquier tarea de diseño, junto con las reglas visuales siguientes. Consultar Mobbin, presentar 2 o 3 propuestas y esperar aprobación explícita antes de implementar UI/UX. Las correcciones técnicas y de seguridad ya autorizadas pueden continuar sin aprobación por archivo, sin rediseños. Mantener el bloqueo de UX durante la auditoría de privacidad.

## Sistema visual minimalista (aprobado; NO sustituye los tokens existentes)
- **Mismo sistema para Configuración Home, menú de tres puntos del perfil propio y menú de tres puntos del perfil visitante:** misma familia de superficie, tipografía, radios, espacios y filas; permitir diferencias funcionales de contenido y formato (drawer para navegación, menú compacto de acciones para visitante).
- Una fila de menú puede tener **título único y breve + ícono semántico solo si aporta valor + chevron únicamente cuando navega**. Sin subtítulos ni descripciones rutinarias; las excepciones necesarias deben justificarse y aprobarse según `DESIGN_RULES.md`. No poblar la interfaz de iconos por decoración. Acciones destructivas se distinguen de forma discreta (icono/tono), sin usar color de énfasis en todo el menú. Preservar interacción, rutas y seguridad.
- **La tira de CINCO pestañas de las secciones del perfil** (Todo, JCards, Videos, En vivo, Acerca de) será **solo texto**, sin iconos; debe ocupar menos altura/ancho y conservar cinco opciones, orden, selección, scroll y legibilidad en teléfonos chicos y grandes. No confundir con la **barra GLOBAL inferior de cinco iconos** Casa/JShop/Videos/Mensajes/Perfil, cuya iconografía aprobada SE CONSERVA.
- Mantener íntegros los colores, gradientes, tipografías semánticas, JCards y elementos de identidad ya aprobados; no adoptar colores, tamaños de letra, iconos de marca ni diseño exacto de X/Twitter u otras referencias.
- **Mobbin y X sirven solo como referencias de distribución, densidad y limpieza visual**, no como plantilla para copiar. Preservar el estilo y lenguaje de Jobeen, incluidas sus reglas responsive y de accesibilidad.
- Implementar cambios visuales **por fases con pruebas automatizadas y revisión en Android** antes de fijar nuevos tokens definitivos. Mantener `main` y producción intactos sin aprobación específica.

- **Minimalismo funcional contemporáneo obligatorio:** contrastar cada propuesta e implementación UI/UX con patrones actuales de apps líderes mediante Mobbin (p. ej., LinkedIn y X para configuraciones), sin copiar identidad. Priorizar etiquetas claras, jerarquía, agrupación y eliminación de contenido redundante en todas las pantallas. Conservar avisos necesarios, accesibilidad y áreas táctiles de 48dp. Aplicar las excepciones y el proceso de aprobación de `DESIGN_RULES.md`.

## Norma visual de iconografía Jobeen (permanente; aprobada por el propietario)
- La personalidad visual de Jobeen es **abeja y panal**: integrar celdas hexagonales suavizadas cuando tengan sentido semántico, sin convertir todos los controles en hexágonos.
- Todos los iconos y botones nuevos o rediseñados deben compartir un lenguaje óptico consistente: trazos del mismo peso aparente, dimensiones perceptuales equilibradas, esquinas suavizadas y remates redondeados.
- Preferir contornos orgánicos, simetría y centrado óptico; evitar ángulos rígidos, puntas agresivas y siluetas copiadas de plataformas conocidas.
- La navegación inferior usa la misma silueta en estado activo/inactivo: **contorno** inactivo y **relleno** activo, sin círculos de selección añadidos ni saltos de tamaño.
- La familia aprobada de la barra inferior es: Casa redondeada; JShop = `bag-handle-outline` / `bag-handle` (el mismo icono del botón JShop en Mensajes); Videos = **Hexa Play A**, celda de panal con triángulo centrado, más grande que los otros cuatro; Mensajes = `JobeenMessageIcon`; Perfil con cabeza y hombros suaves.
- Reutilizar `JobeenMessageIcon` en el botón Chats de la pantalla Mensajes. Mantener la navegación, el acordeón, las áreas táctiles y el respeto por safe-area al modificar solo los dibujos.
- Para cambios visuales usar **EAS OTA en la rama `development`** cuando el binario sea compatible. No compilar ni generar un APK sin autorización explícita del usuario. No publicar cambios de diseño sin aprobación previa.

## Regla visual responsive de Jobeen (aprobada por el propietario)
- **Misma composición en todos los teléfonos** (incluidos Jelly, iPhone y Galaxy): mantener el mismo número de columnas, orden de los elementos, jerarquía, controles e interacciones en los anchos de teléfono. Una cuadrícula de dos columnas continúa siendo de **dos columnas**; nunca convertirla a una sola solo por detectar una pantalla estrecha.
- Adaptar de manera proporcional el ancho de tarjetas, fotos, iconos, márgenes, separaciones y tipografía según el espacio disponible, sin deformar imágenes (respetar `aspectRatio`) ni introducir cortes o solapamientos. Emplear dimensiones flexibles y medidas reales del contenedor en vez de suponer un modelo de teléfono.
- Mantener accesibilidad: targets de interacción apropiados, escalado de texto del sistema, contrastes y desplazamiento cuando sea necesario. Si no cabe el contenido de manera legible, priorizar scroll, distribución del espacio disponible y prueba de tamaños de contenido; **no cambiar la estructura ni ocultar elementos** sin autorización expresa.
- Basar medidas y adaptación en las guías oficiales de Material Design 3 / Android para diseño adaptativo; esta **invariante de Jobeen para teléfonos** es una decisión específica del producto, no un mandato literal de Material 3. Las clases de tamaño de ventana sirven para evaluar y probar restricciones, no autorizan por sí solas cambios en la composición aprobada.
- Para tablets/web o pantallas realmente expandidas, proponer cualquier estructura alternativa al propietario antes de implementarla. Comprobar siempre ancho lógico pequeño, normal y grande, y ambos temas. No convertir una optimización de Jelly en un rediseño para otros dispositivos.
- Ninguna norma visual provisional de la auditoría se considera definitiva hasta comparar capturas reales y obtener la aprobación de su propietario.

## Norma global de compartir Jobeen (aprobada)
- Todos los botones **Compartir** en JCard personal/de negocio, perfiles públicos, publicaciones, videos/Flashes, JShop y CV deben usar **el mismo menú redondeado y minimalista** de Jobeen (componente compartido `JCardShareSheet` / `JobeenShareSheet`).
- Adaptar título, texto y enlace al contenido; mostrar **QR solo si existe un enlace**, y mantener WhatsApp, SMS y **Más opciones** para el selector nativo de contactos y apps del teléfono.
- Evitar abrir el selector nativo encima de otro modal: cerrar primero el menú de origen.
- No inventar contactos de Jobeen ni el éxito de un envío. Los contadores solo se incrementan cuando el sistema devuelve una acción de compartir confirmada; preservar contadores y permisos actuales.
- Los futuros botones de compartir deberán reutilizar este control; no introducir variantes visuales separadas sin consulta y aprobación.

## Política de ramas (obligatoria)
1. `main` es la rama estable. NUNCA hacer commits, pushes, merges, cherry-picks ni despliegues de producción a `main` sin autorización explícita del usuario para esa acción.
2. `development` es la rama de integración y pruebas. Los arreglos pequeños pueden aplicarse allí, siempre con verificación.
3. Las funciones grandes se desarrollan en `feature/<nombre>`; revisar y probar antes de integrarlas en `development`. No integrar a `main` por el simple hecho de pasar CI.
4. Para promover `development` a `main`: Pull Request, CI verde, pruebas en Android, revisión visual, pruebas de seguridad y base de datos, y aprobación explícita del usuario.
5. Reportar en cada entrega: rama, commit SHA, qué cambió, estado real de CI/Expo, si es visible en Android, y qué queda pendiente. No declarar publicado sin evidencia.
6. Versionar entregas estables (empezando por v0.1.0 cuando el usuario lo apruebe); no inventar tags.

## Bases de datos y despliegue
- GitHub branches NO aíslan Supabase. El proyecto Supabase conectado puede ser compartido por distintas versiones.
- Objetivo: separar Supabase Development de Supabase Production antes de lanzamiento público; migraciones revisadas, reversibles cuando sea posible, sin afectar datos reales.
- No cambiar entornos de producción ni ejecutar migraciones destructivas sin aprobación explícita.
- Para cualquier cambio de Supabase, revisar RLS, privilegios, identidad del solicitante, estados y flujo de rechazo. Nunca considerar verificado un vínculo autodeclarado.

## Requisitos de producto acordados
- JCard Personal: nombre legal, usuario, profesión principal con ícono, experiencia general y disponibilidad, contactos según privacidad, idiomas; profesiones secundarias como sellos separados.
- Experiencia general: unión de períodos trabajados en diferentes sectores, sin duplicar períodos simultáneos. Experiencia de profesión principal en el cuadro informativo de su ícono.
- Verificación de identidad y credenciales: nunca automática sin la revisión pertinente.
- Vínculo laboral: trabajador busca empresa por nombre/@usuario, solicita, empresa aprueba o rechaza; SOLO el vínculo aprobado se muestra en JCard como enlace al perfil de la empresa. Trabajador o empresa pueden retirar/finalizar. Puede vincularse empresa propia, pero también requiere aprobación.
- Los vínculos deben persistirse y validarse en Supabase, no solamente en almacenamiento local.
- Antes de afirmar que una función funciona: comprobar compilación, pruebas y flujo de extremo a extremo con cuentas personal/empresa.

## Traspaso a otro chat
1. Leer este archivo y el repositorio, en especial el último commit de `development`, workflows de GitHub Actions, migraciones y estado Supabase.
2. No asumir que la última modificación se publicó; comprobar Actions/Expo.
3. Consultar `docs/CHAT_HANDOFF.md` para contexto funcional, tareas pendientes y prompt de continuidad.
4. Recuperar la tarea activa desde el traspaso, ramas, PR y verificaciones; continuar sin pedir contexto repetido cuando sea inequívoco. Consultar `DESIGN_RULES.md` antes de tareas UI/UX. Preguntar solo si falta una decisión imprescindible o autorización; nunca fusionar `main` por iniciativa propia.
