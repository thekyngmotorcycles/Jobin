# SEC-06 · Pruebas HTTP en Jobeen Security Pilot

El [registro central](DEVELOPMENT_STATUS.md#backlog-finito-de-la-etapa-de-seguridad) conserva el estado y los criterios de cierre de SEC-06. Este documento describe el ejecutor y sus datos de ensayo. La prueba local del ejecutor usa respuestas sintéticas. [Piloto previo de Auth](PRIVATE_AUTH_PILOT.md)

## Comprobación local sin credenciales

Desde la raíz, con Node 22.13 o posterior y las dependencias del repositorio instaladas.

```sh
node --experimental-strip-types scripts/run-sec06-hosted.ts --plan
node --experimental-strip-types --test tests/sec06-hosted-harness.test.ts
npm run typecheck
```

El plan evita cualquier conexión. El test verifica el rechazo de orígenes ajenos, la separación entre identidades, los controles positivos y negativos, el tratamiento de fallos del servicio y la redacción de resultados. CI incorpora este test mediante el comando existente `npm test`.

## Configuración para una ejecución posterior autorizada

Usar exclusivamente cuentas y registros sintéticos preexistentes en `mkvzkvkmrribcaecvphq`. La creación de cuentas, la carga de datos de ensayo y cualquier aplicación de SQL necesitan sus propias autorizaciones. El ejecutor usa la clave publicable moderna y sesiones de usuario. Las suites HTTP de datos hacen lecturas y solicitan firmas de objetos sintéticos. Auth abre, renueva y cierra únicamente las sesiones de ese ensayo mediante `scope=local`.

Guardar el archivo de variables y el manifiesto fuera del repositorio con permisos `0600`. Mantener los valores reales fuera de la terminal compartida, GitHub Actions, el historial de shell y los informes. No usar claves administrativas ni credenciales de otro proyecto.

```dotenv
SEC06_ALLOW_HOSTED_RUN=mkvzkvkmrribcaecvphq
SEC06_SUPABASE_URL=https://mkvzkvkmrribcaecvphq.supabase.co
SEC06_SUPABASE_PUBLISHABLE_KEY=<clave publicable del piloto>
SEC06_FIXTURES_FILE=/ruta/privada/fixtures.json
SEC06_A_EMAIL=<correo sintético A>
SEC06_A_PASSWORD=<contraseña de A>
SEC06_B_EMAIL=<correo sintético B>
SEC06_B_PASSWORD=<contraseña de B>
SEC06_C_EMAIL=<correo sintético C>
SEC06_C_PASSWORD=<contraseña de C>
```

El origen de Supabase debe coincidir exactamente, con una barra final opcional. El ejecutor rechaza redirecciones y los resultados contienen etiquetas fijas, sin contraseñas, tokens, UUID, enlaces ni respuestas. Códigos de salida `0` suite aprobada, `1` fallo y `2` configuración o dependencia pendiente. Un error de red, un `429` o un `5xx` no cuenta como denegación autorizada.

### Manifiesto y datos sintéticos

`identities` basta para `auth`, `business` y `video`. `expiration` también requiere `files.draft`. `core` requiere el manifiesto completo del ejemplo. Reemplazar cada marcador por el valor de su fixture. Calcular los SHA-256 desde las copias sintéticas originales.

```json
{
  "identities": {"A": "<UUID A>", "B": "<UUID B>", "C": "<UUID C>"},
  "rows": {
    "messageAB": "<UUID del mensaje directo>",
    "shopThreadAB": "<UUID de la conversación JShop>",
    "shopMessageAB": "<UUID del mensaje de esa conversación>",
    "sharedPostAB": "<UUID del post privado compartido>",
    "activeStory": "<UUID de la historia vigente>",
    "expiredStory": "<UUID de la historia caducada>",
    "publishedListing": "<UUID del anuncio publicado>",
    "pausedListing": "<UUID del anuncio pausado>"
  },
  "files": {
    "draft": {"name": "sec06-draft.jpg", "sha256": "<SHA-256>"},
    "evidence": {"name": "sec06-evidence.pdf", "sha256": "<SHA-256>"},
    "sharedPost": {"name": "sec06-shared.jpg", "sha256": "<SHA-256>"}
  }
}
```

- A, B y C son usuarios distintos, activos, sin roles de moderación ni bloqueos entre ellos. Para `core`, cada uno tiene preferencias de perfil, contacto personal y ubicación privada de venta. Los tres perfiles son visibles. A es emisor de ambos mensajes, con B como destinatario. El mensaje JShop pertenece a la conversación de la que A es vendedor y B es comprador.
- A es autor de ambas historias y de la publicación. La publicación comparte una sola foto privada con seguidores, sin activar la audiencia de contactos. B sigue a A y C queda fuera de esa audiencia. A es vendedor de ambos anuncios. B guarda como favorito el anuncio publicado.
- Los objetos de A están bajo `<UUID de A>/<nombre>` en `jobeen-post-draft-photos`, `employer-report-evidence` y `jobeen-private-post-photos`, respectivamente. Deben pesar hasta 2 MiB para este ensayo. El borrador y la evidencia permanecen privados. La foto compartida está referenciada por el post de A. Usar sólo archivos sintéticos.
- Para `business`, A tiene una ficha empresarial visible con cuatro campos de contacto sintéticos presentes, propios y sin consentimiento público. El esquema debe exponer la tabla y la proyección revisadas. Un esquema sin ese contrato queda pendiente de preparación autorizada.

### Órdenes y criterios de aceptación

Tras autorizar y preparar los datos, ejecutar desde la raíz del repositorio.

```sh
node --env-file="$HOME/.sec06/pilot.env" --experimental-strip-types scripts/run-sec06-hosted.ts --run auth
node --env-file="$HOME/.sec06/pilot.env" --experimental-strip-types scripts/run-sec06-hosted.ts --run core
node --env-file="$HOME/.sec06/pilot.env" --experimental-strip-types scripts/run-sec06-hosted.ts --run business
SEC06_MAX_EXPIRY_WAIT_SECONDS=3800 node --env-file="$HOME/.sec06/pilot.env" --experimental-strip-types scripts/run-sec06-hosted.ts --run expiration
```

| Suite | Aceptación |
| --- | --- |
| `auth` | Auth confirma los tres UUID del manifiesto. A→B→A devuelve el ámbito correcto en REST y el segundo ingreso de A tiene otra sesión. Renovar conserva el ID de sesión. Después de cerrar esa sesión, su refresh es rechazado y las otras sesiones siguen funcionando. El uso residual del JWT en REST tras el cierre queda como observación para el perímetro de revocación inmediata. |
| `core` | Cada propietario puede leer sus filas privadas y el resto recibe cero filas incluso con identificadores exactos. B conserva el acceso a sus conversaciones y a la publicación compartida, mientras C queda excluido. Las historias y el catálogo conservan las lecturas previstas. Storage entrega los mismos bytes sintéticos a los titulares y al destinatario autorizado, y deniega lectura, firma y ruta pública cuando corresponden. |
| `business` | A lee los datos completos de su ficha. B y C reciben cero filas vía tabla directa y conservan acceso a una ficha proyectada con los cuatro campos privados enmascarados. |
| `expiration` | Un JWT genuino permite las lecturas antes de expirar. Después de `exp` y la tolerancia del verificador, Auth, REST y Storage rechazan ese JWT. El refresh legítimo permite nuevamente las lecturas y conserva la sesión. Ajustar el límite de espera al TTL registrado del piloto sin cambiar la configuración de Auth para acomodar esta prueba. |

### Video con gateway y perímetro autorizados

`video` requiere además `SEC06_VIDEO_GATEWAY_ORIGIN` con el origen HTTPS aprobado del piloto, `SEC06_VIDEO_FIXTURE_FILE` con un MP4 sintético de más de 6 MiB y hasta 12 MiB, y `SEC06_VIDEO_FIXTURE_DURATION_MS` con su duración real entre 1000 y 60000 ms.

```sh
node --env-file="$HOME/.sec06/pilot.env" --experimental-strip-types scripts/run-sec06-hosted.ts --run video
```

La suite crea tickets y coloca un único original sintético en cuarentena de moderación. Usa el controlador y el adaptador TUS existentes. Pierde deliberadamente la respuesta del primer bloque confirmado y espera reanudar desde el offset del servidor. Otra sesión de A, B y C no pueden consultar ni finalizar el ticket. Se verifica la cancelación, el rechazo del ticket tras cerrar su sesión y la denegación de lectura y firma del original desde Storage, incluso para A. Los datos sintéticos de cuarentena deben entrar en el procedimiento aprobado de retención del piloto.

`video-revocation` requiere además `SEC06_VIDEO_PLAYBACK_ORIGIN` y `SEC06_VIDEO_CDN_ORIGIN`, los orígenes HTTPS autorizados de reproducción y CDN. Definir `SEC06_VIDEO_ORIGIN_URL` y `SEC06_VIDEO_CDN_URL` con enlaces directos al mismo contenido sintético cuyo acceso se retirará. Definir `SEC06_VIDEO_ORIGIN_CONTROL_URL` y `SEC06_VIDEO_CDN_CONTROL_URL` con enlaces al mismo contenido para una cuenta que conservará acceso, y `SEC06_VIDEO_LINKS_VALID_UNTIL` con la menor fecha ISO 8601 de vigencia confirmada de los cuatro enlaces.

```sh
node --env-file="$HOME/.sec06/pilot.env" --experimental-strip-types scripts/run-sec06-hosted.ts --run video-revocation
```

En un terminal interactivo, el ejecutor primero comprueba y calienta las cuatro rutas. En la pausa limitada a tres minutos, retirar el acceso mediante el control autorizado y escribir `REVOCADO`. El mismo enlace debe quedar denegado en origen y CDN antes de caducar y con ambos controles positivos. El ejecutor no realiza la revocación ni envía credenciales de Supabase a esas rutas. Repetir el ensayo por cada contrato real de reproducción o segmento aplicable. Si no hay una autorización revocable por solicitud o un perímetro que retire enlaces copiados, registrar ese bloqueo aunque el TTL sea corto.

## Evidencia pendiente fuera del ejecutor

Las ejecuciones alojadas siguen pendientes de autorización y preparación de cuentas, datos y esquema piloto. Google OAuth con PKCE y recuperación requieren configuración y ensayos con el proveedor y buzones del piloto. La reautenticación por operación, la revocación global e inmediata, las mutaciones RLS, Realtime, la cobertura completa del perímetro CDN y la prueba física quedan según los criterios del registro central. Las pruebas HTTP de este ejecutor no prueban el estado local del cliente Android ni reemplazan SEC-07.
