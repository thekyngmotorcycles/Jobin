# PR #69 · Despliegue y reversión de seguridad

**Estado del PR #69.** Se completó el ensayo combinado de contratos en aislamiento. El corte alojado, la comprobación de Smart CDN y la prueba con la APK instalada siguen pendientes. El SQL de `supabase/security-review/` es candidato. El proyecto compartido permanece en solo lectura durante la auditoría.

## Consumidores y compatibilidad

| Contrato | Consumidores identificados | Condición de despliegue |
| --- | --- | --- |
| `jcard_business_details`, `jobeen_public_business_cards`, `jobeen_business_handle_available` | JCard visitante, tarjetas guardadas, menciones, Home, reseñas, edición de negocio, disponibilidad de usuario y mapa. La edición y la comprobación de la tarjeta propia para el mapa conservan el acceso por propietario. | El cliente anterior consulta directamente la tabla para varios flujos de terceros. Restringir la tabla primero puede ocultar empresas, contactos autorizados o reseñas a clientes antiguos. Mantener una ventana coordinada o suspender esos flujos donde el cliente anterior no pueda actualizarse. |
| `jobeen_find_profiles_on_map` | Búsqueda del mapa. La presencia usa consentimiento de ubicación propio. Las políticas de escritura comprueban la categoría del propietario. | Conservar firma, filtros y política de presencia. La ubicación de mapa y la visibilidad de la JCard son decisiones distintas. Comprobar ambas en Android. |
| `company_verifications`, `verified_companies` | La vista pública mantiene el identificador de empresas con verificación vigente. El backend usa `private.is_verified_company`. La búsqueda local no encontró consumidores móviles de la tabla interna. | Restringir la tabla y dejar la vista en solo lectura. Verificar primero si hay consumidores administrativos o externos fuera del repositorio. |
| Historial, solicitudes CV y RPC existentes | Historial de perfil, CV en JCard, notificaciones y el disparador de actividad. | Conservar firmas y estados. Verificar lectura del propietario, solicitudes legítimas, revocación y ausencia de acceso directo de terceros. |
| Buckets de borradores, fotos privadas, historias y sus referencias | Editor, galería de borradores, feed, perfil e historias. | Conservar buckets, rutas y contratos. Probar que los archivos propios y compartidos legítimamente funcionan. Los enlaces firmados son credenciales de portador hasta su vencimiento. |
| Auth | Cambio de contraseña, inicio de sesión y recuperación. | Validar contraseña actual, recuperación y cuentas sin contraseña antes de cambiar políticas de Auth. El cliente del PR envía un código de reautenticación, pero carece de la entrada de contraseña actual. |

La inspección de catálogo del proyecto compartido comprobó RLS en las tablas revisadas, concesiones amplias que requieren reducción y las RPC de CV heredadas como `SECURITY DEFINER` en `public`. En los candidatos, las operaciones privilegiadas del CV y la proyección empresarial quedan bajo `jobeen_private` con ruta de búsqueda fija y comprobación del usuario. Mantener ese esquema fuera de los esquemas expuestos por PostgREST. La inspección del código y el catálogo no confirma los consumidores externos.

## Secuencia para un despliegue futuro

1. **Preparar un entorno aislado equivalente.** Fijar el commit, proyecto, versiones exactas de Auth y Storage y configuración de roles. Registrar la versión, canal y `runtimeVersion` de la APK del Jelly 2 y el último update estable. Comprobar que el JS del candidato es compatible con ese runtime. Reproducir la estructura heredada, ACL, funciones, vistas, triggers y políticas, con usuarios sintéticos y sin copiar filas privadas.
2. **Preparar cambios y reversión por separado.** Capturar las definiciones y concesiones actuales, incluidos permisos por columna y opciones de vistas, en almacenamiento administrativo restringido. Preparar una copia verificable de recuperación, y conservar los conteos agregados ya registrados del incidente. Revisar el diff de esquema transaccional y ensayar instalación y reversión local. Mantener separados los cambios de Auth.
3. **Introducir contratos aditivos.** Aplicar primero `business-card-projection.sql` en el ensayo aislado. Agrega la proyección empresarial y la consulta de disponibilidad antes de retirar permisos del cliente anterior. Validar desde un cliente candidato en el entorno aislado que la proyección aplica visibilidad, bloqueos y enmascarado de contacto. La exposición heredada continúa hasta retirar la lectura amplia. Si la ventana no es aceptable, usar una ventana de mantenimiento y restringir los flujos afectados. Ninguna de estas acciones está autorizada en el proyecto compartido por este plan.
4. **Coordinar el corte.** Solo tras aprobación y pruebas, confirmar que el cliente compatible está en el canal acordado y que al reiniciar recibe la versión correcta. Aplicar `business-card-privacy.sql` después de verificar la proyección. Retirar por separado los privilegios innecesarios de verificación. Aplicar los candidatos de CV y multimedia como grupos independientes. Verificar políticas, permisos directos, RPC, reseñas, mapa, historial, tarjetas guardadas, fotos privadas y compartidas. Usar A/B/C y comprobar el cliente anterior donde aún esté en servicio. El binario puede recibir cambios JS compatibles sin recompilar. La compatibilidad de esta APK todavía requiere la prueba manual.
5. **Comprobar Auth aparte.** El ajuste Secure password change de GoTrue 2.188.1 exige código a sesiones de más de 24 horas, pero por sí solo permite cambios directos en sesiones recientes. La opción de contraseña actual bloquea cambios sin contraseña correcta en sesiones recientes de cuentas con contraseña. Probar recuperación y cuentas sin contraseña y decidir un control que cubra las rutas directas antes de habilitarlo. La confirmación del correo anterior y del nuevo es una garantía distinta. No habilitar cierre de cuenta ni exportaciones sensibles hasta validar autorización y reautenticación en servidor.

