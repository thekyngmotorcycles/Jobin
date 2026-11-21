# Jobin — Reglas permanentes de trabajo (AGENTS.md)

Este archivo es la fuente de referencia para asistentes y desarrolladores que continúen el proyecto Jobin, incluso desde otro chat.

## Repositorio y arquitectura
- Repositorio GitHub: thekyngmotorcycles/Jobin.
- App web y móvil: Expo Router / React Native / TypeScript. Backend: Supabase. Preview Android: Expo EAS OTA.
- Idioma de la interfaz: español, excepto nombres propios Jobin y JCard.
- Diseño de marca: wordmark Jobin cursivo, tarjetas JCard con temas y detalles satinados.
- No incluir tokens, contraseñas, claves de Supabase ni credenciales en prompts, commits o archivos de traspaso.

## Norma visual de iconografía Jobeen (permanente; aprobada por el propietario)
- La personalidad visual de Jobeen es **abeja y panal**: integrar celdas hexagonales suavizadas cuando tengan sentido semántico, sin convertir todos los controles en hexágonos.
- Todos los iconos y botones nuevos o rediseñados deben compartir un lenguaje óptico consistente: trazos del mismo peso aparente, dimensiones perceptuales equilibradas, esquinas suavizadas y remates redondeados.
- Preferir contornos orgánicos, simetría y centrado óptico; evitar ángulos rígidos, puntas agresivas y siluetas copiadas de plataformas conocidas.
- La navegación inferior usa la misma silueta en estado activo/inactivo: **contorno** inactivo y **relleno** activo, sin círculos de selección añadidos ni saltos de tamaño.
- La familia aprobada de la barra inferior es: Casa redondeada; JShop = `bag-handle-outline` / `bag-handle` (el mismo icono del botón JShop en Mensajes); Videos = **Hexa Play A**, celda de panal con triángulo centrado, más grande que los otros cuatro; Mensajes = `JobeenMessageIcon`; Perfil con cabeza y hombros suaves.
- Reutilizar `JobeenMessageIcon` en el botón Chats de la pantalla Mensajes. Mantener la navegación, el acordeón, las áreas táctiles y el respeto por safe-area al modificar solo los dibujos.
- Para cambios visuales usar **EAS OTA en la rama `development`** cuando el binario sea compatible. No compilar ni generar un APK sin autorización explícita del usuario. No publicar cambios de diseño sin aprobación previa.

## Regla visual responsive de Jobeen (aprobada por el propietario)
- **Misma composición en todos los teléfonos** (incluidos Jelly, iPhone y Galaxy): mantener el mismo número de columnas, orden de los elementos, jerarquía, controles e interacciones en los anchos de teléfono. Una cuadrícula de dos columnas continúa siendo de **dos columnas**; nunca convertirla a una sola solo por detectar una pantalla estrecha.
- Adaptar de manera proporcional el ancho de tarjetas, fotos, iconos, márgenes, separaciones y tipografía según el espacio disponible, sin deformar imágenes (respetar `aspectRatio`) ni introducir cortes o solapamientos. Emplear dimensiones flexibles y medidas reales del contenedor en vez de suponer un modelo de teléfono.
- Mantener accesibilidad: targets de interacción apropiados, escalado de texto del sistema, contrastes y desplazamiento cuando sea necesario. Si no cabe el contenido de manera legible, priorizar scroll, distribución del espacio disponible y prueba de tamaños de contenido; **no cambiar la estructura ni ocultar elementos** sin autorización expresa.
- Basar medidas y adaptación en las guías oficiales de Material Design 3 / Android para diseño adaptativo; esta **invariante de Jobeen para teléfonos** es una decisión específica del producto, no un mandato literal de Material 3. Las clases de tamaño de ventana sirven para evaluar y probar restricciones, no autorizan por sí solas cambios en la composición aprobada.
- Para tablets/web o pantallas realmente expandidas, proponer cualquier estructura alternativa al propietario antes de implementarla. Comprobar siempre ancho lógico pequeño, normal y grande, y ambos temas. No convertir una optimización de Jelly en un rediseño para otros dispositivos.
- Ninguna norma visual provisional de la auditoría se considera definitiva hasta comparar capturas reales y obtener la aprobación de su propietario.

