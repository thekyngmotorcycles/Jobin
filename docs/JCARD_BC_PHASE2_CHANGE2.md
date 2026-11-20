# Jobeen JCard B+C — Fase 2, cambio 2: contactos adaptables

**Estado:** implementación experimental pendiente de aprobación visual en Android. **No fusionar ni publicar OTA.**

## Cambios autorizados realizados
- Misma altura exterior que antes: 330 dp con tema claro, +8 dp si ancho compacto; 400 dp con tema oscuro, sin cambiar la lógica de escalado de fuentes.
- Cabecera empresarial sin rediseño de identidad (foto, nombre, categoría, valoraciones, QR y verificación).
- Servicios en una línea y sin auto-reducir su fuente; tocar el texto abre la descripción completa.
- «Desde AAAA» pequeño junto a servicios, siempre que exista año de apertura válido.
- Eliminar ambas líneas horizontales añadidas a la cara empresarial (bajo servicios y sobre sellos). No cambiar la línea de idiomas de la JCard personal.
- Una columna de 48 dp para los iconos de correo, teléfono y ubicación, con la misma posición de inicio del texto.
- Filas de contactos de 48 dp; sin filas vacías cuando falten datos.
- WhatsApp justo después de los números visibles, sin columnas flexibles intermedias.
- Dos números aparecen a la vez si hay ancho suficiente; en caso contrario, principal y control independiente «+1» que abre detalle con todos los números. En anchuras críticas, la fila muestra «Tel.» o «Teléfono» y acceso a números completos, **no recorta dígitos**.
- Si se borra el número principal, el secundario pasa a ser el primero automáticamente; si se borran ambos, desaparece también WhatsApp.
- Correos adicionales accesibles mediante el detalle de correos, manteniendo tres filas principales como máximo.
- Cuatro sellos empresariales: Atención al cliente, Precios competitivos, Puntualidad y Profesionalismo. Eliminado solamente el sello visual «En el mercado» (sin modificar registros ni los valores históricos del backend).
- Unificar en esta fase el tamaño compacto de los sellos para evitar que sobresalgan del pie con tema oscuro.

## Comportamiento medido/estimado
La visibilidad simultánea de dos teléfonos se decide con el ancho renderizado de la JCard y una **estimación conservadora** de ancho de los caracteres, ajustada por escala de fuente. Esta es una protección ante recortes, no medición tipográfica real. Debe confirmarse en dispositivo con casos locales e internacionales.

El texto de los servicios usa una fila visual de 24 dp con acceso al contenido completo; las áreas de contacto principales son de 48 dp. Aún queda pendiente la auditoría específica de la región táctil de servicios y la prueba de todos los enlaces con lectores de pantalla.

## Validaciones necesarias
- 0, 1, 2 teléfonos; borrar principal o secundario; labels largos/cortos.
- Nombre comercial de una y dos líneas; servicios extensos y ausentes.
- Año de apertura presente o ausente.
- Correo único, correo secundario y sin correo.
- Ubicación extensa y ausente.
- Perfil propio y visitante; dos identidades empresariales distintas.
- Tema claro/oscuro; Jelly Star y móvil de anchura habitual; fuentes ampliadas.
- Revisar el giro de la tarjeta, accesibilidad de tap, QR, tipografía y alturas de los sellos.
- GitHub Actions verde antes de revisión; luego **autorización expresa** para integrar o publicar.

La aprobación del código no equivale a pruebas visuales en Android.
