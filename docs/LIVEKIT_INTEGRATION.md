# STREAM-01B — LiveKit (decisión del propietario, 2026-11-24)

## Alcance aprobado
LiveKit como transporte de Live; comenzar con Cloud Build gratuito y mantener la posibilidad de autoalojar. Sin contratación de pago, despliegue, secretos, migraciones alojadas, grabación, APK ni OTA por esta decisión. SDK móvil pendiente de integración y verificación de versiones Expo 54 / RN 0.81.5; no instalar paquetes especulativos.

## Reutilizar lo existente
Supabase sigue siendo autoridad de identidad, titularidad, sanciones, visibilidad y lease. El worker server/moderation/worker.ts y los contratos existentes siguen siendo la vía de preparación, supervisión, renovación, revocación y finalización. No duplicar el sistema de moderación ni habilitar jobin_start_live legado. El reproductor HTTPS actual utiliza expo-video y revoca reproducción si pierde autorización. El nuevo SDK se destina inicialmente al emisor; audiencia de solo lectura mediante entrega HTTPS protegida. No crear un servicio de chat o pagos por anticipado.

## Candidato técnico para prueba de viabilidad
LiveKit privado para ingestión, identidad y permisos emitidos exclusivamente por servidor tras verificar Supabase. Sala única por sesión de transmisión, nunca reutilizar identificador de sala finalizada. Publicador solo cámara/micrófono de su propio Live; sin suscripción, datos, administración o grabación por defecto. Supervisor exclusivamente suscripción, identidad de servicio separada, nunca credenciales de proveedor en el cliente. Sin tokens de audiencia para sala de ingestión. La función de política livekit-access.ts prepara grants acotados para la futura integración; no firma ni emite tokens ni es un endpoint. Sus argumentos deben proceder de autorización verificada por servidor, no del cuerpo arbitrario del cliente.

Salida privada de LiveKit/Egress a un punto de entrega compatible con el contrato HTTPS y el reproductor existente, donde se autorice cada solicitud y se interrumpa la entrega en curso al vencer el lease. Revisar latencia y costo antes de seleccionar implementación definitiva. Separar fuente privada de moderación y salida para audiencia; ni manifest ni segmentos ni origen de almacenamiento podrán eludir el corte. No persistir ni distribuir grabaciones sin autorización. Contenido ya recibido/buffered no puede revocarse retroactivamente; medir latencia y contenido residual del cliente.

LiveKit no desconecta conexiones activas por expiración del JWT; Cloud puede revocar tokens al quitar participantes con matices de revocación; el autoalojado no ofrece esa revocación de tokens existente. Por eso ni TTL ni RemoveParticipant aislados constituyen la garantía de 15 s del contrato actual. No declarar failClosedLeases=true hasta probar la interrupción efectiva de salida, también ante fallo del worker/control plane y con conexiones abiertas. La política de fecha límite es una pieza de prueba, no un gateway activo.

## Aceptación incremental
1. Validar compatibilidad SDK/plugins y build local sin publicar. Seleccionar versiones y lockfile; conservar identidad de Expo/Android, firma y native private-files. APK únicamente tras aprobación expresa y consolidación de cambios nativos.
2. Probar sala privada A/B con permisos mínimos y tokens de servidor; revalidar sesión y autorización antes de cada emisión. Sin cámaras/micrófonos activados por defecto al entrar. Probar salida/segundo plano/red.
3. Probar entrega privada y lease absoluto <=15 s con expiración, terminal, solicitud retrasada, acceso a origen/segmentos, caída de worker, cache y streams abiertos. Medir latencia de extremo a extremo. Ninguna exposición pública hasta pasar estas pruebas y moderación real de cinco categorías con evidencia y callbacks firmados.
4. Solo después habilitar integración hospedada previa autorización del propietario. Cloud Build no equivale a servicio de moderación ni presupuesto de egress; verificar cuotas y consumo antes de pruebas largas. Mantener visibilidad de costo, no contratar automáticamente.

## Referencias oficiales revisadas 2026-11-24
- https://docs.livekit.io/transport/sdk-platforms/expo/
- https://docs.livekit.io/frontends/reference/tokens-grants/
- https://docs.livekit.io/transport/self-hosting/
- https://docs.livekit.io/transport/media/ingress-egress/egress/outputs/
