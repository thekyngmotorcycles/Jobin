# Próximas entregas

1. Cuentas y perfiles: Supabase Auth, perfiles públicos y datos privados separados, ciudad, servicios y disponibilidad. RLS y pruebas de autorización antes de habilitar persistencia.
2. Feed: upload firmado desde servidor, procesamiento y webhooks verificados de Mux, paginación y reproducción adaptativa.
3. Marketplace: reservas con exclusión de horarios superpuestos, Stripe Connect Express, checkout y confirmación solo desde webhook verificado. No prometer escrow; definir el flujo permitido de pagos y reembolsos.
4. Conexiones: consentimiento independiente para profesionales, amistad y citas; likes privados; match mutuo transaccional, bloqueo, reportes y mensajería autorizada.
5. Comunidades locales: membresías persistentes y moderación.
6. Creación: plantillas de escenas, captura, subtítulos y publicación.
7. Calendarios con OAuth y consultas por video; Expo para iOS y Android con dominio compartido.

## Entidades previstas
profiles, private_profile_preferences, services, videos, guilds, guild_memberships, availability, bookings, connection_interests, matches, messages, blocks, reports y payment_events.

Importes en unidades menores con moneda explícita. Fechas en UTC y zona horaria por profesional. Eventos de pago idempotentes. Nunca aceptar precios, identidad del emisor ni confirmaciones de pago enviados por el cliente.