## Reversión sin reabrir el acceso

- Si falla una prueba antes del corte, detener la promoción. En el entorno aislado, revertir el bloque aditivo o restaurar el cliente de prueba anterior. Conservar logs, definiciones previas y pruebas fallidas.
- Si falla después del corte, conservar las restricciones de propietarios y las lecturas redaccionadas. Limitar temporalmente las funciones afectadas antes de revertir a un cliente que depende de lecturas inseguras. Revertir por transacción solo el bloque compatible, usando las definiciones capturadas y revisadas. Restaurar una OTA previa únicamente si es compatible con las restricciones aún activas. Repetir los casos A/B/C y las pruebas por API antes de reabrir funciones.
- La reversión no debe volver a conceder lecturas amplias, reclasificar buckets privados como públicos ni reasignar o borrar datos del incidente. Conservar evidencia, comprobar titulares y tramitar cualquier reparación de datos mediante un procedimiento aparte y aprobado.

## Matriz de compatibilidad al cierre sin APK

| Cliente y backend | Evidencia y resultado |
| --- | --- |
| APK instalada y esquema actual | El binario, canal, update activo y runtime del Jelly 2 todavía se deben identificar en el dispositivo. El cliente anterior de `development` conserva lectores directos de la tabla empresarial. La inspección del esquema compartido confirmó que faltan la proyección empresarial y la RPC de disponibilidad, y siguen pendientes las restricciones de verificación y multimedia. |
| Cliente corregido y esquema actual | La búsqueda y las vistas de terceros que dependen de la proyección quedan incompletas. La prueba de transición comprueba la ausencia del contrato en el esquema heredado. No promover el cliente a un canal que apunte a ese esquema. |
| Cliente anterior y esquema propuesto | La lectura de tabla propia se conserva. Las consultas de terceros a la tabla quedan restringidas y los lectores antiguos pueden perder empresas, reseñas, menciones o tarjetas. La prueba de transición cubre el cambio de acceso en la base descartable. |
| Cliente corregido y esquema propuesto | Los contratos se verificaron con SQL y servicios aislados. El fingerprint Android local coincide con el de `ce03573` al generar ambos en el mismo directorio con las mismas dependencias y configuración. Queda confirmar que ese runtime es el que carga la APK instalada y completar Jelly 2. |
| OTA de prueba | Solo en canal y backend aislados, tras autorización. Registrar SHA, runtime, canal y update anterior, y comprobar inicio limpio y arranque offline. Si el runtime del dispositivo difiere, usar un cliente de prueba ya compatible o dejar el caso pendiente. |

La ventana de exposición existe desde la fase aditiva hasta el cierre de la lectura heredada. Durante la fase aditiva, la proyección puede existir mientras las rutas antiguas conservan acceso amplio. Si deben retirarse primero los permisos por privacidad, el cliente anterior pierde temporalmente esos flujos. El corte requiere decidir qué ventana es aceptable y medir clientes antiguos antes de ampliar disponibilidad.

## Reautenticación en el endpoint original

### Controles oficialmente soportados y verificados

