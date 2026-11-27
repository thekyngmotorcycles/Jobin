# Jobin — continuidad de OTA compatible

## OTA-DEVELOPMENT — autorización permanente del propietario (2026-11-27)

- PR #153 integrado en 4aa07442073f914564be2a448d9c30989b8e3cbb, CI 46075701856 success. OTA Android 46076730934 success, grupo f91b6e76-5d1f-4cca-90a8-c35fded5a07b, runtime jobeen-native-20261123-feed-4425bdf1. Validación física pendiente.
- Propietario autoriza permanentemente las OTA Android compatibles de development. Candidato: reutilizar expo-development.yml desde check.yml después de validate/database exitosos y cambio en src/ o assets/, exclusivamente integración del propietario en development. Conservar comprobación de APK, árbol nativo, proyecto y SHA actual; no duplicar tests completos para la llamada automática. Documentación/CI solos no publican. Sin modificación de credenciales, canales, APK, Supabase ni producción. Activación tras CI del PR; no declarar validada una publicación automática hasta la siguiente modificación de aplicación.

# Jobin — continuidad de catálogo e historial

- Los 31 WebP aprobados están incorporados en `feature/profile-premium-about` (PR #153), en `assets/images/employment/`, con el manifiesto original. Las exportaciones web y Android contienen los mismos bytes. El catálogo existente determina el fondo, con respaldo neutro para categorías sin resolución y vectorial si un archivo falla. La evidencia local de exportación, pruebas y vista a 320–440 px está en `DEVELOPMENT_STATUS.md`. La revisión física y cualquier integración o publicación requieren su aprobación correspondiente.

# Jobeen — Continuidad del perfil premium

- CI 46054697615 y visor 46054737015 completados con éxito; Vercel dpl_FqMAJDiGDpcLMUmYcJo3ftfJCv3a READY (a4a44b1). Propietario ordena título Historial profesional sin serif/cursiva; reutilizar s.h3 y escala semántica Royal Hive exclusivamente en el bloque nuevo. No modificar estilos globales ni partes aprobadas. 16 fondos WebP generados fuera del repo, 12 pendientes y transferencia binaria no confirmada. Revalidar antes de merge/OTA.

# Jobeen — Perfil premium, progreso y menú medio

## PROFILE-PREMIUM-ABOUT — bloque visual aprobado 2026-11-27

- Base development c78d0116 y visor f998e23f. Reutilizar ProfileSectionTabs/ProfilePersonalLanguages y BottomSheet; cápsula flotante única animada, fondo opaco de ancho completo en acordeón, Light/Dark, progreso declarado con oro solo a 100 y guía local honesta de aprendizaje mientras no exista JAcademy; CTA solo propietario. Historial dos columnas, edición/alta con guardas existentes, detalle al tocar, acceso visitante únicamente CV autorizado. 24 familias del catálogo + distinciones HVAC, refrigeración, electricidad y genérica. Arte temático vectorial estático con objetos y sombreado (no raster WebP fotográfico todavía), fallback de color, sin red/dependencias. No modificar datos, permisos, fuentes ni JCard. Pruebas de regresión; validar export, contraste y tamaños 320–440 antes de aprobar. No OTA ni APK. Mantener prioridad de perfil.

# Jobeen — Consolidación y prioridad de perfil (2026-11-27)

## CONSOLIDACIÓN-PARIDAD — aprobada 2026-11-27

- Reutilización exacta de los componentes compartidos y pruebas del visor validado `101a36790eb4dfb713126fcd8d75d79a2b968427` (CI 46046629654 success). PR #151 integra navegación/login web y JCard/experiencia/geometría; no incluye HTML/CSS/JS del visor ni su puente de retorno exclusivo. PR #149 ya integrado. RPC de experiencia pública instalada y comprobada; no repetir migración. PR #150 es publicador temporal de e60e313f con comprobación workflow fallida, no fusionar ni publicar esa versión antigua; conservar una futura entrega conjunta con SHA exacto aprobado. Sin nuevo cambio de apariencia, APK, OTA, main ni datos alojados. Propietario confirma equivalencia visual observada y solicita terminar perfil antes de STREAM-UI. Integración pendiente de CI del conjunto; mantener visor actualizado desde development conservando solo overlay privado y verificar igualdad de archivos comunes.

# Jobeen — Visor: desplazamiento exterior y experiencia opcional (2026-11-27)

Bloque aprobado: dos botones de 48 px para desplazar exclusivamente el contenedor exterior del visor, barra inferior con espacio propio (no cubre iframe), respeto a movimiento reducido, sin reducir ancho del dispositivo. Ocultar pastilla de experiencia personal cuando meses son cero, desconocidos o inválidos en perfil propio, visitante y ambas presentaciones compartidas; estado Disponible/Trabajando queda centrado. No cambiar datos históricos. CI anterior 46045108013 success, Supabase RPC agregado instalado y verificado (anon denegado). PR #152, rama privada; sin merge/OTA/APK. Pruebas de regresión incluidas, pendiente validar CI/Vercel y captura real.

---
# Jobeen — Correcciones del visor y JCard (2026-11-27)

Bloque autorizado: diferencias perfil propietario/visitante, margen inferior, retorno login, sincronización. Base development e60e313f ya ancestro del visor. Supabase alojado jobin_jcard_data carece de primaryExperienceMonths; years proviene de registros empresariales verificados, no sustituir historial declarado. Preparado candidato `supabase/security-review/public-primary-experience.sql` con agregado de meses únicos por profesión principal, autenticación, visibilidad, bloqueo, revisión de titularidad, sin filas privadas. Requiere pruebas SQL aisladas y autorización separada para aplicar al backend real; no aplicado. Web login en misma pestaña con retorno limitado y TTL, frame restaura página solo tras fase autenticada. Margen 16 y altura mínima compartida calculada. Sin APK, OTA ni merge. Mantener alias estable; antes de cada entrega aprobada de development verificar que SHA sea ancestro de visor y sincronizar mediante merge en rama privada, resolver conflictos y comprobar CI. No automatizar merges de ramas protegidas ni publicar cambios sin autorización.

---
# Jobeen — Visor privado de la web real (2026-11-27)

El propietario confirmó el login real en preview cd308bd (CI 46039823186 success); autorizó URL HTTPS exacta de ese deployment en Supabase. Autorizó visor privado con iPhone 17, Galaxy S22 y Jelly 2. Rama `test/web-device-viewer` desde cd308bd, no fusionar en main/development: solo herramienta estática en public, iframe same-origin de la app real, sin copiar tokens ni datos ni cambiar auth, rutas, backend o nativo. Tamaños CSS 402×874, 360×780 y 320×569 (referencias aproximadas); perfil predeterminado. Protección Vercel se mantiene. Nueva URL estable de rama requiere autorizar exactamente su raíz HTTPS en Supabase antes de OAuth; iniciar sesión en pestaña principal de ese mismo origen, luego volver al visor. Pendiente verificar export, HTTP, navegación y sesión real del propietario. No afirmar captura nativa. PR #151 y OTA #150 independientes.

El propietario reitera que no debe ejecutar código ni procesos técnicos manuales: ChatGPT/Codex/Work se encargan según capacidad, y solo se le solicita autenticación, aprobación o acciones realmente fuera del acceso disponible. Verificar conexiones antes de declarar bloqueo. Visor aprobado: ancho base 390, slider 320–440 px paso 1, presets 320/360/390/402/440, altura proporcional al preset, escala exterior sin cambiar dimensiones CSS internas; conservar página y ancho en URL. Sin modificar app, backend, APK, OTA ni producción. Misma rama y alias estable.

---
# Jobeen — Acceso web real (2026-11-27)

Prioridad explícita del propietario: versión web original con cuenta y datos reales antes del laboratorio visual. Base development e60e313f; preview existente 6343b241 tiene solo workflow adicional. Comprobación HTTP autenticada Vercel: raíz 200 y `/profile` 404 NOT_FOUND. Se entregó acceso temporal a la raíz sin almacenar enlace de acceso en GitHub. Rama `fix/web-original-access`: export Expo web real, dist, fallback SPA sin interceptar assets/API, reactivar previews de development cuando se integre; protección Vercel y Supabase originales intactos. Verificar build, raíz/rutas y login real; no afirmar login validado sin sesión. No mezclar laboratorio `feature/visual-preview-web`, no cambiar main, APK, OTA ni backend. PR #150 OTA anterior independiente; conservar SHA de development hasta finalizar entrega autorizada y obtener aprobación de integración de este cambio web. No repetir auditorías. El propietario confirmó que Google abre selección de correo en incógnito pero no completa la sesión. Se corrige retorno web al mismo origen HTTPS, navegación en la misma pestaña y consumo del callback PKCE en AuthGate manteniendo el esquema nativo y sus controles. Nueva compilación/CI pendientes. Confirmar allowlist exacta de redirecciones HTTPS en Supabase antes de dar login por resuelto; no modificar configuración alojada sin autorización.

---
# Jobeen — Traspaso operativo (2026-11-27)

**Estado:** `development` f34963f8dc72690374f8d79d2bec004009d5d49c, PR #147 integrado; CI 45929026862 success, OTA Android 46031287835 success (artefacto 15214398190). El propietario detectó que el selector Acerca de Personal/Negocio no acompaña la cara de JCard y autorizó sincronizar ambos sentidos. Rama `fix/jcard-about-side-sync`: estado único propio/visitante, gesto y selector conectados, selección pública limitada a caras autorizadas, enlaces a Negocio preservados durante carga; giro existente y acordeón intactos. CI 46033035911: database y lint correctos; TypeScript falló por dos referencias obsoletas aboutSide en contenido público. Corregidas para usar activeCardSide y ampliada prueba de regresión. CI 46033343151: TypeScript, lint y database correctos; 517/523 pruebas. Se conectó el módulo real de selección al entorno simulado y se actualizaron dos expectativas de la conducta anterior, conservando privacidad; añadida prueba de interacción en ambos sentidos. CI 46033582254 success para 184e3d6. El propietario solicita agrupar en una OTA y aprueba añadir Información personal antes de Idiomas en Acerca de > Personal (propio y visitante), hasta dos correos y dos teléfonos manuales consentidos, ocultar sección vacía y cambiar textos a Mostrar correo/teléfono en mi perfil. Se reutiliza RPC existente y ámbito autenticado; sin fallback de datos de acceso. Lectura puntual del catálogo alojado de JobIn confirma que RPC aplica show_email/show_phone pero aún no verifica bloqueo/visibilidad o auth por sí misma; el perfil visitante mantiene su control actual y no se amplían permisos ni se modifica backend. Endurecimiento puntual de RPC requiere autorización alojada aparte; no declararlo desplegado. Nuevo CI del bloque combinado y prueba física pendientes. Sin dependencias, cambios nativos, APK, main, backend alojado ni nueva OTA. **Siguiente:** comprobar HEAD y CI del PR de esta rama, corregir fallos, solicitar merge y OTA separadamente. PR #146 documental permanece independiente. No repetir auditorías ni integrar publicadores temporales.

---

## Contexto histórico (no operativo si contradice lo anterior)

# Jobeen — Continuidad obligatoria (2026-11-22)

**Para ChatGPT y Codex:** leer primero [AGENTS.md](../AGENTS.md) y [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) de la rama activa `fix/message-jshop-authorization-20261121` (PR #70, hasta su promoción autorizada). Este último es el único backlog operativo; comprobar HEAD y CI y continuar desde el siguiente ID. No repetir auditorías concluidas ni pedir al propietario que repita instrucciones. Las órdenes Continua y Fix están definidas en AGENTS.md. No modificar development, main, OTA, Supabase alojado ni compilar APK sin autorización durante esta etapa. El contenido siguiente es contexto histórico; si contradice el estado central o la política vigente, prevalece AGENTS.md y DEVELOPMENT_STATUS.md.

---

# Jobin — Traspaso entre chats

Actualizado: 2026-11-01. Este documento describe el contexto conocido al momento de crearlo; verificar siempre el estado actual del repositorio, GitHub Actions y Supabase.

## MISIÓN ACTUAL DE JOBEEN — LEER SIEMPRE EN UN CHAT NUEVO
Jobeen es la plataforma **mobile-first de transmisiones EN VIVO de personas mostrando su trabajo y oficio**, no una bolsa de empleos generalista. Twitch sirve como referencia de directo, pero se diseña para creadores trabajando con móvil/cámara manos libres en calle, taller, obra u oficina. Los **Flashes** son videos cortos para difundir el trabajo. Visión futura: regalos con valor monetario durante directos y en Flashes (aún NO funcionales). Priorizar siempre emisión móvil, descubrimiento de lives, participación segura, clips y luego herramientas profesionales. Evitar diseños cargados de íconos.

**Norma vinculante:** consultar primero `AGENTS.md` y `docs/JOBEEN_PRODUCT_VISION.md`. La nueva revisión de UX es **por fases**, con menús principales unificados (Configuración, perfil propio y perfil público), pestañas interiores del perfil propio Todo/JCards/Videos/En vivo/Acerca de solo texto, con JCards privadas y barra global inferior de cinco iconos INTACTA. Usar Mobbin/X solo para distribución y limpieza, sin copiar el estilo. Mantener mismas columnas en Jelly y teléfonos mayores. No confundir la visión de regalos o gafas con capacidades ya implementadas.

## BLOQUEO ACTUAL: seguridad de cuentas
Opción 2 aprobada: aislamiento reforzado. Leer AGENTS.md y docs/ACCOUNT_ISOLATION.md antes de continuar. Incidente de historial/JCard cruzados; UX suspendida hasta contención, pruebas y recuperación segura. No confundir código de revisión con protección ya publicada.

El PR #69 completó el piloto aislado de GoTrue privado con reto por operación y el ensayo combinado de JCard, verificación, CV y multimedia con los módulos antiguos y candidatos. Las ACL permanecieron cerradas en la reversión. El proxy de documentos pasó revocación concurrente, bloqueos y rutas alternativas locales, incluidos S3 y transformación. El bloqueo continúa hasta verificar Google, recuperación y el emisor anterior en un entorno equivalente, Smart CDN real, procedencia de consentimientos heredados, ensayo Android con runtime identificado y validación nativa. La arquitectura alojada real sigue vigente. Ver [piloto y costes](PRIVATE_AUTH_PILOT.md), [despliegue y reversión](SECURITY_DEPLOYMENT.md), [Jelly 2](ANDROID_SECURITY_JELLY2.md), [pendientes](ACCOUNT_ISOLATION.md#piloto-privado-y-ensayo-combinado) e [inventario nativo](native-capabilities-baseline.md). El inventario incluye entrevistas privadas y opciones de un solo SDK audiovisual. Mantener los cambios visuales y la monetización en espera.

## Continuación PR #70 — auditoría de mensajes y sesiones
Rama `fix/message-jshop-authorization-20261121`, [PR #70](https://github.com/thekyngmotorcycles/Jobin/pull/70), dependiente de PR #69. Último punto confirmado verde: 24c3cc4, CI 44973272347. Se refuerza el workspace profesional: ninguna copia completa en disco sin cifrar, caché únicamente en memoria por UUID/session_id. Incluye candidato SQL de vínculos laborales con pruebas A/B/C; se continúa el aislamiento de certificados y revisión documental. La etapa siguiente protege vínculos laborales y confirmaciones diferidas, con revisión de catálogo alojado en solo lectura. Incluye candidatos de autorización exacta, contacto aceptado bilateral, permisos mínimos, ocultación de incoherencias históricas de JShop y guardas por UUID/session_id para mensajería, contactos, notificaciones y CV. La etapa siguiente añade pruebas de comportamiento de la continuidad y protege el contador de notificaciones. Consultar siempre la punta y CI actuales. No fusionar, desplegar SQL compartido, publicar OTA ni compilar APK sin autorización correspondiente. Seguir los bloqueos de ACCOUNT_ISOLATION.md, no declarar cierre basándose en CI únicamente.

## Protocolo permanente de diseño (aprobado)
Leer `DESIGN_RULES.md` antes de cualquier tarea UI/UX: consultar Mobbin, presentar 2 o 3 propuestas, aplicar MD3 con áreas táctiles mínimas de 48dp, preservar identidad visual y esperar aprobación explícita antes de implementar. Aplicar minimalismo funcional contemporáneo en todas las pantallas: referencias actuales verificadas en Mobbin, títulos únicos y claros en menús/configuración sin descripciones rutinarias, excepciones imprescindibles justificadas y aprobadas, accesibilidad y avisos necesarios intactos. Esto no bloquea correcciones técnicas y de seguridad autorizadas. La auditoría de privacidad sigue siendo prioritaria; no iniciar rediseños ni APK nuevas.

## Menús minimalistas aprobados, implementación pendiente

El 2026-11-21 el propietario aprobó combinar la lista minimalista de la opción 1 con la presentación adaptada al contexto de la opción 3. El bloqueo de privacidad sigue vigente. El PR #69 continúa en borrador y la lectura del catálogo de Supabase confirmó que la política de lectura pública de verificaciones empresariales sigue activa y que la proyección pública empresarial y la protección candidata de multimedia aún no están instaladas. Retomar el diseño cuando se cierre el bloqueo descrito en [ACCOUNT_ISOLATION.md](ACCOUNT_ISOLATION.md). La aprobación del diseño ya está registrada.

- **Base común.** Reutilizar `SettingsMenuRow` en los tres menús y las páginas completas de configuración. Usar títulos breves, iconos semánticos sencillos y chevrons solo para navegación a otra pantalla. Quitar descripciones rutinarias de filas y categorías, bordes por fila y fondos decorativos de iconos. Separar grupos con espacio y divisores discretos. Usar filas de 48 a 56 dp cuando el texto y la accesibilidad lo permitan, con un área táctil mínima de 48 × 48 dp y espacio adicional cuando lo requiera el escalado de texto.
- **Configuración de Home y perfil propio.** Conservar la apertura lateral y la animación de Home. Mantener buscador, categorías y funciones de Home. Las descripciones del catálogo pueden seguir alimentando las coincidencias de búsqueda. En el perfil propio se mantienen las condiciones de acceso a herramientas profesionales y administrativas. Las páginas completas comparten filas, tipografía, iconos y separación.
- **Perfil visitante.** Mantener el menú flotante y ajustar su altura a las opciones disponibles. Mostrar Guardar JCard, Compartir perfil, Bloquear perfil y Denunciar perfil sin descripciones redundantes. Diferenciar discretamente las acciones sensibles y conservar sus confirmaciones. Mantener también los avisos de seguridad, errores, instrucciones e información imprescindible de todas las superficies.
- **Alcance y verificación.** Revisar `src/components/SettingsMenuRow.tsx`, `HomeSideMenu.tsx`, `ProfileCommunityActions.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/jcard.tsx`, `src/app/menu/[section].tsx`, `src/lib/jobin-settings-catalog.ts` y los tokens `menu-chrome`, `control-metrics` y `typography`. Preservar JCards, barra inferior, acordeón, rutas, permisos, tipografía, colores, gradientes y todos los temas. Mantener la misma composición en teléfonos, incluido Jelly 2. Después de implementar, comprobar TypeScript, lint, pruebas automatizadas y GitHub Actions, así como todas las opciones, contraste, áreas táctiles, texto escalado y ausencia de cortes o solapamientos en Android. La tarea sigue sin implementación, APK ni OTA.

**Referencias revisadas visualmente en Mobbin para iOS.** LinkedIn muestra categorías con una etiqueta e icono por fila y agrupa los ajustes internos mediante encabezados. X muestra un menú flotante con una etiqueta por acción y un icono que distingue bloquear y denunciar. En ajustes de X, los chevrons acompañan entradas que navegan y los interruptores se reservan para ajustes binarios. Las capturas consultadas no indican una fecha de captura verificable en el conector. [Configuración de LinkedIn](https://mobbin.com/screens/864a15e3-c2aa-43e4-9a51-c1c6c8cedef1) · [Preferencias de LinkedIn](https://mobbin.com/screens/301886a2-18f9-4d64-bd32-74520df9f8e6) · [Menú contextual de lista de X](https://mobbin.com/screens/100f9cff-2258-4216-bd1b-4d2bbd2d66e7) · [Seguridad y privacidad de X](https://mobbin.com/screens/a8d40fda-41dd-42fb-a875-2aced38b6e5f)

## Referencias
- GitHub: https://github.com/thekyngmotorcycles/Jobin
- Rama de auditoría: `fix/account-isolation-history-20261121` ([PR #69](https://github.com/thekyngmotorcycles/Jobin/pull/69)). Rama de integración: `development`. Rama estable: main (NO modificar sin aprobación explícita).
- Reglas obligatorias: AGENTS.md y DESIGN_RULES.md.
- Expo/React Native + Expo Router; TypeScript; Supabase; OTA EAS development.
- El usuario prueba visualmente desde Android y aporta capturas. Todo el texto de interfaz en español.

## JCard y diseño
- Temas claro/oscuro y otros; fondos con líneas curvas satinadas y borde en relieve.
- Orden de datos: nombre legal; @usuario; profesión principal + ícono interactivo; años generales de experiencia y disponibilidad con cuadros informativos; contacto según privacidad; sección sutil «Idiomas»; insignias de profesiones secundarias solamente.
- Profesión HVAC: texto corto «Técnico HVAC», categoría «Aire acondicionado» al tocar el ícono. Experiencia específica de profesión principal en su cuadro informativo. Experiencia general cuenta períodos de todas las profesiones sin duplicar solapamientos.
- Banderas de idiomas pequeñas con aro rojo (bajo), amarillo (medio), verde (alto).
- La J del wordmark Jobin es la identidad visual deseada para el check. No declarar verificación sin revisión.
- Archivos importantes: src/components/JobinCard.tsx, src/components/LanguageRing.tsx, src/theme/jcard.ts, src/theme/wordmark.ts, src/app/(tabs)/profile.tsx, src/app/professional.tsx.
- Posibles asuntos visuales: confirmar que la J del check realmente se renderiza, verificar tipografía JCard, superposición con navegación Android y layout de muchos sellos.

## Vínculo laboral confirmado por empresa
- La empresa debe aprobar; si rechaza no se publica vínculo. Permitir buscar por nombre o @usuario, enviar solicitud, aprobar, rechazar, retirar, finalizar. Incluso para empresa propia, se requiere aprobación.
- Supabase: tabla public.jobin_employer_links; RPC jobin_search_employers, jobin_employer_links_for_me, jobin_request_employer, jobin_decide_employer, jobin_end_employer. Migraciones aplicadas en proyecto JobIn durante 2026-11-01.
- Archivos: src/lib/employer-links.ts; src/app/employer-links.tsx; src/app/professional.tsx; src/app/company.tsx; src/app/(tabs)/profile.tsx.
- Solo estados approved se muestran en la JCard, con enlace a /company?id=...
- IMPORTANTE: verificar pruebas automatizadas y flujo de extremo a extremo antes de declarar terminado. Posibles tareas: revisar tipado de la pantalla employer-links, comportamiento de cuenta personal/empresa, evitar mostrar empresa si disponibilidad no es ACTIVE, y verificar que un trabajador pueda administrar vínculos después de cambiar de estado.
- Revisión de seguridad: tabla con RLS y acceso directo revocado; RPC SECURITY DEFINER con controles auth.uid(). Validar permisos y casos límite.

## Trabajo pendiente y próximos pasos
1. Inspeccionar CI y Expo development para último SHA, corregir errores y confirmar disponibilidad Android.
2. Prueba E2E con dos cuentas: búsqueda, solicitud, rechazo, reintento, aprobación, enlace JCard, retirada/finalización, revocación.
3. Revisar seguridad Supabase: RLS, restricciones de estado, acceso a perfiles bloqueados, múltiples solicitudes, aislamiento de entornos.
4. Revisar UX de aprobación y tipografía/insignias; corregir errores observados por el usuario.
5. Preparar Supabase Development/Production separados antes del lanzamiento.
6. Cuando el usuario lo autorice: PR de development a main, checklist de publicación y tag v0.1.0.

## Prompt reutilizable
«Continuemos mi proyecto Jobin. Repositorio GitHub: thekyngmotorcycles/Jobin. Conecta GitHub y Supabase, lee primero AGENTS.md, DESIGN_RULES.md y docs/CHAT_HANDOFF.md en la rama activa, revisa el último commit, las pruebas de GitHub Actions y la publicación de Expo. Sigue las reglas: main es estable y NO se modifica ni fusiona sin mi autorización explícita; cambios pequeños en development, funciones grandes en feature/* y luego development. Todo en español. No asumas que algo está publicado sin verificarlo. Quiero que continúes desde el estado real del código, identifiques pendientes y me indiques qué está listo para probar en Android. No expongas secretos. Mi siguiente tarea es: [ESCRIBIR AQUÍ].»
