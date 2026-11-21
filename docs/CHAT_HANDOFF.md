# Jobin — Traspaso entre chats

Actualizado: 2026-11-01. Este documento describe el contexto conocido al momento de crearlo; verificar siempre el estado actual del repositorio, GitHub Actions y Supabase.

## MISIÓN ACTUAL DE JOBEEN — LEER SIEMPRE EN UN CHAT NUEVO
Jobeen es la plataforma **mobile-first de transmisiones EN VIVO de personas mostrando su trabajo y oficio**, no una bolsa de empleos generalista. Twitch sirve como referencia de directo, pero se diseña para creadores trabajando con móvil/cámara manos libres en calle, taller, obra u oficina. Los **Flashes** son videos cortos para difundir el trabajo. Visión futura: regalos con valor monetario durante directos y en Flashes (aún NO funcionales). Priorizar siempre emisión móvil, descubrimiento de lives, participación segura, clips y luego herramientas profesionales. Evitar diseños cargados de íconos.

**Norma vinculante:** consultar primero `AGENTS.md` y `docs/JOBEEN_PRODUCT_VISION.md`. La nueva revisión de UX es **por fases**, con menús principales unificados (Configuración, perfil propio y perfil público), pestañas interiores del perfil propio Todo/JCards/Videos/En vivo/Acerca de solo texto, con JCards privadas y barra global inferior de cinco iconos INTACTA. Usar Mobbin/X solo para distribución y limpieza, sin copiar el estilo. Mantener mismas columnas en Jelly y teléfonos mayores. No confundir la visión de regalos o gafas con capacidades ya implementadas.

## BLOQUEO ACTUAL: seguridad de cuentas
Opción 2 aprobada: aislamiento reforzado. Leer AGENTS.md y docs/ACCOUNT_ISOLATION.md antes de continuar. Incidente de historial/JCard cruzados; UX suspendida hasta contención, pruebas y recuperación segura. No confundir código de revisión con protección ya publicada.

El PR #69 completó el piloto aislado de GoTrue privado con reto por operación y el ensayo combinado de JCard, verificación, CV y multimedia con los módulos antiguos y candidatos. Las ACL permanecieron cerradas en la reversión. El proxy de documentos pasó revocación concurrente, bloqueos y rutas alternativas locales, incluidos S3 y transformación. El bloqueo continúa hasta verificar Google, recuperación y el emisor anterior en un entorno equivalente, Smart CDN real, procedencia de consentimientos heredados, ensayo Android con runtime identificado y validación nativa. La arquitectura alojada real sigue vigente. Ver [piloto y costes](PRIVATE_AUTH_PILOT.md), [despliegue y reversión](SECURITY_DEPLOYMENT.md), [Jelly 2](ANDROID_SECURITY_JELLY2.md), [pendientes](ACCOUNT_ISOLATION.md#piloto-privado-y-ensayo-combinado) e [inventario nativo](native-capabilities-baseline.md). El inventario incluye entrevistas privadas y opciones de un solo SDK audiovisual. Mantener los cambios visuales y la monetización en espera.

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