- GoTrue 2.188.1 acepta un cambio de contraseña sin nonce cuando la sesión tiene menos de 24 horas, aun con **Require reauthentication when changing password**. En una sesión antigua el nonce es obligatorio y rechaza valores incorrectos, caducados, reutilizados o emitidos a otra cuenta. Para la misma cuenta GoTrue acepta el nonce desde otra sesión antigua. [Password security](https://supabase.com/docs/guides/auth/password-security) · [GoTrue 2.188.1](https://github.com/supabase/auth/blob/v2.188.1/internal/api/user.go)
- **Require current password when changing password** se verificó en el endpoint directo con una cuenta que ya tenía contraseña y una sesión reciente. Rechazó solicitudes sin la contraseña actual o con una incorrecta. El SDK instalado admite `current_password`. El cliente actual no envía ese campo y habilitar la opción antes del cliente compatible puede romper cambios legítimos. La primera contraseña y la recuperación tienen condiciones distintas. Esta opción ofrece una comprobación de credencial y no exige un reto de un solo uso en todas las cuentas. [Password security](https://supabase.com/docs/guides/auth/password-security)
- Con un factor TOTP inscrito y confirmado, la prueba directa rechazó un cambio de contraseña y un cambio de correo en AAL1. La sesión AAL2 reciente cambió contraseña sin un reto nuevo para la operación. Los hooks documentados cubren momentos como alta, emisión de JWT, envío y verificación de credenciales, sin un hook general que autorice cada actualización sensible de `/auth/v1/user`. RLS protege las tablas de aplicación y puede exigir AAL2 en operaciones propias. [MFA](https://supabase.com/docs/guides/auth/auth-mfa) · [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
- Con confirmación automática desactivada y cambio seguro de correo habilitado, la prueba local exigió ambos buzones para aplicar el cambio. La petición pudo iniciarse sin un nonce. La eliminación por la API administrativa rechazó a un usuario normal y sigue sin flujo de autoservicio en Jobeen. La inspección del catálogo compartido no encontró escritura de `payments` o `payment_accounts` para `authenticated`, ni una RPC pública ejecutable nombrada como retiro o desembolso. Esto no acredita un flujo financiero operativo. [Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)

### Opciones de arquitectura

| Alternativa | Cobertura, riesgos y prerrequisitos |
| --- | --- |
| Mantener Auth administrado y exigir contraseña actual | Reduce el riesgo de una sesión reciente robada para cuentas con contraseña. Requiere un flujo compatible, recuperación probada y decisión de MFA para cuentas críticas. La prueba directa debe cubrir altas por proveedor externo, primera contraseña y recuperación. El reto obligatorio por cada operación sigue pendiente. |
| Controlar el origen de Auth | Un despliegue administrado por Jobeen puede mantener GoTrue en red privada y exponer solo un punto de entrada que controle todas las mutaciones sensibles. Requiere operar Auth, SMTP/SMS, llaves, alta disponibilidad, cambios de cliente y recuperación, y comprobar que la ruta de origen y rutas equivalentes están inaccesibles al cliente. El reto de un solo uso debe vincular usuario, sesión y operación, caducar y consumirse atómicamente. Probar acceso directo, replay y concurrencia antes de migrar. [Supabase self-hosted](https://supabase.com/docs/guides/self-hosting) |
| Migrar a un proveedor de identidad con control por operación | El proveedor debe imponer el reto también en su API nativa. Integrar OIDC con Supabase requiere preservar el vínculo entre identidades, RLS, Storage, recuperación y revocación de sesiones. La integración de terceros no desactiva Supabase Auth en el proyecto administrado. Hace falta retirar las credenciales y rutas GoTrue heredadas para las cuentas protegidas o aislarlas y comprobar la transición. [Third-party Auth](https://supabase.com/docs/guides/auth/third-party/overview) |

Una Edge Function, un RPC o un proxy delante de un GoTrue administrado cuyo endpoint original acepta la misma mutación deja abierta la ruta directa. Evitar triggers sobre tablas internas de Auth como control de seguridad del flujo. Para eliminación de cuenta, exportación privada, compras sensibles, cambios de destino, pagos o retiros futuros, un servidor propio debe tener la única autoridad de escritura. Exigir sesión vigente y reto reciente de un solo uso vinculado a la acción y, en dinero, al importe, moneda y destinatario. Comprobar idempotencia, permisos del proveedor, eventos firmados y ausencia de escrituras directas antes de habilitar operaciones.

## Archivos, enlaces y revocación

| Clase | Política |
| --- | --- |
| Público deliberado | Bucket público para recursos aprobados como publicaciones públicas y avatares públicos. Separar objetos, rutas y reglas de caché de borradores y documentos. Cambiar a privacidad requiere ruta nueva y gestión del objeto público previo. Un cambio de campo de audiencia no retira copias públicas. |
| Compartido según audiencia | Fotos de posts en bucket privado con RLS y TTL de emisión de 300 s. Historias activas con 120 s. Los borradores son del autor, conservan respaldo privado y bajan de 3600 a 300 s. La vista previa firmada existe en memoria. Al abrir el borrador o su vista previa, se puede volver a pedir una URL con la sesión válida. Esos TTL reducen la exposición a nivel de origen, con margen para abrir imágenes y sin alterar la audiencia. |
| Identidad, certificados y evidencias | Mantener buckets privados. El cliente solicita hoy 60 s para identidad y 120 s para certificados o evidencia de empleador. Nuevas cargas desde los flujos auditados solicitan `cacheControl: "0"`. La alternativa para acceso revocable es servir por autorización de solicitud con un backend propio o una Edge Function, con lectura directa y emisión de enlaces denegadas por política para los usuarios finales. Conservar carga y acceso administrativo autorizados. |

- **Origen y caché.** Con GoTrue y Storage aislados, las cargas de borrador guardaron `max-age=0` y la lectura autenticada devolvió ese valor. La ruta firmada devolvió `Expires` correspondiente al TTL. El origen volvió a evaluar el acceso cuando el seguidor dejó de estar autorizado. La prueba no incluye Smart CDN. Allí el TTL del objeto y el del token son independientes. Una respuesta cacheada puede sobrevivir a la caducidad del enlace o al cambio de RLS, y la lectura autenticada puede reutilizar una respuesta mientras el JWT siga vigente. No registrar enlaces, guardarlos en cachés persistentes o servir documentos sensibles con caché compartida. [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
- **Autorización por solicitud.** Se probó que una política restrictiva con `storage.allow_only_operation` permite GET autenticado al titular y deniega firmar desde el endpoint individual y por lote para un bucket sintético. Para documentos que exigen revocación estricta, resolver un identificador en servidor a un objeto autorizado. Validar firma, caducidad, sesión activa, estado del titular y rol o consentimiento actual en cada solicitud, incluida una petición parcial. Servir bytes con `Cache-Control: private, no-store, max-age=0` y sin caché CDN en el proxy. Restringir acceso directo al bucket y a sus endpoints de firma, copia y lectura antes de declarar el cierre. Verificar que el cliente anterior tenga un camino compatible o suspender su lectura. [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- **Revocación efectiva.** Revocar permisos bloquea nuevas autorizaciones en origen. Un enlace de portador ya emitido puede seguir funcionando. Para un incidente, planificar purga de CDN y, si procede y se autoriza, rotación y revocación de la clave específica de firma de Storage o retirar el objeto tras preservar evidencia. La propagación y cachés locales deben comprobarse. Destruir evidencias, invalidar todas las URL del proyecto o reasignar rutas son acciones separadas. Ningún control recupera bytes ya entregados. [URL Signing Keys](https://supabase.com/docs/guides/storage/security/signing-keys)

## Arquitectura aprobada para el piloto aislado

Pilotar **GoTrue sin bifurcar, en un origen privado de Jobeen**, con un único ingreso que controle todas las mutaciones sensibles. Mantener durante el piloto Postgres, REST y Storage administrados si se demuestra la integración de tokens e identidades. El piloto debe confirmar que `auth.uid()`, las referencias existentes a `auth.users`, la recuperación y la revocación conservan el vínculo de cada cuenta. Si esta integración no se puede verificar, evaluar una pila aislada completa antes de migrar. El endpoint alojado previamente debe quedar incapaz de mutar las identidades protegidas antes del corte. Una URL nueva o habilitar OIDC por sí solo no retira ese origen. Las restricciones de red documentadas para Supabase administrado se aplican a Postgres y su pooler. [Network Restrictions](https://supabase.com/docs/guides/platform/network-restrictions)

- **Contrato.** El servidor registra la intención con usuario, sesión vigente, acción y datos de la operación. Vincula la prueba reciente a esa intención, aplica caducidad y consume el permiso de forma atómica. Para mutaciones fuera de la base local, conservar el resultado y reconciliar reintentos sin repetir efectos. El token AAL2 general, su renovación y la biometría local no sustituyen esa prueba.
- **Cobertura.** El cliente ordinario no tiene una ruta alternativa hacia Auth ni credenciales de administración. Verificar contraseña y correo, alta y recuperación, enlaces OAuth, cuenta sin contraseña, eliminación, exportación y revocación. En pagos, regalos, suscripciones o retiros, imponer permisos y la acción aprobada en el backend y en el proveedor de pagos. Validar intento concurrente, reutilización, sesión expirada, otra cuenta y cambios del destino o del importe.
- **Coste y riesgo.** La mitigación administrada con contraseña actual y MFA tiene menor coste operativo, pero cubre solo parte del riesgo y necesita adaptar el cliente y recuperación. Operar GoTrue privado añade ingreso, operación de Auth, correo o SMS, disponibilidad, llaves, backups y respuesta a incidentes. Mantener el código upstream reduce el coste de mantener un fork. Un IdP gestionado solo conviene si impone el reto en su API nativa y permite retirar las credenciales GoTrue heredadas. Añade coste por uso, dependencia del proveedor y migración de identidades. La pila completa es la opción con mayor responsabilidad operativa.
- **Decisión pendiente.** El piloto con identidades sintéticas ya se ejecutó. Decidir después si se ensaya un backend alojado separado, con Google, recuperación y proveedores reales de infraestructura de prueba. Una migración de identidades o cambio del emisor de producción requiere una aprobación propia. [Resultados del piloto](PRIVATE_AUTH_PILOT.md)

[Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks) · [Third-party Auth](https://supabase.com/docs/guides/auth/third-party/overview) · [Supabase self-hosted](https://supabase.com/docs/guides/self-hosting)

## Ensayo de transición con JWT reales

PostgreSQL 17, GoTrue 2.188.1 y PostgREST 14.8 en local. Se reprodujo el contrato heredado con datos sintéticos y se usaron consultas del SDK con la misma tabla, vista, filtros y campos que los lectores de las dos versiones. El ensayo cubre estos contratos REST. La ejecución de la APK y el esquema alojado completo requieren una pasada aparte.

| Fase | Comprobación realizada |
| --- | --- |
| Heredada | El lector anterior encuentra la empresa y el contrato corregido aún no existe. El ensayo rechazó ejecutar el corte antes de instalar la fase aditiva. |
| Aditiva | `supabase/security-review/business-card-projection.sql` crea la vista y la RPC en una transacción. El lector corregido obtiene datos enmascarados. La lectura heredada conserva su exposición durante esta fase. |
| Corte | `supabase/security-review/business-card-privacy.sql` exige la fase aditiva y aplica las restricciones en una transacción. El propietario conserva su lectura directa y los terceros usan la proyección enmascarada. |
| Reversión de cliente | Se repitieron las consultas antiguas conservando el corte. La lectura ajena siguió denegada y la propia funcionó. El lector antiguo pierde esa función pública. Revertir solo a un cliente compatible con la proyección o dejar temporalmente el flujo afectado suspendido. |

Mantener la proyección y las ACL del corte ante una reversión de cliente. Preparar el ensayo completo en un esquema equivalente para los bloques de CV, verificación y multimedia antes de cualquier aprobación. Registrar contratos, runtime y plan de restauración seguro. [Protocolo Jelly 2](ANDROID_SECURITY_JELLY2.md)

## Ensayo aislado de documentos preexistentes

El catálogo compartido confirmó que identidad, certificados, documentación empresarial y evidencias revisadas tienen buckets privados con políticas de lectura. La consulta fue de metadatos. Las políticas de lectura que nombran esos buckets no limitaban la operación con los helpers de Storage. El ensayo HTTP usó archivos ficticios, JWT reales de A/B/C y Storage API 1.48.28 sin Smart CDN.

1. **Permiso anterior.** B obtuvo un enlace de un documento preexistente. Después de retirar su permiso, la lectura autenticada y la nueva firma quedaron denegadas. El enlace ya emitido siguió funcionando en origen.
2. **Retirar la dirección anterior.** En el ensayo se movió el objeto sintético a una ruta distinta en un bucket privado reservado al backend. El enlace anterior dejó de entregar bytes antes de vencer. A/B/C quedaron sin descarga, firma individual o por lote, listado, acceso público ni copia directa del nuevo objeto.
3. **Control por solicitud.** Un proxy local de prueba verificó identidad, sesión activa y permiso vivo y sirvió el objeto con `private, no-store`. A y B autorizados pudieron leer y C recibió denegación. Una vez revocado B, también se denegó su solicitud con cabecera Range. El cierre de sesión de A invalidó el acceso del proxy aunque su JWT aún existía. Se conservó la posibilidad autorizada de leer para el titular hasta cerrar sesión.

Para migrar documentos reales, aprobar una prueba separada. Inventariar objetos y consumidores por bucket, suspender firma nueva, preservar evidencia y registrar el traslado y la integridad antes de retirar la ruta anterior. Bloquear lectura, copia y firma directas para usuarios finales en el destino y probar las rutas habilitadas del proyecto, incluidas transformaciones, S3 y API de datos si corresponden. Purgar las cachés del origen anterior y comprobar respuesta por CDN, incluidos enlaces precalentados. Las cachés de navegador y los bytes ya descargados requieren tratamiento distinto. El ensayo local no valida propagación de CDN ni rutas deshabilitadas. Al revertir, conservar el destino privado y el bloqueo de la ruta antigua. No volver a servir la dirección que ya circuló.

[Storage RLS](https://supabase.com/docs/guides/storage/security/access-control) · [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)

## Ensayo combinado y reversión del cliente

Se ejecutaron los módulos JCard y CV de `bf212a9` y del candidato con Supabase JS, JWT reales y servicios locales. Las tablas heredadas ausentes de las migraciones se representaron con fixtures sintéticos. El ensayo pasó por esquema base, proyección aditiva y aplicación conjunta de JCard empresarial, verificación, CV y guardas multimedia. Con las ACL del corte conservadas, el lector anterior dejó de ver fichas de terceros por la ruta antigua. Ambos clientes conservaron historial propio, consentimiento y revocación de CV. Se verificaron insignia vigente, denegación de registros internos de verificación, lectura social autorizada y aislamiento de borradores con las dos duraciones solicitadas por el cliente. Queda comprobar esquema alojado equivalente, consumidores externos y flujos completos en Android.

Los defaults históricos de contacto empresarial eran `true`. El corte cambia el default futuro a `false`. Una fila antigua con `true` puede corresponder al valor por defecto o a una autorización explícita. Conservar evidencia y resolver su procedencia antes de publicar el campo. Si no se puede demostrar, mantener el contacto oculto hasta una nueva confirmación del titular. El ensayo de enmascarado usó opciones de privacidad explícitas. [Prueba de transición](../supabase/security-review/pilot/transition.cjs)

## Control de documentos y Smart CDN

- El proxy de prueba consultó sesión, consentimiento y bloqueos vigentes antes de abrir Storage y otra vez antes de entregar bytes. Dos peticiones de B en curso, una con Range, se denegaron al retirar el permiso durante la lectura. A conservó acceso propio y C quedó fuera. Una caché HTTP sintética almacenó el control público y omitió las respuestas `private, no-store`. El proxy local devuelve el documento pequeño completo a lectores autorizados, sin soporte parcial ni persistencia. Un servicio futuro debe definir límites de tamaño, manejo de Range, tiempos y control de caché del cliente.
- En Storage local, A/B/C quedaron sin lectura directa, pública, firma individual y por lote, copia o listado de la bóveda. El endpoint S3 con JWT y la ruta de transformación de imágenes tuvieron controles positivos sobre archivos autorizados y denegaron la lectura en la bóveda. Se retiraron del origen las direcciones sintéticas de enlaces originales y transformados. El backend de transformación de prueba devuelve una imagen fija después de que Storage autoriza la ruta. No se movieron documentos reales. [S3 con sesión](https://supabase.com/docs/guides/storage/s3/authentication)
- **Smart CDN sigue sin verificación empírica.** El único proyecto alojado disponible es el compartido. El ensayo local carece de la red de Smart CDN, documentada para planes Pro y superiores. Supabase indica hasta 60 s de propagación para la invalidación tras actualizar o retirar un objeto. Una respuesta ya entregada, descargada o guardada por un navegador queda fuera de la revocación. Las rutas sensibles nuevas deben servir únicamente por el proxy, sin autorización cacheada ni URLs directas, y evitar persistencia del cliente. La decisión se comprueba por solicitud. No puede deshacer bytes ya enviados.
- Para aceptar una transición real, solicitar un proyecto aislado con Smart CDN habilitado. Precalentar exactamente las mismas URLs sintéticas, una original y otra transformada, desde dos ubicaciones. Registrar `cf-cache-status`, `Age` si se emite, estado HTTP y tiempos sin guardar el token. Revocar el permiso, aislar la dirección antigua y comprobar tanto aciertos de caché como consultas a origen hasta que la ruta anterior deje de responder en ambos sitios. Cerrar cualquier ruta alternativa habilitada, incluidas claves S3 de servicio, antes de habilitar el proxy. Tratar enlaces antiguos aún servidos como exposición pendiente. [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn)

## Contrato de historial profesional privado

La propuesta de corte se limita a [employment-private-contact.sql](../supabase/security-review/employment-private-contact.sql). El candidato de CV `employment-privacy.sql` tiene su propio alcance y su propia aprobación. Probar primero en PostgreSQL descartable. Ejecutar en JobIn solamente con aprobación expresa del propietario para el SHA revisado.

1. Revalidar el destino y el catálogo. Se espera `jcard_employment_history` con RLS, políticas permisivas de titular para lectura, creación, edición y eliminación, clave única `(owner_id, client_id)`, identificador generado y `verified_by` anulable con valor por defecto nulo. Al preparar el corte, JobIn tenía 12 filas, cero verificadas y ningún objeto de contacto desplegado. Registrar solo totales agregados y definiciones, incluidos permisos de columna. Si cambia el esquema previsto, reconciliar el delta antes de ejecutar.
2. Aplicar el archivo del commit aprobado en una sola transacción con una conexión administrativa existente. El límite de espera evita retener la operación si hay otra transacción larga. Si el DDL falla, la transacción revierte por completo. Usar un servicio de conexión configurado mediante un mecanismo seguro.

   ```sh
   psql --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
     --command="SET LOCAL lock_timeout='5s'" \
     --file=supabase/security-review/employment-private-contact.sql \
     --command="NOTIFY pgrst, 'reload schema'"
   ```

3. Verificar por catálogo la tabla, la clave foránea, RLS, los permisos y la firma invoker del RPC. Confirmar los totales del historial y que la proyección de `read_approved_employment(uuid)` conserva sus campos. Comprobar la lectura del titular al reabrir Jobeen. Para validar escrituras por HTTP, usar solo cuentas y registros de prueba autorizados. La edición del perfil de #117 se habilita al recuperar los contactos. La acción de eliminación del candidato requiere una OTA compatible autorizada.
4. El DDL toma bloqueos breves y reduce permisos históricos. Clientes anteriores que intenten escribir columnas de propiedad o verificación directamente podrían perder esa escritura. La eliminación confirmada de una experiencia pendiente elimina su contacto asociado. Las verificaciones de empleadores y los datos heredados quedan sujetos a sus reglas de conservación.

### Reversión del contrato

Si el corte ya confirmó y hay que suspenderlo, conservar tabla, filas, RLS y protecciones de verificación. Retirar el guardado y la edición hasta revisar el problema. El perfil vuelve al modo de lectura de #117. Aplicar este SQL solo tras autorización de reversión.

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
REVOKE EXECUTE ON FUNCTION public.jobeen_save_private_employment(uuid,text,text,text,text[],integer,integer,integer,integer,text,text)
 FROM public,anon,authenticated;
REVOKE ALL ON public.jobeen_employment_private_contact FROM public,anon,authenticated;
REVOKE DELETE ON public.jcard_employment_history FROM public,anon,authenticated;
REVOKE INSERT (owner_id,client_id,company,role,professions,from_year,from_month,to_year,to_month,updated_at),
 UPDATE (company,role,professions,from_year,from_month,to_year,to_month,updated_at)
 ON public.jcard_employment_history FROM public,anon,authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
```

Volver a aplicar el mismo candidato restaura los permisos previstos y conserva los contactos guardados.

## Contención del historial heredado

[SQL candidato exacto](../supabase/security-review/employment-legacy-ownership-hold.sql). Requiere aprobación explícita para JobIn. La coincidencia en cuatro grupos históricos permite contener el lote, pero la titularidad individual permanece pendiente de verificación independiente.

1. Revalidar los cuatro grupos y las 12 filas del 15 de noviembre de 2026 con consultas agregadas. Comprobar el contrato de contactos instalado y que `read_approved_employment(uuid)` conserve el cuerpo alojado que selecciona por titular o consentimiento aprobado. Si el catálogo cambió, reconciliar el diff antes de aplicar. Una modificación independiente de ese RPC debe conservar el filtro de revisión.
2. Ejecutar el candidato en una sola transacción con `ON_ERROR_STOP` y `SET LOCAL lock_timeout='5s'`. Incluir `NOTIFY pgrst, 'reload schema'` antes del commit. El SQL aborta si el lote esperado cambió. El DDL toma bloqueos temporales. La marca administrativa mantiene los campos originales y el acceso se limita mientras se comprueba la titularidad.
3. Revalidar por catálogo y totales. Verificar con cuentas autorizadas que historial directo, contactos y CV excluyan las filas en revisión y que las entradas legítimas sigan disponibles. Verificar también la RPC de estado antes de preparar la OTA compatible, para que el teléfono muestre la revisión de titularidad en vez de un historial vacío.
4. Antes del commit, cualquier fallo revierte toda la transacción. Después del commit, mantener las restricciones y conservar las filas si se revierte el cliente. Resolver cada marca únicamente tras acreditar la titularidad con evidencia independiente y autorización específica. El cliente anterior omite las filas retenidas por RLS y puede mostrar experiencia incompleta. Restaurar la visibilidad indiscriminada volvería a mostrar los datos del incidente.

## Proyección empresarial del perfil visitante

La corrección del acceso personal funciona con el esquema actual. Para habilitar la cara empresarial, el mínimo es aplicar en JobIn el bloque de proyección de [business-card-projection.sql](../supabase/security-review/business-card-projection.sql) hasta `grant select on public.jobeen_public_business_cards to authenticated;`. El bloque de disponibilidad de nombres empresariales y el corte de permisos de las tablas heredadas tienen su propia revisión.

Antes del corte autorizado, confirmar que la vista está ausente, que `jobeen_private` queda fuera de los esquemas expuestos por PostgREST y que existen las columnas de `profiles`, `jcard_visibility` y `jcard_business_details` y la función bilateral `private.is_blocked(uuid,uuid)`. El catálogo verificado contiene las dependencias y carece de la vista y del esquema privado del candidato.

Con una conexión administrativa existente y aprobación expresa del propietario, aplicar el prefijo en una transacción:

```sh
set -o pipefail
sed '/^-- Hidden handles are still reserved/,$d' supabase/security-review/business-card-projection.sql |
  psql --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction --file=- \
    --command="NOTIFY pgrst, 'reload schema'"
```

Verificar en la API, con cuentas de prueba autorizadas, la lectura con datos de contacto enmascarados y las denegaciones de fichas ocultas, bloqueadas y cuentas desactivadas. Una reversión puede revocar `SELECT` de `authenticated` sobre la vista tras autorización. Conservar las protecciones y filas de origen.

## Cierre de permisos empresariales — segunda etapa

La proyección autorizada del PR #126 (f12e1b32) se instaló en JobIn y se comprobó con tres identidades SQL: vista invoker, contactos enmascarados, sin acceso anónimo, tres fichas y 12 historiales retenidos intactos. El permiso directo de descubrimiento de la tabla heredada sigue exponiendo columnas privadas. La corrección preparada reutiliza los archivos existentes; no elimina archivos ni registros.

- El único RPC alojado adicional que consulta la tabla empresarial directamente es el mapa invoker. Los accesos cliente a la tabla para edición y presencia propia están ligados al UUID titular; feed, menciones y cara visitante usan la proyección. El índice único del handle ya existe. Falta el RPC de disponibilidad, que incluye nombres ocultos sin divulgar datos.
- Tras aprobación separada del SHA, ejecutar en una única transacción el **sufijo** de `business-card-projection.sql` desde `-- Hidden handles are still reserved` (sin reinstalar el prefijo ya aplicado) seguido de `business-card-privacy.sql`. Usar lock_timeout de 5 segundos, ON_ERROR_STOP, recarga de esquema. Validar primero firma/ACL/RLS y dependencias. La etapa conserva lectura y escritura del titular, revoca permisos directos ajenos incluso por columna, cambia solo los defaults futuros a false, y usa la vista para buscar empresas en mapa. La empresa oculta/bloqueada no cae al nombre personal. La búsqueda de profesionales conserva su contrato. No aplicar las demás etapas de mapa ni de perfil personal por este permiso.
- Comprobar lectura del titular, denegación de terceros/anon, nombre disponible/ocupado (incluido oculto), proyección y mapa con roles autenticados. Comprobar integridad de filas, preferencias existentes y contención del historial. Las preferencias antiguas true no acreditan consentimiento por sí mismas: dos fichas tienen contactos marcados para compartir; confirmar su procedencia antes del lanzamiento. No resetearlas sin decisión del propietario. No hay pines reales al preparar este corte; las pruebas de pines son sintéticas.
- Si falla cualquier paso antes del commit, abortar transacción. Tras el commit, no volver a habilitar lectura directa ajena; reparar el consumidor concreto mediante proyección. La restricción no cambia filas ni borra datos. Candidatos de privacidad de mapa y búsqueda posteriores conservan alcance separado.

## Resolución de titularidad del historial legado

El propietario confirmó expresamente que las cuatro experiencias corresponden a una sola cuenta de las tres afectadas. La inspección read-only confirma 4 grupos de 3 copias (12 retenidas), una entrada independiente nueva y su contacto, sin contactos ligados a las retenidas. Existe un consentimiento CV aprobado en la cuenta legítima: la restauración recupera la visibilidad bajo ese consentimiento existente, no concede otros permisos. Verificar si el titular desea conservar o revocar ese consentimiento antes del corte. No se valida la veracidad laboral ni se añade sello de verificación.

Candidato: `employment-legacy-ownership-resolution.sql`. Tras CI y autorización explícita: revalidar huella de filas, titular inequívoco y cuatro grupos; en transacción única establecer `SET LOCAL lock_timeout='5s'` y el UUID confirmado mediante `set_config('jobin.approved_employment_owner',<UUID confirmado>,true)`; ejecutar candidato con ON_ERROR_STOP, recargar esquema. No incluir UUID real en Git. La restricción existente permanece: ocho copias excluidas siguen retenidas y no se pueden leer ni mutar desde las cuentas; cuatro copias del titular se liberan. La marca adicional solo distingue exclusión resuelta de revisión activa y no se puede escribir desde cliente. No borrar ni reasignar datos, no volver a ejecutar el candidato inicial de contención tras la resolución. Verificar 4 recuperadas, 8 excluidas, entrada independiente/contacto intactos, CV con consentimiento, RPC de revisión false en las tres cuentas y ausencia de cambios en políticas originales. Si la transacción falla, se revierte íntegramente. El cliente instalado ya consume el RPC de estado; no requiere OTA para esta recuperación. Validación física posterior.
