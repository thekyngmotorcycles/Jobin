# Próximas entregas — referencia histórica

**Actualización aprobada 2026-11-23:** la dirección vigente es `docs/JOBEEN_MASTER_PLAN_UIUX.md` v1.3 §§1.1–1.5 y el estado operativo único es `docs/DEVELOPMENT_STATUS.md`. Esta lista histórica no inicia tareas ni prevalece sobre el Master Plan. Jobeen es complemento de herramientas empresariales, no ERP ni sistema de vigilancia. Citas fuera de alcance; comunidades independientes pospuestas. No implementar módulos o integraciones sin aprobación.

1. Cuentas y perfiles: Supabase Auth, perfiles públicos y datos privados separados, ciudad, servicios y disponibilidad. RLS y pruebas de autorización antes de habilitar persistencia.
2. Feed: upload firmado desde servidor, procesamiento y webhooks verificados de Mux, paginación y reproducción adaptativa.
3. Marketplace: reservas con exclusión de horarios superpuestos, Stripe Connect Express, checkout y confirmación solo desde webhook verificado. No prometer escrow; definir el flujo permitido de pagos y reembolsos.
4. Conexiones profesionales: contactos, seguidores, consentimiento, bloqueo, reportes y mensajería autorizada. Citas excluidas del roadmap.
5. Comunidades locales independientes: POSPUESTAS; reevaluar con el filtro de producto antes de desarrollar.
6. Creación: plantillas de escenas, captura, subtítulos y publicación.
7. Calendarios con OAuth y consultas por video en la base universal Expo para iOS, Android y web.

## Entidades previstas
profiles, private_profile_preferences, services, videos, guilds, guild_memberships, availability, bookings, connection_interests, matches, messages, blocks, reports y payment_events.

Importes en unidades menores con moneda explícita. Fechas en UTC y zona horaria por profesional. Eventos de pago idempotentes. Nunca aceptar precios, identidad del emisor ni confirmaciones de pago enviados por el cliente.
