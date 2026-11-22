# Consolidación de archivos privados para la APK piloto

La rama `integration/security-pilot-native-20261122` parte de SEC-05 `87f6c042244990aae1a83ed7fcef6efd4b7cff92`. Incorpora SEC-02 `aa037097336c1cc2320726c761eacf940b97c7c6` y SEC-03 `9693d2ccfef5be7c8e45f456282eb3963645803f` mediante cherry-picks con referencia a los commits de origen. Los archivos reservados coinciden con la base SEC-05.

## Resolución

- Git aplicó los cambios sin conflictos de texto. La revisión de `safety-api.ts` conservó el envío de evidencias mediante el vault y retiró el ayudante de carga de video completo, que ya carecía de consumidores. El editor profesional usa el controlador TUS y el servidor conserva la RPC de moderación como paso interno controlado.
- El editor de publicaciones sigue usando referencias cifradas para las fotos privadas y valida propietario y sesión. La restauración de respaldos existentes permanece separada. Las fotos y evidencias conservan el límite de 2 MiB. El video conserva 500 MiB, segmentos de 6 MiB, reintento desde el desplazamiento confirmado, cancelación y verificación de sesión. Flashes conserva su contrato de borrador local.
- La integración abre un PR en borrador contra SEC-05 para ejecutar la verificación existente. La configuración Git de Vercel desactiva despliegues automáticos exclusivamente para esta rama de integración. [Configuración de ramas de Vercel](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled)

## Capacidades y aceptación física

Android incluye en la resolución de autolinking el módulo local `JobeenPrivateFiles`, SecureStore, los selectores de imagen/documentos, Expo FileSystem, Expo Video, Camera y Notifications. La carga usa el transporte Expo disponible. La revisión y la exportación JS verifican la resolución del código y de sus dependencias. La compilación Kotlin, las llaves del dispositivo y la memoria real de los medios se validan en Jelly 2.

1. **Fotos y evidencias.** Ensayar lectura del selector, MIME, exactamente 2 MiB y un byte por encima, limpieza exclusiva de copias propias, EXIF y orientación, KeyStore, corrupción de ciphertext, caché de vista previa, reinicio y A→B→A. Confirmar originales intactos y recuperación autorizada de borradores. [SEC-02](SEC02_FILE_PROGRESS.md)
2. **Video.** Ensayar archivo de varios segmentos, lectura acotada y memoria, Wi‑Fi interrumpido, reanudación en la sesión original, distinta sesión y cuenta, cancelación y segundo plano, expiración, confirmación única y rechazo al superar 500 MiB. Verificar denegaciones directas y revocación en origen y CDN desde el entorno aislado. [SEC-03](SEC03_VIDEO_PROGRESS.md)

El código consolidado prepara una única APK piloto. Antes de solicitar su ejecución, SEC-05 debe cerrar la verificación del entorno EAS y variables exclusivas, los callbacks OAuth de prueba y las cuentas ficticias. La prueba SEC-03 real necesita además el gateway HTTPS y su SQL candidato en el backend aislado, con la URL explícita del gateway. Eso requiere autorización separada y revisión del perímetro. Esta rama no aplica SQL alojado ni ejecuta compilaciones o actualizaciones OTA.