## Norma global de compartir Jobeen (aprobada)
- Todos los botones **Compartir** en JCard personal/de negocio, perfiles públicos, publicaciones, videos/Flashes, JShop y CV deben usar **el mismo menú redondeado y minimalista** de Jobeen (componente compartido `JCardShareSheet` / `JobeenShareSheet`).
- Adaptar título, texto y enlace al contenido; mostrar **QR solo si existe un enlace**, y mantener WhatsApp, SMS y **Más opciones** para el selector nativo de contactos y apps del teléfono.
- Evitar abrir el selector nativo encima de otro modal: cerrar primero el menú de origen.
- No inventar contactos de Jobeen ni el éxito de un envío. Los contadores solo se incrementan cuando el sistema devuelve una acción de compartir confirmada; preservar contadores y permisos actuales.
- Los futuros botones de compartir deberán reutilizar este control; no introducir variantes visuales separadas sin consulta y aprobación.

## Política de ramas (obligatoria)
1. `main` es la rama estable. NUNCA hacer commits, pushes, merges, cherry-picks ni despliegues de producción a `main` sin autorización explícita del usuario para esa acción.
2. `development` es la rama de integración y pruebas. Los arreglos pequeños pueden aplicarse allí, siempre con verificación.
3. Las funciones grandes se desarrollan en `feature/<nombre>`; revisar y probar antes de integrarlas en `development`. No integrar a `main` por el simple hecho de pasar CI.
4. Para promover `development` a `main`: Pull Request, CI verde, pruebas en Android, revisión visual, pruebas de seguridad y base de datos, y aprobación explícita del usuario.
5. Reportar en cada entrega: rama, commit SHA, qué cambió, estado real de CI/Expo, si es visible en Android, y qué queda pendiente. No declarar publicado sin evidencia.
6. Versionar entregas estables (empezando por v0.1.0 cuando el usuario lo apruebe); no inventar tags.

## Bases de datos y despliegue
- GitHub branches NO aíslan Supabase. El proyecto Supabase conectado puede ser compartido por distintas versiones.
- Objetivo: separar Supabase Development de Supabase Production antes de lanzamiento público; migraciones revisadas, reversibles cuando sea posible, sin afectar datos reales.
- No cambiar entornos de producción ni ejecutar migraciones destructivas sin aprobación explícita.
- Para cualquier cambio de Supabase, revisar RLS, privilegios, identidad del solicitante, estados y flujo de rechazo. Nunca considerar verificado un vínculo autodeclarado.

## Requisitos de producto acordados
- JCard Personal: nombre legal, usuario, profesión principal con ícono, experiencia general y disponibilidad, contactos según privacidad, idiomas; profesiones secundarias como sellos separados.
- Experiencia general: unión de períodos trabajados en diferentes sectores, sin duplicar períodos simultáneos. Experiencia de profesión principal en el cuadro informativo de su ícono.
- Verificación de identidad y credenciales: nunca automática sin la revisión pertinente.
- Vínculo laboral: trabajador busca empresa por nombre/@usuario, solicita, empresa aprueba o rechaza; SOLO el vínculo aprobado se muestra en JCard como enlace al perfil de la empresa. Trabajador o empresa pueden retirar/finalizar. Puede vincularse empresa propia, pero también requiere aprobación.
- Los vínculos deben persistirse y validarse en Supabase, no solamente en almacenamiento local.
- Antes de afirmar que una función funciona: comprobar compilación, pruebas y flujo de extremo a extremo con cuentas personal/empresa.

## Traspaso a otro chat
1. Leer este archivo y el repositorio, en especial el último commit de `development`, workflows de GitHub Actions, migraciones y estado Supabase.
2. No asumir que la última modificación se publicó; comprobar Actions/Expo.
3. Consultar `docs/CHAT_HANDOFF.md` para contexto funcional, tareas pendientes y prompt de continuidad.
4. Preguntar al usuario qué tarea continuar; nunca fusionar `main` por iniciativa propia.
