# Recuperación controlada de datos privados históricos

Estado: candidato, no activado. c3849c7 aprobó CI 44991728939. Flashes y editor de videos profesionales usan protección de metadatos en el candidato nativo. El identificador histórico reel-draft es interno, no una función Reels del producto.

## Regla de conservación
Un sufijo UUID, una ruta local, un nombre, la cuenta abierta al encontrar un dato o la posesión física del teléfono NO prueban titularidad del contenido. El incidente de aislamiento impide considerar confiables esos datos sin evidencia independiente. No enumerar todas las cuentas del dispositivo ni mostrar contenido ambiguo al titular de la sesión actual. No exportar valores a logs, soporte, analítica o archivos en claro. No borrar ni copiar el legado automáticamente.

## Inventario candidato
`legacy-private-inventory.ts` consulta únicamente cinco claves exactas de datos locales para el UUID y la sesión verificadas: borradores de posts, JShop, favoritos locales, Flashes y videos profesionales. Devuelve solo categoría y absent/requires-review; no interpreta valores ni afirma propiedad. El adaptador Android/iOS se prepara en `legacy-private-inventory-device.native.ts`; aún no tiene consumidor UI. No inspecciona tokens, PKCE, otras cuentas, claves globales ni imágenes. Fallo de sesión cancela el resultado completo. El almacén cifrado activo sigue independiente.

## Secuencia de recuperación propuesta
1. Reautenticar por el flujo autorizado del servidor; no usar token histórico para recuperar una cuenta o datos. Verificar identidad y sesión actuales. Consentimiento separado para revisión y restauración concreta.
2. Inventario mínimo local. No mostrar texto/imagen/URI de origen desconocido. Consultar fuentes de verdad del servidor autorizadas (borradores con respaldo propietario confirmado, registros creados por ese UUID, historial de auditoría). Si hay evidencia de contaminación o no hay prueba independiente de propiedad, conservar en cuarentena; ni siquiera un UUID coincidente permite mostrar.
3. Reconstruir únicamente registros demostrablemente pertenecientes a la cuenta, con esquema actual y sin enlaces firmados ni rutas de dispositivo no verificadas. Los datos existentes en servidor se recuperan desde su API autorizada, no desde una copia local incierta. Nunca restaurar credenciales, estados de autorización, favoritos por inferencia ni permisos antiguos.
4. Antes de confirmar, comprobar titularidad y sesión de nuevo, detectar borradores nuevos/conflictos/descartes, presentar únicamente registros autorizados y obtener confirmación explícita. No reemplazar una versión más reciente ni revivir un descarte; un proceso interrumpido debe ser idempotente. El destino cifrado debe confirmar su escritura y lectura de verificación antes de considerar un registro recuperado.
5. Conservar originales y legado hasta aprobación específica de retención/eliminación, verificación de referencias y recuperación comprobada. No eliminar galerías, evidencia o datos compartidos. Cualquier copia no demostrable queda inaccesible para usuarios y pendiente de revisión restringida. No afirmar borrado físico de flash ni revocación de copias externas.

## Bloqueos de release
- Falta autoridad verificable de recuperación y mecanismo de conflicto/commit. No hay migrador de datos activos ni prueba de titularidad de registros históricos en este commit.
- Casos A/B/C sintéticos: clave A con registro B, clave global, fuente sin prueba, respaldo revocado, registro de servidor A autorizado, dos sesiones de A, cambio de cuenta durante inspección, borrador nuevo durante restauración, tombstone, falta de espacio, interrupción y reinicio. Probar en backend aislado y APK autorizada; ningún dato real se usa en CI.
- El corte de Auth requiere nuevo login, revocación de sesiones antiguas y limpieza específica aprobada de credenciales legadas. El inventario no toca Auth.
- El propietario debe poder detener el corte si faltan datos legítimos. La reversión nunca reabre permisos inseguros ni reimporta credenciales. Mantener development, OTA, APK y backend alojado sin cambios hasta autorización.


## Primera barrera de restauración, sin migrador activo
- e99dc75 pasó CI 44992173168. `private-metadata-vault.ts` incorpora una operación condicional `restoreIfNeverInitialized` en la MISMA cola que las escrituras normales. Rechaza cualquier colección previamente confirmada, incluso []/null (descarte), y staging sin manifiesto (posible interrupción). La comprobación del permiso de recuperación inyectado se ejecuta antes de staging y antes del commit; scope actual confirmado de nuevo. No se agrega a la API web ni se llama desde la UI.
- El callback no es una prueba de propiedad: debe ligarse a reautenticación reciente y autorización del servidor para los datos exactos, con aprobación del usuario y validación de esquema. Sin esa autoridad no se puede habilitar la restauración. La ausencia de manifiesto tras pérdida de claves/reinstalación tampoco demuestra que nunca hubo un borrador; reconciliar dispositivo/servidor y consentimientos antes de permitir iniciar. Si se interrumpe una recuperación durante staging, la restauración automática se bloquea hasta reconciliación expresa; no se promete reintento automático. Las escrituras normales de borradores siguen disponibles.
- Tests para guardado concurrente, colecciones vacías y tombstones, inicialización única, revocación durante staging y cambio de sesión. Fixture de permiso simulado; no se usa información del usuario. No se migra ni elimina legado. CI pendiente.
