# Jobeen — inventario de datos locales y requisitos de salida de seguridad

Estado: candidato de revisión. No autoriza desplegar SQL, OTA, fusionar development ni compilar Android. Los datos históricos de procedencia dudosa permanecen intactos. No se considera superado el aislamiento solo porque las pruebas de código estén en verde.

## Inventario de rutas verificadas

| Superficie / archivo | Estado observado en la rama | Riesgo restante y condición de cierre |
|---|---|---|
| Auth, refresh y PKCE — src/lib/supabase.ts | AsyncStorage sigue siendo almacén de Supabase; detector de sesión exacta y adaptador credential-vault.ts preparados, aún separados. | Integrar backend nativo probado sin fallback, confirmar claves de Supabase/PKCE, revocar sesión anterior mediante nuevo ingreso controlado; no migrar automáticamente. Web requiere solución independiente. |
| AuthGate y marcadores — session-lifetime.ts | UUID + session_id, subtree AppProvider/SocialProvider/NoticeProvider remontado al cambiar. Marcadores locales sin secreto de acceso. | Verificar cierre en sesión expirada, sin red, callback OAuth y A→B→A en Android; auditoría de revocación real. |
| JCard, CV, negocio y búsqueda | Cachés privadas trasladadas a memoria por sesión, datos de CV y ubicación de venta con persistencia privada candidata en servidor. Preferencias de apariencia locales por UUID, acceso titular. | No restituir cachés legadas. Verificar dato de origen en servidor y alcance público con consentimiento; retención y recuperación aprobadas. |
| Borradores post y JShop — post-drafts.ts, jshop-local.ts | Metadatos/URI locales en AsyncStorage por cuenta, escrituras serializadas y validación de cuenta/sesión. | Persistencia en claro no cumple cifrado. Cada URI necesita prueba de propiedad y uso; no borrar el archivo original de galería. Diseñar respaldo privado del usuario y cifrado de temporales, cuotas, recuperación y migración reversible. |
| Flashes y clips — FlashComposer.tsx, tabs/create.tsx | Metadatos locales y URI de picker por UUID, revisión de sesión. Reproductor con caché explícita deshabilitada. | Video de gran tamaño: cifrado de archivos o carga a cuarentena privada; no introducir el video como texto base64 en SecureStore. URI heredada no demuestra propiedad. |
| Avatar — personal-avatar-editor.tsx, personal-jcard-photo.ts | Crop genera JPG temporal y base64, carga con sesión validada. Señal de refresh por sesión, nuevas cargas cacheControl 0. | ImageManipulator genera copia; no borrar el original de MediaLibrary. La ruta pública y las copias antiguas de CDN requieren estrategia de reemplazo/revocación. Confirmar consentimiento de exposición. |
| Fotos negocio y reseñas — business-media.ts | Picker y DocumentPicker pueden crear temporales en caché. Subida valida ámbito; URLs públicas históricas. | Inventario de copias y referencias, validación de propietario, políticas CDN. No borrar evidencia o archivos compartidos. Separar vista pública y staging privado. |
| Fotos posts, historias y JShop — social-content.ts, jshop-api.ts | Manipulación JPEG base64 + resultado temporal; privados firmados; públicos en buckets públicos. | El cache-control de respuesta no revoca enlaces emitidos ni elimina copia preexistente. Reconciliar referencias y permisos de imágenes privadas o retiradas del público; validar políticas del servidor y CDN. |
| Pruebas/documentos — EmployerReportButton.tsx y safety-api.ts | DocumentPicker copia a caché; estado del formulario aislado, evidencia privada y acceso de moderación candidato. | Probar temporales y eliminación tras finalización segura. No eliminar prueba en revisión ni copia de origen. |
| Vista de imágenes — MediaThumbnail, social-ui, story/[id], post/create | Retirada de force-cache, solicitudes remotas de actualización/no-store, sin transformar URLs con query, fragmento o credenciales. | RN, navegador, Fresco/CDN pueden ignorar las sugerencias. Auditar caché física y rutas de acceso alternativas; no se afirma borrado/garantía de no almacenamiento. |
| Compartir — JCardShareSheet y share-contacts | Destinatarios/acciones diferidas pertenecen a la sesión, no se reanuda con otra identidad; estado limpiado. Enlaces/control de entrega se verifican. | Una entrega voluntaria a WhatsApp/SMS/otra app crea copia externa fuera de control. CV requiere consentimiento explícito y revisión de datos incluidos. No incluir credenciales ni URLs privadas en contenido compartido. |
| Videos y revisión — work-media/[id], worker | Caché de player explícita desactivada en reproductor protegido; refresco y invalidación local. Enlaces privados deferidos verificados; contrato de expiración. | SDK de video/CDN/estudio debe negar solicitud con grant vencido o revocado; comprobar bytes ya descargados, pistas, manifiestos y segmentos. |
| Apariencia general y asistente — ThemeProvider, DraggableAssistant | Tema y posición son valores visuales del dispositivo; no contienen perfil ni identidad. | Definir si deben sincronizarse por cuenta. No emplear claves globales para información privada. |
| Notificaciones — native-notifications.ts | Módulo presente en dependencias, no acredita token de envío asociado a cuenta. | No habilitar entrega hasta registrar titularidad por instalación/sesión, desvincular en servidor y filtrar deep links. No mostrar mensajes privados de otra cuenta en pantalla bloqueada. |

