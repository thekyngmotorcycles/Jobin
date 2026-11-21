# Jobeen · Auditoría visual integral (provisional)
Fecha: 2026-11-21. **No son normas definitivas hasta la aprobación de capturas reales por el propietario.**

## Fuente visual
Referencia: opción Premium limpia de Compartir aprobada en chat. Comparación contra capturas reales del Jelly 2/Jelly Star. El diseño de referencia es una imagen renderizada, no código React Native; por ello las cifras son objetivos aproximados, sujetos a pruebas en Android y accesibilidad.

## Tres etapas de implementación (sin OTA hasta revisión)
1. **Compartir:** títulos semánticos, subtítulos y nombres compactos, diámetro menor de avatar y opciones; check Jobeen en esquina superior, envío múltiple y botones externos conservados; botón Enviar con **40 dp de altura visible dentro de 48 dp táctiles**.
2. **Paneles y controles:** tokens para superficie crema cálido `#FCF9F4` en tema claro, interior blanco, radios 30/26/18/16 dp según hoja/diálogo/menú/control, botón visible 40 dp, mínimo táctil 48 dp; Privacidad de mensajes desplazable con safe area, Vista previa/Borradores compactos, menú del perfil con énfasis destructivo solo en icono.
3. **Pantallas secundarias:** encabezado nativo único en Cuenta y seguridad y Solicitudes de mensajes, navegación con título de 18 dp, listas de Configuración con filas más compactas y acordeones de JCard personal/empresa con padding uniforme; confirmación de cierre de sesión con diálogo Jobeen.

## No cambiar sin aprobación posterior
- Identidad o contenido interno de JCards, logos o medios.
- Navegación inferior y acordeón; permisos, base de datos o lógica de mensajes.
- Escala de fuente del sistema: mantener texto accesible y áreas táctiles suficientes.
- Publicar OTA o generar APK. Nunca APK sin autorización expresa.

## Pruebas visuales para aprobación
- **Teléfono pequeño (Jelly):** compartir JCard y perfil público; selección de 0, 1 y varios contactos; texto largo; QR/WhatsApp/SMS/Más opciones; verificar que todo sigue visible y desplazable con teclado y sin él.
- **Teléfono estándar de 390–430 dp o emulación equivalente:** contraste con la referencia: tamaños ópticos, alineación centrada de nombres bajo avatar, check completo dentro del margen, botón 40 dp visible.
- **Ventanas:** Vista previa, Borradores vacíos y con contenido, descartar cambios, privacidad de mensajes (opciones y switch), menú de perfil; contrastar radio, crema y tipografía.
- **Pantallas:** Cuenta y seguridad, Configuración lateral, Solicitudes de mensajes, JCard personal y negocio en edición cerrada y expandida; evitar encabezados duplicados, cortes y scroll abrupto.
- **Estados:** modo claro y oscuro; tamaño de fuente estándar y aumentado; errores, confirmaciones y acciones destructivas.
- **Regresión funcional:** borrar/cancelar, aceptar/salir, guardar, contactar, enviar a contactos, navegación y back Android.

## Criterio de cierre
Los PRs deben tener CI verde, las capturas del Android deben ser revisadas por el propietario y sus ajustes aprobados expresamente antes de integrar en `development`. Después de la aprobación visual se podrán trasladar los tokens definitivos a `AGENTS.md` y documentación de diseño.

**Estado:** implementación propuesta en PRs de revisión; **validación visual en Android pendiente**.
