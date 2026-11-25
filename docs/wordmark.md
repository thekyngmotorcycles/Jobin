# Jobin — identidad visual definitiva

Aprobada por el propietario el 24 de noviembre de 2026. El nombre público vuelve a ser **Jobin**. Los originales enviados por el propietario están preservados byte por byte en `assets/brand/logo-original.webp` y `assets/brand/icono-original.webp`: los adjuntos tenían extensión PNG, pero sus bytes son WebP. No modificar, regenerar ni reinterpretar estos archivos. **Revisión definitiva:** logotipo principal exclusivamente lettering bicolor Jobin, sin hexágono; el icono conserva exactamente su J y hexágono abierto amarillo. El original del logotipo anterior se conserva como fuente histórica de los contornos, no para uso visible. El icono aprobado tiene extremos alineados y es una referencia independiente: no volver a copiar la apertura asimétrica anterior.

## Uso

- Logo: original 1536 × 1152; recorte vectorial de 934 × 370 (solo letras; no se modifica ningún contorno de letra). Icono: original 1536 × 1536.
- `assets/brand/logo-oscuro.svg`, `logo-claro.svg`, `icono-oscuro.svg`, `icono-claro.svg`: contornos extraídos de las imágenes, tolerancia de trazado 0.9 px. No son copias píxel a píxel. Se elimina únicamente el subcontorno del hexágono del logotipo; los contornos de las letras y del icono se conservan sin rediseño.
- Tinta blanca en oscuro, negra en claro; dorado #FDBD03 muestreado de originales. No cambia los tokens de Royal Hive, JCard o navegación.
- `JobinWordmark` y `JobinBrandIcon` usan la misma fuente de contornos `src/theme/brand-art.ts`. Sin fuentes cursivas de sistema ni descargas.
- El cargador reutiliza la silueta aprobada de J y conserva su animación existente.

## Próximo lote nativo (sin compilar ahora)

Nombre Expo ya es Jobin. Preparar y configurar PNG opaco 1024×1024 a partir del icono original; foreground adaptativo Android con margen de máscara y fondo negro. PNG y guía incluidos en el paquete de identidad entregado al propietario. Configurar `expo.icon`, `expo.android.adaptiveIcon.foregroundImage` y `backgroundColor: "#000000"` solo en el lote consolidado autorizado; actualizar textos visibles de permisos de Jobeen a Jobin entonces. No alterar scheme, slug, Android package, iOS bundle identifier, Expo project ID, OAuth, datos o claves persistentes. Sin cambio de configuración nativa en este PR para permitir OTA de la marca interna.

La marca pública Jobin reemplaza la denominación Jobeen. Las rutas, identificadores técnicos, nombres históricos de documentos y runtimes siguen estables por compatibilidad.
