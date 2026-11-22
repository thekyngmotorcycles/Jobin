# Jobeen — control previo a publicación de seguridad

Base comprobada: 0bb8e3a, CI 44993441000 aprobada. Candidato PR #70 apilado sobre PR #69. No se autoriza fusionar, publicar OTA, aplicar SQL alojado, crear APK ni borrar datos. El roadmap de producto se conserva por separado.

| Bloque | Evidencia actual | Bloqueo pendiente |
| --- | --- | --- |
| Aislamiento cliente/SQL | CI de código y PostgreSQL sintético, suites combinadas | Validar API real, políticas alojadas, JWT revocado, pruebas A/B/C y cuentas inactivas. |
| Credenciales | SecureStore 15.0.8 integrado en candidato; CI | APK autorizada, OAuth/recuperación, pérdida de clave, cierre y revocación, no importar tokens antiguos. |
| Borradores | Metadatos privados con doble banco, scope y tombstones | Prueba de rendimiento, persistencia y backup en Android. Los bytes de imágenes/videos y rutas históricas no están cifrados por este almacén. |
| Archivos | Módulo Kotlin Android Keystore y contrato AEAD de 2 MiB | Autolinking, compilación, prueba física; conectar editor y decoder sin temporales en claro. |
| Video | Controlador de bloques de 6 MiB, reintento, sesión/cancelación simulados | Falta transporte TUS real y fuente inmutable; editor actual aún lee arrayBuffer completo. |
| Recuperación | Inventario mínimo, permiso servidor y reconstrucción de texto candidato | Falta prueba de procedencia/servicio emisor, reautenticación real, reconciliación y UI; no restaurar medios o datos ambiguos. |
| Auth y servicios | Piloto PR69 de emisores aislados, retos específicos | Google/callbacks, migración de identidad, origen no evadible y revocación real. |
| Archivos remotos | RLS y contratos de leases, caché reducida | CDN privado y revocación por solicitud; comprobar segmentos y enlaces históricos. |
| Web | Continúa mecanismo web separado | No hereda cifrado nativo. Requiere sesión/almacén propios y pruebas de navegador. |
| Notificaciones | Dependencia presente, no autorización de entrega | Registro por instalación/UUID, desvinculación, privacidad y deep links. |
| Canal y APK | Bloqueo de compilación por push y requisito SHA en los tres workflows revisados (candidato) | Preparar aplicación de prueba separada, backend aislado sin fallback al proyecto real, canal exclusivo o Updates deshabilitado, callback OAuth propio, permiso del propietario. No usar los perfiles preview/development actuales para el piloto aislado. |

## Próximos pasos
1. Validar CI y autolinking Android sin ejecutar Gradle ni EAS. Auditar los demás workflows de publicación y sus eventos; estas barreras aún no existen en development.
2. Corregir los bloqueos de navegación AuthGate y callback PKCE, verificar incompatibilidad de runtimes y establecer variante de prueba sin acceso al backend ni almacenamiento de la instalación real. No asumir que un APK contiene módulos por el mero lockfile.
3. Conectar las rutas multimedia o mantenerlas deshabilitadas en el piloto hasta validar seguridad. No declarar cifrado completo ni recuperación de todos los datos.
4. Confirmar alcance y módulos de la única APK de seguridad: SecureStore, puente Android, dependencias existentes necesarias. RTC, pagos, biometría y otros SDK aún no seleccionados no se agregan por anticipado sin necesidad validada.
5. Presentar al propietario SHA, entorno, alcance y pruebas; pedir autorización expresa ANTES de iniciar compilación. Superar matriz Jelly 2 y API real aislada antes de promover. No mezclar el roadmap visual con el corte de seguridad sin revisión.

Los controles de SHA evitan disparadores accidentales y binds incorrectos; no sustituyen permisos de GitHub ni un entorno protegido con revisores. Ningún build o OTA se ha iniciado por este cambio.

## Control de navegación
- 7b0a7d0 aprobó CI 44994507867, incluido autolinking Android sin compilación.
- AuthGate comprueba getUser antes de habilitar el navegador privado, y conserva remount por sesión. Stack.Protected separa comprobación, login/alta/recuperación, onboarding y rutas autenticadas; también se protegen todas las rutas antes registradas automáticamente. No depender de una redirección tardía para impedir montar una pantalla privada. Pruebas de cobertura del árbol de rutas y fase.
- Pendiente prueba real de transición, Google PKCE, recuperación SMS, alta y cierre offline en Android; comprobar que acciones anteriores no naveguen o escriban en cuenta nueva. La política de navegación no sustituye RLS. CI pendiente.
