# Verificación de apariencia de Jobin

Fecha: 2026-10-31. Main se interpreta como Home, sin crear rutas nuevas. No hay cambios de backend, sanciones, reseñas ni historial profesional.

## Alcance y evidencia

Verificación automática de DOM en Chromium, viewport móvil 390 × 844, 23 rutas × 5 temas = 115 combinaciones. Capturas y matrix.json se descargan del artefacto appearance-matrix del workflow Appearance matrix. No equivale a revisión visual manual ni a pruebas en dispositivos físicos iOS/Android. Las pantallas privadas se probaron sin sesión (estado de acceso/error correspondiente); no se crearon cuentas ni datos de prueba en Supabase.

- W: wordmark visible, relleno SVG igual al foreground, alfa del fondo cero.
- N: cinco botones visibles, contenedores de navegación transparentes sin borde ni sombra. El degradado vive detrás de los iconos; el contraste de sus tokens sobre extremos claros/oscuros se prueba por separado.
- IA: asistente presente solo en Home. En todas las demás rutas se comprueba su ausencia.
- S: pantalla que no muestra wordmark en su distribución existente; se conserva así. No se añadió navegación inferior a rutas que no la tenían.
- Todas las celdas incluyen renderizado sin crash y ausencia de IA salvo donde figura IA.

| Pantalla | Light | Dark | Pink | Navy Green | Camel |
|---|---|---|---|---|---|
| Home | W · N · IA | W · N · IA | W · N · IA | W · N · IA | W · N · IA |
| Live | W · N | W · N | W · N | W · N | W · N |
| Videos | W · N | W · N | W · N | W · N | W · N |
| Mensajes | W · N | W · N | W · N | W · N | W · N |
| Perfil | W · N | W · N | W · N | W · N | W · N |
| Configuración | W | W | W | W | W |
| Inicio de sesión | W | W | W | W | W |
| Subir | W · N | W · N | W · N | W · N | W · N |
| Buscar | S | S | S | S | S |
| Servicios | W | W | W | W | W |
| Comunidades | W | W | W | W | W |
| Empresa | W | W | W | W | W |
| Profesional | W | W | W | W | W |
| Certificados | W | W | W | W | W |
| Revisión de certificados | W | W | W | W | W |
| Oportunidades | W | W | W | W | W |
| Seguridad | W | W | W | W | W |
| Revisión de seguridad | W | W | W | W | W |
| Términos | W | W | W | W | W |
| JCard sin sesión | W | W | W | W | W |
| Live sin sesión | W | W | W | W | W |
| Sala de live | S | S | S | S | S |
| Video sin sesión | W | W | W | W | W |

## Interacciones

Comprobadas en navegador: seleccionar Camel desde Configuración y conservarlo tras recarga; tocar IA sin navegar; arrastrar, anclar al borde izquierdo, guardar y restaurar posición; girar a 844 × 390 manteniendo el botón dentro del viewport y fuera de la navegación. El área táctil mide 56 × 56. Pruebas unitarias cubren ambos bordes, safe areas y datos guardados inválidos. Pendiente comprobar gestos táctiles nativos y safe areas reales en iOS/Android.

## Contraste y colores

Navy Green: 7.18:1; Camel: 7.08:1 con los tonos exactos solicitados. Texto principal AA ≥ 4.5:1; iconos ≥ 3:1 en los cinco temas. Texto secundario AA en Light, Dark, Navy Green y Camel; en Pink se conserva exactamente la paleta original. Su muted #80566a tiene 5.09:1 sobre paper y 5.73:1 sobre card, pero 4.26:1 sobre accent #f7cddd: excepción heredada documentada, porque se pidió no cambiar Pink. No se presenta como cumplimiento AA total de Pink.

Los bordes y textos secundarios de los temas nuevos/neutros se derivan del foreground por opacidad. CAMEL_FOREGROUND es la única constante de referencia de Camel. Los tonos semánticos/gradientes de JCard permanecen centralizados. La auditoría automática exige cero colores literales fuera de src/theme en código runtime; no prohíbe valores centrales de paleta ni identificadores de dominio.

## Cambios concretos

Wordmark vectorial único y transparente; barra flotante con safe areas y espacio inferior en contenido; cinco opciones con persistencia; JCARD/JCard en etiquetas; solicitud de historial con Enviar al flujo existente; identidad compartida de avatares e iniciales RA; Configuración sin DEMO ni títulos serif cursivos; miniaturas de Perfil con placeholder intencional; IA eliminada del Perfil y exclusiva de Home.

## Resultados y enlaces

- 115/115 combinaciones PASS, más prueba de interacción completa PASS.
- [Capturas y matrix.json](https://github.com/thekyngmotorcycles/Jobin/actions/runs/41180631111/artifacts/13034613419).
- [Workflow de apariencia aprobado](https://github.com/thekyngmotorcycles/Jobin/actions/runs/41180631111).
- [Validación npm run check y regresión de base de datos aprobadas](https://github.com/thekyngmotorcycles/Jobin/actions/runs/41180630960). La regresión usa la base efímera de CI; no se aplicaron migraciones al proyecto real.
- Código comprobado: e3a7cf33b68351e6017e023796492a2b1a5637c7.
