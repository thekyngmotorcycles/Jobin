# Jelly 2 · Prueba manual de aislamiento

Usar la APK instalada y dos cuentas de prueba A y B con datos ficticios en un entorno aislado. Si la APK apunta al proyecto compartido y no hay cuentas o escrituras de prueba autorizadas, registrar versión, canal, update y lo que pueda observarse en lectura. No cambiar contraseñas reales, eliminar datos, limpiar el almacenamiento de la app ni instalar otro binario para esta pasada.

## Con la APK instalada

1. **A en línea.** Confirmar la identidad en Perfil. Guardar un borrador de prueba con texto y foto distinguibles. Abrir Historial, JCard personal, JCard empresarial si existe, Mis JCards y Mensajes. Registrar qué datos privados ficticios pertenecen exclusivamente a A y cuáles se compartieron expresamente.
2. **A sin conexión.** Activar modo avión, volver a la app y abrir el borrador. Puede aparecer contenido local de A o un aviso de conexión. Una foto cuyo enlace haya caducado puede requerir conexión o volver a seleccionarse. Regresar a la pantalla anterior, cerrar y reabrir la app y observar qué queda disponible. Si el cierre de sesión necesita red, anotarlo y completar el cierre al reconectar.
3. **B.** En línea, cerrar A e iniciar B. Pasar por Borradores, Historial, JCards y Mensajes inmediatamente y tras unos segundos. Repetir sin conexión y al recuperar la red. Los recursos privados de A no deben aparecer, ni siquiera brevemente. Una JCard pública o una conversación compartida y autorizada pueden seguir visibles.
4. **Volver a A.** Cerrar B, iniciar A y comprobar que el borrador, la foto, el historial, la colección de JCards y las conversaciones legítimas de A reaparecen según su disponibilidad. Forzar una transición lenta desactivando la red al abrir un borrador o historial y reactivarla tras cambiar de cuenta. Una respuesta pendiente de A no debe rellenar la pantalla de B.
5. **Evidencia.** Anotar pantalla, secuencia, cuenta A/B, estado de red, versión de APK, update y hora. Si aparece contenido privado ajeno, detener el flujo y conservar una captura redaccionada. Evitar incluir tokens, enlaces firmados, correos o mensajes reales.

## Tras incorporar las correcciones

Repetir la matriz con el cliente del PR mediante un update de prueba compatible y con el SQL candidato en el entorno aislado, ambos previamente autorizados. Confirmar otra vez A→B→A, restauración de fotos tras reconectar y que resultados antiguos no sustituyen las fotos del borrador activo. Comprobar el CV autorizado y revocado, la visibilidad y los contactos de la JCard de terceros, las reseñas y el mapa. Una APK existente solo demuestra las correcciones si carga el update que las contiene y usa el backend correspondiente.

Almacenamiento seguro para tokens y cifrado de cachés y borradores requieren integración nativa y una APK nueva aprobada para su validación. El Jelly 2 con la APK actual puede aportar evidencia de comportamiento, pero la reautenticación obligatoria y los permisos directos se comprueban también contra Auth, REST y Storage.

## Criterios definitivos de aceptación

Registrar la versión de APK que muestra Android y el canal, runtime e ID del update activo cuando estén disponibles mediante los datos del build o del update. Marcar los valores desconocidos. Distinguir la APK sin correcciones de la misma APK con el cliente candidato cargado desde el canal aislado. Preparar una publicación privada de A compartida con B y un borrador solo de A, con datos e imágenes ficticios.

| Caso | APK instalada | Cliente candidato y backend aislado |
| --- | --- | --- |
| Cierre y A→B→A | Registrar qué se ve al cerrar, reabrir o cambiar cuentas. | Una respuesta tardía de otra sesión no reaparece. Revisar perfil, JCards visibles y guardadas, historial, mensajes y notificaciones. |
| Borrador, fotografía y reconexión | Probar creación, guardado, modo avión y reapertura tras reconectar. | Conservar texto, descripción accesible y foto local de A. Volver a abrir borrador y vista previa después de cinco minutos para recuperar el respaldo autorizado. Confirmar que A puede publicar desde ese respaldo y B no puede firmarlo ni verlo. |
| Contenido compartido y revocación | Registrar el acceso que permite el backend en uso. | B ve la publicación autorizada. Revocar y abrir de nuevo tras cerrar y reconectar. Un acceso nuevo debe quedar denegado. Anotar aparte imágenes ya descargadas o cacheadas. |
| CV, reseñas y JCards | Registrar qué depende del esquema heredado. | Confirmar CV autorizado y revocado, proyección empresarial, contacto oculto, reseñas y mapa. Repetir A→B→A con sesión expirada y verificar titularidad del historial. |
| Arranque offline | Cerrar y reabrir sin Wi‑Fi ni datos móviles. Observar al reconectar. | Verificar primero el update activo. La recuperación no copia borradores, mensajes, historiales o tarjetas privadas entre cuentas. |

Vincular cada resultado a un binario, runtime, update y esquema identificados. La reautenticación obligatoria, el CDN y la revocación estricta de documentos requieren también pruebas de servidor.
