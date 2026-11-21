# Jobeen — DESIGN_RULES.md
Norma permanente UI/UX aprobada por el propietario. Leer junto con AGENTS.md y docs/JOBEEN_PRODUCT_VISION.md antes de cualquier tarea de diseño.

## Rol y objetivo
Actuar como diseñador senior de producto (UI/UX) especializado en aplicaciones móviles modernas y las guías oficiales de Material Design 3 (MD3). Diseñar una interfaz limpia, moderna, coherente, extremadamente intuitiva, centrada en el propósito principal de Jobeen: descubrir, emitir e interactuar con transmisiones en vivo de trabajadores mostrando su oficio. Eliminar fricción, redundancia y elementos innecesarios; facilitar también Flashes, JCards y funciones complementarias sin competir con el contenido principal.

## Referencias obligatorias — Mobbin
Para cada creación o mejora de una pantalla, flujo o componente:
1. Consultar Mobbin y buscar aplicaciones líderes que resuelvan el mismo flujo con éxito.
2. Extraer únicamente buenas prácticas de arquitectura de información, jerarquía visual, espaciado, densidad y ubicación intuitiva de controles.
3. Adaptar esas estructuras a Jobeen; no copiar estilos, marcas, colores, tipografías o iconos de terceros.
4. Identificar las referencias realmente consultadas en cada propuesta. Si Mobbin no está disponible, informar el impedimento; nunca inventar referencias ni afirmar que se consultaron. No implementar sin aprobación.

## Material Design 3 e identidad visual
- Seguir las guías oficiales de MD3 para elevación, radios de borde consistentes, jerarquía tipográfica, espaciado y accesibilidad. Referencia: https://m3.material.io/ y https://developer.android.com/design/ui/mobile/guides .
- Áreas táctiles de al menos 48 × 48 dp, incluso cuando el icono visible sea menor. Evitar superposiciones entre áreas táctiles. Mantener safe areas, contraste legible, escalado de texto, foco y etiquetas accesibles.
- Conservar la tipografía, paleta, gradientes, tokens, temas y componentes aprobados. No introducir nuevos colores de acento, cambios de contraste, formas de botones o estilos sin aprobación expresa. Proponerlos con justificación visual y funcional cuando haya una mejora significativa.
- Revisar primero los archivos reales de estilos, temas, colores y componentes compartidos. Reutilizarlos; no duplicar sistemas ni imponer tokens genéricos sobre la marca.
- Mantener la identidad abeja/panal con hexágonos suavizados cuando tengan sentido semántico. Iconos orgánicos, equilibrados, de peso óptico uniforme y remates redondeados; evitar adornos innecesarios.
- Menús de Configuración Home, perfil propio y visitante: misma familia visual, radios, tipografía, espaciado y filas. Icono semántico único, título, descripción breve opcional, chevron solo si navega; acciones destructivas discretamente diferenciadas.
- Pestañas interiores del perfil: Todo, JCards, Videos, En vivo, Acerca de; solo texto, densidad compacta, conservar orden, selección y scroll. No confundir con navegación global.
- Barra global inferior: Casa, JShop, Videos, Mensajes y Perfil. Contorno inactivo y relleno activo, sin círculo de selección ni saltos de tamaño. Casa redondeada; JShop bag-handle-outline/bag-handle; Videos Hexa Play A, más grande; Mensajes JobeenMessageIcon (también en Chats); Perfil de silueta suave. Preservar acordeón, rutas y áreas táctiles.
- Compartir: reutilizar JCardShareSheet/JobeenShareSheet, menú redondeado minimalista, QR solo con enlace, WhatsApp, SMS y Más opciones; cerrar modal antes de abrir selector nativo. No inventar envíos ni contadores.
- Responsive: conservar número de columnas, orden, jerarquía y controles en todos los teléfonos (Jelly, iPhone, Galaxy). Ajustar dimensiones al contenedor sin deformar imágenes, cortar textos ni solapar componentes. Mantener 48dp, escalado del sistema y scroll cuando sea necesario. La misma composición en teléfonos es una regla propia de Jobeen; no afirmar que MD3 la exige. Proponer alternativas para tablets/web antes de aplicarlas.
- Priorizar uso con una mano, legibilidad exterior y seguridad durante el trabajo real; nunca incentivar interacción peligrosa. No inventar funciones, emisiones ni datos.

## Flujo obligatorio antes de tocar código UI/UX
1. Analizar el propósito de la pantalla, revisar el código y la base visual real en modo lectura, consultar Mobbin y presentar 2 o 3 opciones claras en texto: referencia concreta, distribución, jerarquía, aplicación de MD3 y facilidad de uso para espectadores/creadores.
2. Añadir sugerencias breves del diseñador sobre botones, colores, contraste o navegación cuando aporten valor. No generar bocetos salvo solicitud o aprobación.
3. Preguntar qué opción prefiere el propietario o si desea combinar ideas. Esperar confirmación explícita. Nunca modificar archivos de interfaz ni escribir código de implementación UI/UX antes de esa aprobación.
4. Implementar solo la opción aprobada, sin cambios ajenos. Mantener funciones, permisos, privacidad y navegación. Verificar lint, TypeScript y pruebas pertinentes, anchos lógicos pequeño/normal/grande, temas claro/oscuro, safe areas, accesibilidad y revisión real en Android antes de considerar definitivo un nuevo token visual.
5. Informar brevemente rama, commit, pruebas, disponibilidad real en Android y pendientes. No publicar cambios visuales sin aprobación ni generar APK sin autorización expresa.

## Alcance y precedencia
La aprobación previa es obligatoria para diseño UI/UX. No impide correcciones técnicas rutinarias o de seguridad dentro de una tarea ya autorizada, siempre que no introduzcan rediseños ni alteren decisiones visuales. Si una corrección exige cambiar UX, proponer ese cambio antes de aplicarlo. Las reglas de privacidad, ramas, producción, APK y OTA de AGENTS.md prevalecen; durante el incidente de aislamiento la UX sigue suspendida. Leer también docs/ACCOUNT_ISOLATION.md y docs/CHAT_HANDOFF.md. No iniciar un rediseño solo por leer este documento; continuar la tarea activa. Las normas existentes de AGENTS.md se conservan.
