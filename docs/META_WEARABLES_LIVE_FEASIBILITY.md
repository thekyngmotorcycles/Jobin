# Jobeen Live — Ray-Ban Meta y Oakley Meta (viabilidad, no implementación)

Investigación actualizada: 2026-11-22. Estado: **compatibilidad probable alta; NO validado en Jobeen ni en el APK**.

## Hallazgo respaldado

- Meta Wearables Device Access Toolkit (DAT) 1.0 tiene versión estable desde septiembre de 2026 y ofrece SDK nativo Android/iOS con captura de cámara, transmisión de video y acceso a audio/micrófono. Los modelos oficialmente anunciados son **Ray-Ban Meta Gen 1 y Gen 2**, **Oakley Meta HSTN**, **Oakley Meta Vanguard** y Meta Ray-Ban Display. Meta advierte que las capacidades varían por dispositivo.
- La aplicación móvil puede recibir video desde las gafas mediante el SDK; **esto no equivale a tener un Live funcional de Jobeen**. Aún requiere puente nativo para Expo/React Native, audio/video sincronizados, transporte hacia el servicio Live seleccionado, control de permisos, reconexión y pruebas de hardware.
- SDK y muestras Android: https://github.com/meta/meta-wearables-dat-android y https://github.com/meta/meta-wearables-dat-android/tree/main/samples/CameraAccess
- Documentación y compatibilidad: https://developers.meta.com/wearables/faq/ y https://developers.meta.com/wearables/device-access-toolkit/

## Prioridad y alcance

**Función de producto aprobada para evaluación de viabilidad; no compromiso de la próxima APK.** No introducir SDK ni permisos nativos especulativos mientras están pendientes SEC-02/SEC-03/SEC-05 y el servicio de directos de Jobeen. Evitar una APK por cada función: incluir el puente nativo en el binario consolidado **solo si** Codex valida previamente que es compatible, está justificado por el alcance del Live inicial, las autorizaciones están disponibles y el propietario aprueba ampliar el alcance de esa compilación.

La tarea técnica es adecuada para **Codex** (no para el chat paralelo dedicado a SEC-05): estudio de documentación del SDK, compatibilidad con Expo SDK 54 / React Native 0.81.5 / New Architecture, Mock Device Kit, acceso real a modelos soportados, integración y necesidades de recompilación. No editar SEC-03 ni instalar el SDK desde el otro chat.

## Criterios de viabilidad (antes de integración)

1. Confirmar el acceso real desde Android a cámara/audio de **Ray-Ban Meta** y **Oakley Meta** con las versiones de firmware y SDK elegidas; documentar diferencias entre modelos.
2. Demostrar recepción y entrega de cuadros y audio a un único transporte Live autorizado por Jobeen, sin confundir un preview local con retransmisión pública.
3. Verificar registro del dispositivo, permisos revocables, indicador visible de grabación/Live, finalización real del stream, pérdida de conexión, batería, latencia, calor y consumo de datos.
4. Probar primero con dispositivo simulado; la compatibilidad de la APK con Jelly 2 y lentes físicos necesita prueba posterior.
5. Evaluar términos de Meta, países disponibles y publicación antes de comprometer la distribución.

**Restricciones vigentes:** sin APK/EAS Build, OTA, cambios al backend alojado, adquisiciones, SDK nativo o promoción a main/development sin autorización. No bloquear la compilación de seguridad por una función Live todavía no seleccionada para esa versión.

Registro operativo central: `docs/DEVELOPMENT_STATUS.md`. Este documento conserva solo la evidencia técnica y la decisión de alcance.
