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
