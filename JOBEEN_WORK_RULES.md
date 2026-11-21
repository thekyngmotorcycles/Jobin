# Jobeen — Normas permanentes de trabajo

> Registrado: 2026-11-20. Documento operativo para recuperar las instrucciones del propietario en chats nuevos.
> Complementa `design_system.md`. No autoriza cambios de interfaz, código, despliegues ni compilaciones.

## 1. Aprobación antes de cambios
- No modificar código, diseño, navegación, backend, base de datos ni configuración fuera de lo expresamente autorizado.
- Ante cada propuesta de cambio de interfaz, nueva pantalla, menú, componente visual, aviso o modal: investigar el contexto, presentar **exactamente tres opciones diferenciadas** con pros/contras y recomendación, y obtener la elección/aprobación explícita del propietario.
- Permitir analizar una **vista previa de las tres alternativas** antes de aplicar el cambio completo a `development`. Las vistas previas pueden ser descripciones, referencias o visualizaciones solicitadas; no generar bocetos, imágenes ni cambios de código sin autorización previa. Si se piden vistas previas visuales, prepararlas sin alterar la app funcional.
- No interpretar una consulta, un reporte de error ni un «Fix» como licencia para cambios adicionales. Investigar, explicar y confirmar el arreglo propuesto según el protocolo de aprobación vigente.
- Mantener las decisiones previamente aprobadas en otras pantallas y no introducir cambios colaterales.

## 2. Investigación visual con Mobbin
- **Usar @Mobbin para buscar referencias reales de diseño** antes de diseñar una **pantalla nueva** o **menú nuevo**, y cuando se proponga una modificación visual importante.
- Utilizar patrones de UX como inspiración, sin copiar marcas ni activos protegidos y priorizando siempre la identidad aprobada de Jobeen.
- Explicar las referencias y vincular las alternativas de diseño con las necesidades concretas de la app.

## 3. Coherencia visual
- Todos los iconos: **bordes y esquinas redondeados, trazos limpios, proporciones uniformes y estilo minimalista**; respetar el patrón y familia de iconos ya aprobado.
- Barra inferior: contornos/interior vacío al estar inactivos y relleno al estar activos; sin círculo amarillo de selección. Preservar navegación y efecto acordeón.
- **Todos los avisos, diálogos, carteles emergentes, confirmaciones, sheets y modales** deben usar un mismo lenguaje visual de **esquinas realmente redondeadas** (recorte real del contenedor, no una línea superpuesta), espaciado, tipografía y botones coherentes. Usar tokens/componentes compartidos y verificar que el contenido no sobresalga.
- Preservar la identidad Jobeen plateada/dorada, degradados y transparencias aprobados, JCard, marca de agua SVG y demás activos existentes.
- Revisar pantallas compactas Android (incluyendo Unihertz Jelly), áreas seguras, desbordamientos, contraste, estados seleccionados y legibilidad.

## 4. Rama y entregas Android
- La APK actual es la instalación de prueba establecida y funciona con **actualizaciones OTA** usando la rama `development`.
- **Nunca crear, compilar, solicitar, publicar ni entregar una APK/AAB nueva sin consulta previa y autorización expresa del propietario.** Esto también aplica a builds automáticos de EAS disparados deliberadamente.
- Para cambios compatibles con OTA, mantener el flujo existente en `development`; no asumir que cualquier cambio nativo es compatible con OTA. Si una modificación exige una compilación nueva, explicar la limitación y solicitar autorización antes de proceder.
- Las vistas previas, pruebas, ramas temporales y propuestas **no se envían a `development`** hasta que el propietario apruebe explícitamente la opción final y su implementación. No hacer merge/push a `development` ni despliegues no autorizados.
- Verificar los cambios y reportar los resultados reales, sin afirmar pruebas que no se ejecutaron.

## 5. Capacidad de razonamiento
- **Antes de empezar una tarea compleja que se beneficiaría de mayor esfuerzo de razonamiento**, avisar al propietario para que pueda elegir **Medium** o **High** en ChatGPT.
- No asumir ni afirmar que se cambió esa configuración automáticamente.

## 6. Inicio de cada chat nuevo
1. Leer este documento y `design_system.md` del repositorio oficial `thekyngmotorcycles/Jobin` antes de proponer o ejecutar cambios.
2. Inspeccionar las ramas y el estado real de GitHub, Supabase y Vercel según la tarea; no asumir conexión ni funcionamiento sin verificar.
3. Recuperar aprobaciones anteriores relevantes y respetar el alcance exacto.
4. Presentar tres opciones y permitir evaluar la vista previa antes de cualquier cambio visual aprobado.
5. Trabajar sobre el flujo OTA de `development` **solo tras aprobación**, sin producir APK nueva.

En caso de conflicto, tienen prioridad las instrucciones explícitas más recientes del propietario; luego los diseños y comportamientos aprobados y la gobernanza indicada en `design_system.md`. Actualizar estas normas únicamente cuando el propietario lo solicite o lo apruebe.
