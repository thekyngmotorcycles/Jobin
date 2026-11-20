# JCards públicas — Etapa 2: Guardar, Favoritas y colección

## Alcance aprobado
Toda JCard que su propietario haya publicado puede ser guardada sin pedirle autorización. Las dos caras (personal y negocio) se guardan de forma independiente. El usuario debe tener sesión para que sus guardados se sincronicen entre dispositivos.

**Distinción:** la tarjeta publicada es pública; la lista de tarjetas que guarda cada usuario es personal. Ningún otro usuario puede leer o modificar esa lista mediante la API.

## Funciones de esta etapa
- Opción «Guardar JCard empresarial/personal» y «Quitar de mis JCards» en el menú de tres puntos del perfil visitante; detecta la cara activa sin cambiar el gesto de giro.
- Sección «Mis JCards» en el perfil propio: búsqueda, favoritos, eliminar y abrir la cara correcta del perfil.
- Referencias enlazadas al dueño en Supabase. No guardar copias de teléfonos, correos ni imágenes; siempre consultar la información pública actual.
- Prohibir nuevos guardados de una cara oculta, un negocio sin nombre y perfiles desactivados mediante RLS.
- Si una tarjeta antes guardada se oculta, mostrar «JCard no disponible» sin datos históricos y permitir eliminarla. Se recupera automáticamente cuando el propietario vuelve a publicar esa cara.
- Se respetan business_show_phone y business_show_email mediante la visualización actual de la JCard, sin copiarlos a la galería.

## Seguridad
Tabla public.jobeen_saved_jcards con RLS para el usuario que guarda la tarjeta. Roles anónimos sin acceso a la lista; usuarios autenticados pueden guardar JCards ajenas visibles sin consentimiento. La actualización de columnas se limita a favorite. FKs con ON DELETE CASCADE.

## Fuera de alcance (requiere nueva autorización)
- Avisos automáticos cuando una JCard modifica sus contactos.
- Notificaciones push en segundo plano.
- Exportación a imágenes o guardado en la galería del teléfono.
- Rediseño pendiente de los botones QR/enviar JCard del encabezado.
- Hacer pública la lista personal de tarjetas guardadas (solo las JCards originales son públicas).

## Integración / lanzamiento
No se ha publicado OTA. Mantener PR experimental separado y validar CI, RLS y la vista real en Jelly Star. La migración de Supabase debe pasar tests de base de datos antes de aplicarse a la instancia real. No fusionar a development/main sin autorización.
