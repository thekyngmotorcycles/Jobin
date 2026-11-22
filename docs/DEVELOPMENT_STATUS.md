# Jobeen — registro central de desarrollo

Actualizado 2026-11-22. Fuente de verdad operativa conforme a AGENTS.md. **No empezar otra auditoría general.** Los documentos anteriores se conservan como evidencia; sus pasos históricos no constituyen tareas nuevas.

## Estado de entrega verificado

- Rama activa: `fix/message-jshop-authorization-20261121`, PR #70 borrador, apilado sobre PR #69 (`fix/account-isolation-history-20261121`).
- Corrección de cierre de sesión en `fc43f648227a1e2dc10c0759fce4c55b06a0f12e`, CI [45045977833](https://github.com/thekyngmotorcycles/Jobin/actions/runs/45045977833) **aprobado**. El fallo visual test 361 quedó resuelto sin rebajar la prueba: ahora exige captura y limpieza del scope.
- Preparación APK aislada en `0b3d3c0edbdb891e21ec00cee46be77fb050db5a`; validación de Expo actualizada con comprobación de configuración resuelta, CI por verificar. Sin backend aislado contratado o configurado, no es una compilación autorizada.
- Último CI completamente aprobado antes de ese cambio: `b4ce649c2645afa0d0e1288fb12bb2f55f7ad254`, [44995138556](https://github.com/thekyngmotorcycles/Jobin/actions/runs/44995138556).
- Rama estable y development no se modifican por esta tarea documental; no nuevo OTA, despliegue SQL alojado ni APK. No asumir que los cambios candidatos son visibles en el teléfono.
- [Roadmap de producto aprobado](https://github.com/thekyngmotorcycles/Jobin/blob/docs/approved-product-roadmap-20261121/docs/APPROVED_PRODUCT_ROADMAP.md) conservado por separado. No mezclarlo ni descartarlo.

## Entregables cerrados dentro de su alcance de código y CI

Ninguna fila COMPLETADO implica instalación, acceso real a backend o publicación. Cada alcance se conserva; las dependencias de salida tienen sus propios ID.

| ID | Prioridad | Estado | Alcance y archivos | Evidencia/aceptación alcanzada | Dependencia siguiente |
| --- | --- | --- | --- | --- | --- |
| SEC-C01 | P1 | COMPLETADO | Auditoría y controles candidatos de JCard, CV, contactos, búsqueda, mensajes, JShop, feed, historias, RLS/Storage; `supabase/security-review/`, `src/lib/`, suites SQL | CI combinado 44988472549, 44988730023 y 44989117175; fixtures A/B/C y regresión | SEC-06, SEC-07; no repetir inventario |
| SEC-C02 | P1 | COMPLETADO | Contratos de permisos, leases, revisión y reproducción de medios; `safety-api.ts`, reproductor, políticas de work media | CI 44984512628, 44985054060; autorización de acceso y casos simulados | SEC-03, SEC-06 |
| SEC-C03 | P1 | COMPLETADO | Integración de credenciales SecureStore, bóveda de metadatos de borradores/favoritos y Flashes; `auth-storage.native.ts`, `private-metadata-vault.ts` y consumidores | CI 44990063111, 44990444602, 44991728939 y posteriores; namespace, staging, tombstones, no fallback nativo | SEC-02, SEC-07; no confundir referencias con bytes cifrados |
| SEC-C04 | P1 | COMPLETADO | Contratos de cifrado de archivos y puente Kotlin Android, controlador de bloques de video, inventario legado y restauración condicional | CI 44991151316, 44991481986, 44992173168, 44992514367; contratos, no integración completa | SEC-02, SEC-03, SEC-04 |
| SEC-C05 | P1 | COMPLETADO | Autorización y reconstrucción candidata de texto desde servidor; `legacy-recovery-authorization.sql`, `recover-private-text-posts*` | CI 44992773178, 44993441000; valida datos exactos, sesión, permiso, conflicto | SEC-04; sin fuentes de titularidad reales ni emisión |
| SEC-C06 | P1 | COMPLETADO | Bloqueo de compilaciones automáticas revisadas y autolinking sin APK; workflows, `check-native-autolinking.mjs` | CI 44994507867; módulos resueltos, no prueba de Gradle ni binario | SEC-05 |
| SEC-C07 | P1 | COMPLETADO | Navegación protegida por fase y serialización de entrada; `AuthGate.tsx`, `auth-entry*`, login/alta/recover | CI 44994857374 y 44995138556; cobertura de rutas, callbacks sintéticos | SEC-01, SEC-06, SEC-07; Google real pendiente |

## Backlog FINITO de la etapa de seguridad

Prioridades de riesgo P0/P1/P2/P3. El orden indicado respeta dependencias; no añadir tareas por rutina. Una dependencia externa se mantiene BLOQUEADO hasta disponer de autorización/entorno, sin bloquear trabajo independiente. Si un flujo no puede habilitarse de forma segura, proponer mantenerlo desactivado, no declarar seguridad alcanzada sin evidencia.

| ID | Prioridad | Estado | Objetivo, alcance y archivos | Evidencia actual / dependencia | Criterio de aceptación y acción concreta |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | P1 | COMPLETADO | Cierre de sesión, `AuthGate.tsx`, `session-exit-fence.ts`, `account-scope.ts`, `settings/cuenta.tsx` | fc43f64, CI 45045977833 verde | Scope capturado, cierre serializado y prueba visual actualizada aprobada; faltan pruebas reales agrupadas en SEC-07. No reabrir auditoría Auth. |
| SEC-02 | P1 | PENDIENTE DE INTEGRACIÓN | Integrar protección de bytes de fotos/evidencia y temporales; `private-file-vault.ts`, `android-private-file-storage.ts`, módulo Kotlin, selectores/drafts | SEC-C03/C04; piloto 2 MiB y metadata integrada | Usar puente existente o mantener flujo no seguro bloqueado; eliminar reutilización automática de URI sin propietario, controlar temporales propios sin borrar originales; pruebas de integración. No crear segundo cifrado. |
| SEC-03 | P1 | PENDIENTE DE INTEGRACIÓN | Transferencia acotada de video y revocación remota; `private-video-transfer.ts`, `safety-api.ts`, proveedor/CDN | SEC-C02/C04; controlador sin transporte, lectura completa actual | Conectar transporte respaldado por SDK/proveedor y fuente limitada, verificar ownership/offset/confirmación, cancelar; validar origen/segmentos/CDN con permisos y caché. Si proveedor no disponible, bloquear flujo candidato. No repetir diseño del controlador. |
| SEC-04 | P1 | BLOQUEADO | Recuperación controlada y conciliación de legado; `LEGACY_PRIVATE_RECOVERY.md`, autorización SQL y recuperación nativa | SEC-C05; falta prueba independiente de procedencia y emisión real | Identificar fuente de verdad y autorización con reauth/consentimiento; verificar conflicto/tombstone, readback y preservación. Sin prueba, conservar en cuarentena sin mostrar/importar. Ninguna eliminación automática. Decisión del propietario si no existe respaldo demostrable. |
| SEC-05 | P1 | EN DESARROLLO | Preparar variante aislada de prueba y manifiesto de APK; `app.json`, `eas.json`, workflows, backend-config | SEC-C06; módulos detectados, entorno dedicado pendiente | Variante security-pilot con package/scheme propios, Updates deshabilitado y validación estricta de backend aislado preparada en código, sin credenciales ni build; validar CI y configurar proyecto/credenciales Supabase exclusivo, callback OAuth permitido, fingerprint, SHA y aprobación antes de compilar. |
| SEC-06 | P1 | BLOQUEADO | Validar backend real aislado y perímetro Auth/Storage/Realtime/CDN/Web; PR69, SQL candidato, `PRIVATE_AUTH_PILOT.md` | Requiere entorno aislado autorizado; SEC-03 y SEC-05 | Pruebas directas A/B/C, permisos revocados/desactivación, reauth por acción, OAuth/recuperación y no evasión del origen; web sin alegar cifrado nativo y notificaciones sin fuga de cuenta (registro/desvinculación, deep links; mantener inactivas si no integradas). Verificar retención y rollback. No aplicar a hosted sin autorización. |
| SEC-07 | P1 | BLOQUEADO | Prueba física Android consolidada, `ANDROID_SECURITY_JELLY2.md` | SEC-01 a SEC-06 según alcance aprobado; requiere autorización APK y dispositivo | Aprobación expresa SHA/binario; probar KeyStore, credenciales, backup/restauración, A→B→A, offline/expiración, callbacks, borradores/archivos y rendimiento. Evidencia de APK/runtime/update/backend. No declarar completado por autolinking. |
| SEC-08 | P1 | BLOQUEADO | Cierre de etapa y promoción controlada | SEC-01 a SEC-07; decisiones de alcance y release explícitas | Resolver bloqueos obligatorios de privacidad, revisión de regresión, plan seguro de corte y reversión, aceptación del propietario. Integrar ramas y publicar solo con autorización. Retomar roadmap visual/funcional. |

**Siguiente acción inequívoca:** verificar CI de SEC-05 (piloto aislado con Expo config real), preparar credenciales/backend independiente sin aplicar cambios alojados ni compilar. SEC-02 y SEC-03 conservan sus tareas de integración separadas, sin repetir auditorías. No volver a auditar SEC-C01 a SEC-C07 salvo las causas de reapertura definidas en AGENTS.md.

## Referencias (evidencia histórica, no listas operativas independientes)

- `docs/ACCOUNT_ISOLATION.md`, `docs/SECURITY_DEPLOYMENT.md`
- `docs/SECURITY_RELEASE_CHECKPOINT_20261122.md`
- `docs/PRIVATE_STORAGE_RELEASE_GATES.md`, `docs/PRIVATE_FILE_ANDROID_PILOT.md`, `docs/PRIVATE_AUTH_PILOT.md`, `docs/LEGACY_PRIVATE_RECOVERY.md`
- `docs/ANDROID_SECURITY_JELLY2.md`, `docs/native-capabilities-baseline.md`
- `DESIGN_RULES.md` y roadmap de producto aprobado.

Actualizar solo filas que cambian y el siguiente ID. No duplicar este backlog en otros documentos. Informar nueva evidencia en un cambio coherente y comprobar CI real al reanudar.
