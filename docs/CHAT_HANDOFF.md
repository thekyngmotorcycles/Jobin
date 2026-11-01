# Jobin — Traspaso entre chats

Actualizado: 2026-11-01. Este documento describe el contexto conocido al momento de crearlo; verificar siempre el estado actual del repositorio, GitHub Actions y Supabase.

## Referencias
- GitHub: https://github.com/thekyngmotorcycles/Jobin
- Rama de trabajo: development. Rama estable: main (NO modificar sin aprobación explícita).
- Reglas obligatorias: AGENTS.md.
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
«Continuemos mi proyecto Jobin. Repositorio GitHub: thekyngmotorcycles/Jobin. Conecta GitHub y Supabase, lee primero AGENTS.md y docs/CHAT_HANDOFF.md en la rama development, revisa el último commit, las pruebas de GitHub Actions y la publicación de Expo. Sigue las reglas: main es estable y NO se modifica ni fusiona sin mi autorización explícita; cambios pequeños en development, funciones grandes en feature/* y luego development. Todo en español. No asumas que algo está publicado sin verificarlo. Quiero que continúes desde el estado real del código, identifiques pendientes y me indiques qué está listo para probar en Android. No expongas secretos. Mi siguiente tarea es: [ESCRIBIR AQUÍ].»
