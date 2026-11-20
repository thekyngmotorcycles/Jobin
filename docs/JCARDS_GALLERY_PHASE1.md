# Jobeen · Galería de JCards — Fase 1 (interfaz)

## Aprobado
- Sustituir «Inicio» por «JCards» en las pestañas del perfil **propio**, sin tocar la barra principal inferior.
- «Todo» pasa a ser la pestaña predeterminada y mantiene todas las publicaciones reales.
- Orden del propietario: Todo · JCards · Videos · En vivo · Acerca de.
- Los visitantes ven únicamente Todo · Videos · En vivo · Acerca de. Las colecciones guardadas son **privadas**.
- Preservar completamente las animaciones, las transformaciones parallax, el pin de pestañas y el acordeón.
- Mantener la funcionalidad actual de publicaciones y tarjetas, sin alterar sus medidas.

## Qué incluye esta rama
- Navegación owner/visitor.
- Galería con estado vacío informativo: sin tarjetas ficticias, sin acciones visualmente habilitadas que no funcionen.
- Pruebas para aislamiento de galería, navegación y no-regresión de acordeón.
- **Sin cambios en Supabase, sin nuevas migraciones ni suscripciones, sin OTA, sin APK.**

## Por desarrollar, sujeto a autorización por cambio
1. Persistencia privada en Supabase: guardar, quitar, marcar favorita y ordenar JCards empresariales.
2. JCard vinculada al negocio, consultando campos públicos actuales y respetando visibilidad.
3. Notificaciones internas de cambios reales de contacto, con deduplicación, preferencias y opt-in.
4. Notificaciones push opcionales tras probar permisos/dispositivo y proveedor.
5. Guardar imagen en galería y compartir un enlace que abra la cara correspondiente.
6. Casos límite: cuentas eliminadas, negocios sin datos públicos, cambios de propietario, bloqueo y uso desconectado.

## Validación
- CI: lint, TypeScript, tests y export.
- Revisión visual en Jelly Star y teléfono estándar antes de integrar.
- No fusionar esta rama ni publicar una OTA sin aprobación explícita posterior.
