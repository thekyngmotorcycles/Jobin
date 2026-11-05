# Jobin — Reglas permanentes de rendimiento de JCard y medios

Estas reglas se aplican a todo fondo, banner, foto, miniatura, sello o textura nuevo. Mantenerlas en futuras tareas de desarrollo y revisiones de PR.

## Orden de optimización
1. **Respuesta inmediata:** controles con estado visual al tocar; no esperar la red para indicar una acción.
2. **Caché segura por usuario:** mostrar la última JCard válida de la cuenta actual; revalidar contra Supabase en segundo plano. Limpiar en cierre/cambio de sesión. No almacenar ni mostrar datos de otra cuenta.
3. **Carga progresiva:** priorizar estructura, nombre, profesión y campos esenciales. Diferir fotos secundarias, reseñas, detalles y galerías.
4. **Fondos y gráficos:** memorizar rutas SVG y componentes puros; no regenerar decenas de trazados por cada pulsación. Mantener el fondo de vista previa separado del contenido editable.
5. **Imágenes optimizadas:** preferir WebP/JPEG para fotografías; usar miniaturas de tamaño adecuado en listas, no originales de alta resolución. Comprimir y redimensionar antes de subir cuando exista soporte nativo probado; conservar calidad suficiente para la JCard. No convertir logos con transparencia a JPEG.
6. **Renderizado eficiente:** listas virtualizadas para catálogos; evitar estados que provoquen renderizaciones completas de la JCard, QR y sellos. Evitar cargar todas las imágenes simultáneamente.
7. **Red y almacenamiento:** reutilizar URLs estables y caché de imágenes, evitar descargas duplicadas; invalidar caché al reemplazar una imagen. No bloquear navegación por solicitudes secundarias.
8. **Medición:** comparar apertura en frío, apertura con caché y tiempo hasta primera interacción en Android real. No afirmar mejoras cuantitativas sin mediciones.

## Condiciones de aceptación para cada nuevo fondo o imagen
- La JCard conserva sus dimensiones y estilo aprobado.
- La pantalla sigue siendo interactiva mientras se descargan medios.
- Las miniaturas no descargan originales innecesariamente cuando se disponga de variantes.
- No se introducen colores literales fuera de los módulos de tema.
- Pasan lint, TypeScript, pruebas y exportación en GitHub Actions.
- Cambios primero en `development`; no generar APK ni fusionar a `main` sin solicitud.

## Estado
- Skeleton inmediato y caché del workspace por usuario: implementados.
- Texturas premium y miniaturas: memoización/caché implementadas.
- Miniaturas: se solicita una variante Supabase Storage de 320 px para URLs públicas compatibles; si la transformación no está disponible se recupera la imagen original. Validar en dispositivo y plan Supabase.\n- Compresión de selección de imágenes empresariales: aplicada mediante Expo Image Picker, calidad 0.75 para banner y 0.65 para avatar (no garantiza reducción de dimensiones ni del peso final para todos los formatos).\n- Redimensionado real antes de subir: pendiente. Requiere integrar y probar un manipulador nativo de imágenes y una nueva compilación de APK; no introducirlo en la APK actual sin autorización.
- Instrumentación de tiempos de render y red: pendiente.