## Gestión de archivos temporales — protocolo previo a implementación

1. Separar origen del usuario (galería, documento externo) de archivo temporal creado por Jobeen, respaldo remoto y archivo persistente cifrado. No borrar el origen. Solo registrar copia creada por la operación y propietario verificable; no inferir por nombre/ruta.
2. Usar almacenamiento privado de app, directorios de trabajo no adivinables vinculados al UUID y a operación. El manifiesto conserva identificador y relación con borrador/carga, nunca credenciales ni URL firmada. Para persistencia sensible, cifrar de forma autenticada antes de persistir; clave de datos por cuenta protegida por Keystore/Keychain. Validar tamaño y límites de memoria en Jelly.
3. Eliminar temporales verificados sin referencias únicamente después de operación confirmada o cancelación, y tras comprobar que no existe trabajo activo. No borrar si una respuesta de servidor se perdió o si el archivo se reutiliza. Si cambia la sesión, invalidar la operación; cuarentena pendiente de reconciliación autorizada. Las rutas legadas quedan preservadas.
4. Aplicar política de retención por categoría, recuperación, revocación, tombstones y reintentos idempotentes. Probar falta de espacio, permiso denegado, proceso muerto y fallo a mitad del cifrado. Nunca limpiar todo AsyncStorage/directorio de caché como sustituto de migración. No prometer borrado físico seguro de almacenamiento flash.
5. Elegir una sola base nativa: SecureStore para secretos pequeños si cumple límites/SDK, y una solución evaluada para archivos grandes solamente si hace falta conservarlos offline. No añadir dependencias sin resolver requisitos de runtime/fingerprint, backup, reinstalación y pruebas. Solicitar autorización individual de la nueva APK consolidada. Controles web aparte.

## Matriz de aceptación final

Usar tres cuentas ficticias A/B/C, backend aislado, registro exacto APK/runtime/canal/update. Pruebas de código y SQL no sustituyen resultados físicos.

| Prueba | Resultado exigido | Estado |
|---|---|---|
| A→B→A en línea, offline, reinicio y cierre de proceso | No aparece dato privado de otra identidad, ni se pierde borrador válido. | Pendiente |
| Picker/editor/diálogo nativo abierto durante cambio de sesión | Respuesta antigua descartada; ningún envío/carga/guardado con B de contenido de A. | Pendiente físico |
| Enlaces/capacidades activas tras bloqueo, cierre, expiración o retirada de consentimiento | REST, Storage, CDN, proxy, manifiesto y segmentos rechazan nuevos accesos según la política. | SQL y contratos parciales; proveedor/hosting pendiente |
| Cifrado real y backup/restauración | En extracción autorizada de binario/almacenamiento de prueba no hay tokens ni payload privado en claro; claves inaccesibles al otro usuario; recuperación controlada. | Pendiente integración nativa y APK autorizada |
| Reconciliación de archivos y borradores antiguos | No se borran originales ni datos de titularidad ambigua; no hay reasignación automática. | Pendiente |
| OAuth/recovery y sesión revocada de PR #69 | Compatibilidad de emisor y flujo real probado, rollback conserva restricciones. | Pendiente entorno equivalente |
| Integración apilada PR #69 + #70 | Ejecutar todos los candidatos en orden, comprobar permisos efectivos, regresiones y rutas antiguas; pruebas sobre entorno aislado. | Pendiente verificación de conjunto |
| Funciones públicas/autorizadas | Contactos directos, JCards visibles, feeds, historias, JShop y CV compartido funcionan solo con permiso vigente. | CI parcial; validación física pendiente |
| Seguridad de contenidos y revisión | No hay transmisión sin proveedor y supervisión activa; revocación y revisión independiente comprobadas. | Pendiente proveedores reales |

Documentar evidencia redaccionada, sin datos de usuarios reales ni volcado de secretos. Bloquear publicación mientras cualquier condición de privacidad obligatoria permanezca sin verificar.
