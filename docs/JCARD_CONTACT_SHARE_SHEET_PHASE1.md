# Jobeen · Panel propio para compartir JCards (primera implementación)

## Aprobación y diseño
- La acción «Compartir JCard» abre un panel de Jobeen, no directamente el selector de Android.
- Arriba: buscador de contactos aceptados, sugerencias ordenadas por conversación reciente y selección de hasta 5 destinatarios.
- El botón «Enviar a N contactos» solicita una confirmación explícita mediante la propia pulsación, sin envíos al elegir avatares.
- Para cuentas sin conversación activa, el enlace se envía como una única **solicitud de mensaje** sujeta a la privacidad del destinatario. Los mensajes privados directos se usan únicamente si el chat existente está aceptado.
- Se indican fallos parciales; no se declaran envíos exitosos cuando no hay aceptación del servidor.
- Abajo: WhatsApp, SMS, Copiar, Más. Se reordenan localmente según el uso en Jobeen; no se leen las aplicaciones instaladas o el historial del sistema.
- «Copiar» utiliza el selector nativo de Android, que ofrece «Copiar» (requiere elegirlo en dicho selector). Para copiar directamente en un toque se necesitaría evaluar un módulo de portapapeles nativo y una APK nueva.
- «Más» conserva el selector nativo completo.
- Cada mensaje con enlace JCard del esquema `jobin://jcard?user=<uuid>&card=<side>` muestra «Ver JCard», que abre la cara indicada en la propia app.
- Antes de enviar internamente o compartir fuera se consultan nuevamente los controles de visibilidad de la JCard.
- No se modifican la navegación de perfil, el acordeón, la distribución de JCards, el diseño de la tarjeta ni las preferencias de privacidad.

## Integración
- `src/components/JCardShareSheet.tsx`: mismo panel reutilizado por la JCard propia, visitante y menú de tres puntos.
- `src/lib/jcard-sharing.ts`: búsqueda sobre relaciones aceptadas y envío con control de acceso de mensajes.
- `src/lib/jcard-share-link.ts`: construcción y parseo de enlaces, sin dependencias nativas.
- `src/app/message.tsx`: botón para abrir JCards compartidas.
- Enviar a varios contactos crea envíos individuales, no chats de grupo.

## Pendiente
- Prueba visual en el Jelly Star/Jelly 2 y móvil estándar: layout de 3/4 columnas, teclado, teclado desplegado, paginación y escala de fuente.
- Integración con avatar real cuando esté disponible y autorizada.
- Exportar JCard en imagen a la galería y un botón de portapapeles en un toque pueden requerir una nueva build nativa.
- No existe todavía «compartir publicación» ni «compartir anuncios»; el componente se ha diseñado como base reutilizable.
- Mantener el PR experimental como borrador. No publicar OTA ni fusionar `development`/`main` sin autorización del usuario.
