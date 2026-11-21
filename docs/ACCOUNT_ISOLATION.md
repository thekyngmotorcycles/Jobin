# Aislamiento reforzado de cuentas — opción 2 aprobada
Estado: incidente abierto. La seguridad precede a los cambios visuales.
## Normas
Leer AGENTS.md, sección Seguridad y aislamiento. Una sola identidad activa por instalación; autorización por UUID y servidor; ninguna transferencia automática de datos heredados. Lo que se comparte deliberadamente (JCard pública, contenido público, participantes autorizados) conserva sus permisos. No presentar un control de UI como seguridad de servidor.
## Hallazgos y contención
- El historial profesional usaba una clave local global y podía subir entradas de otro usuario si la nube estaba vacía. Se retira esa importación y se vincula toda lectura/escritura del historial a la identidad activa. No eliminar el almacenamiento legado: su titularidad no está probada.
- La navegación y los proveedores de estado deben reiniciarse al cambiar de UUID. Las respuestas de una sesión anterior no pueden actualizar el workspace de la nueva.
- Las colecciones privadas locales (borradores, favoritos JShop y búsqueda) deben comprobar la identidad, no solo el sufijo de su clave.
- Inspección de solo lectura del proyecto Supabase: 4 grupos de historial idénticos (mismo client_id y contenido básico) en varias cuentas y 1 grupo de nombres empresariales duplicados. La coincidencia no demuestra por sí sola qué copia es legítima. No se cambiaron filas ni permisos en el proyecto compartido.
- Las tablas públicas inspeccionadas tienen RLS; hay políticas permisivas duplicadas de escritura en historial y una política de descubrimiento empresarial que permite leer filas completas no vacías. Se requiere revisar privilegios, privacidad de campos y todos los consumidores antes de restringirla; conservar vistas públicas autorizadas.
## Pendientes obligatorios antes de declarar seguridad completa
1. Revisar resultados de CI, probar A→B→A en Android con dos cuentas de prueba, respuestas retrasadas, offline y sesión expirada. Probar lecturas/escrituras directas y almacenamiento con credenciales de prueba; revisar RLS y RPC, incluidas las excepciones públicas.
2. Identificar copias contaminadas, propietario legítimo e impacto; respaldarlas y acordar reparación reversible. No ocultar indiscriminadamente historiales legítimos ni borrar registros por coincidencia.
3. Migrar tokens y persistencia local sensible a almacenamiento seguro/cifrado autenticado. La instalación actual no declara expo-secure-store; evaluar nueva compilación nativa compatible, migración y recuperación. No presentar AsyncStorage como cifrado.
4. Reautenticación para operaciones sensibles, pruebas de recuperación y cierre de sesión. Auditar resto de mensajes, archivos, cache de medios y preferencias. Aplicar privilegios mínimos y privacidad por defecto con pruebas de servidor.
5. No publicar ni dar por resuelto hasta confirmar la contención y las pruebas funcionales; main y producción requieren autorización.
## Referencias
OWASP MASVS: https://mas.owasp.org/MASVS/
Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

## Avance de contención y validación
- Commit 713a115: validate y database aprobados. Posteriormente se vincularon guardados de contacto, visibilidad y datos personales a la identidad original del editor.
- Se incorporó al workflow database la prueba SQL de JCards guardadas, ampliada para comprobar inserción impersonada, eliminación y modificación ajenas, reasignación de propietario y cambio A→B→A. Prueba en base descartable de CI; no constituye validación del proyecto remoto ni de Android.
- Confirmado por lectura del catálogo remoto: la política de descubrimiento empresarial admite SELECT de toda fila con nombre no vacío, sin comprobar visibilidad; las políticas de escritura de historial duplicadas pueden combinarse permisivamente. Pendiente inventario de consumidores y migración coordinada de lectura pública con proyección de campos permitidos; no modificar privilegios del proyecto compartido sin comprobar compatibilidad. 
- No se han borrado ni reasignado registros. Cifrado, reautenticación y pruebas funcionales de dos cuentas siguen pendientes.
