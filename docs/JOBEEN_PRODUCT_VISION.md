# Jobeen — visión de producto y criterio de diseño
**Fuente:** decisiones explícitas de su propietario, 21 de noviembre de 2026. Este documento es permanente para futuras sesiones. Leer junto con `AGENTS.md` y `docs/CHAT_HANDOFF.md`.

## Qué es Jobeen
Jobeen es una red social **mobile-first centrada en transmitir EN VIVO el trabajo real de las personas**, y en descubrir y apoyar a quienes muestran sus oficios. Su referencia de intención es la interacción en vivo de Twitch, pero Jobeen se diseña desde cero para teléfono, campo, obra, calle, taller u oficina, no para videojuegos desde una computadora.

Un electricista puede enseñar una instalación, un mecánico una reparación y un piloto su actividad cuando sea seguro; el creador puede estar de pie, trabajando, con guantes o con ambas manos ocupadas. La cámara del teléfono es primordial. Evaluar captura manos libres con dispositivos compatibles (por ejemplo, gafas inteligentes) como capacidad **futura**, no ya disponible.

## La promesa del producto
- **Crear:** iniciar un directo desde el móvil con la mínima fricción y administrarlo sin dejar de trabajar.
- **Descubrir:** encontrar transmisiones laborales genuinas, verlas y participar con comentarios útiles.
- **Crecer:** convertir los mejores momentos en Flashes (videos cortos editados), atraer público y vincularlo con el perfil profesional/JCard.
- **Conectar:** seguidores, contactos profesionales, empresas y JShop amplían las oportunidades que produce el contenido.
- **Apoyar económicamente:** visión futura de regalos/donaciones con valor monetario tanto en los EN VIVO como en Flashes. No implementar iconos de pago funcionalmente falsos ni afirmar disponibilidad de pagos antes de integrar proveedores, revisar las políticas de tiendas, protección del consumidor, fraude, menores, impuestos y retiros.

## Mandato de producto aprobado el 23 de noviembre de 2026
Jobeen es un organismo profesional integrado: mostrar trabajo → acreditar experiencia → conectar → captar clientes y oportunidades → completar trabajos y fortalecer reputación. Las empresas utilizan Jobeen como complemento de sus herramientas existentes, no como sustituto de ERP, contabilidad, nóminas, inventario industrial o software especializado como ServiceTitan. Podrán elegir usar streaming y captación, presupuesto propio, rendimiento y asignación inteligente supervisada de Equipo, o conectores autorizados y selectivos. La compatibilidad concreta depende de validación de APIs, permisos y costes; no se afirma que ya exista. Las acreditaciones profesionales verificadas son portables y de visibilidad controlada; las evaluaciones internas son confidenciales. No vigilancia ni rankings laborales permanentes.

Mantener cinco pestañas, Panel adaptable al contexto y lenguaje sencillo; JStats/JDispatch son capacidades de Equipo y JCard, no destinos globales; presupuestos y asistente son contextuales. Potenciar Live, Flashes y JCard; conservar Casa, Mensajes y JShop orientados al propósito; formación posteriormente, comunidades independientes pospuestas, citas fuera del roadmap. El filtro obligatorio de seis preguntas, los límites y el contrato de interoperabilidad están en Master Plan v1.4 §§1.1–1.6 y AGENTS.md §0.1; son la base para toda propuesta, no una autorización de implementación. No añadir funciones solo por replicar competidores.

## Reputación profesional propia — mandato permanente
Jobeen reúne evidencias de empleadores autorizados, trabajos reales confirmados, certificaciones/formación, evaluaciones prácticas y opiniones de clientes verificados. Calcula sus estadísticas y mantiene las acreditaciones mediante reglas propias, sin depender de IA, de un empleador único ni de software externo. El trabajador puede declarar aptitudes y solicitar verificación, nunca autoacreditarlas. La JCard diferencia fuentes y vigencia; no publica evaluaciones empresariales confidenciales ni puntuaciones arbitrarias. La IA podrá contribuir más adelante con observaciones de Lives voluntarios revisadas por especialistas, sin reemplazar el sistema ni otorgar acreditaciones automáticamente. La ausencia de IA o de transmisiones no debe impedir construir reputación. Ver Master Plan v1.4 §1.6 y AGENTS.md §0.2. Desarrollo pendiente, no autorizado por esta norma.

## Priorización funcional para cada propuesta
1. **Emitir en vivo:** acceso visible, comenzar, retomar, detener, estado de transmisión, cámara/micrófono, manejo de interrupciones y red móvil.
2. **Ver e interactuar:** acceso inmediato, claridad de chat, comentarios, espectadores verificados, moderación, reportes y bloqueos.
3. **Creación móvil:** ergonomía de una mano, exterior, accesibilidad, scroll, batería/datos, grabación y edición de Flashes, potencial captura manos libres.
4. **Identidad y descubrimiento:** perfiles de creadores, categorías laborales, JCard, historial de transmisiones y clips, búsqueda.
5. **Herramientas complementarias:** contactos, empresas, CV y marketplace que sirvan al creador y su público; evitar que oculten la transmisión.

**Seguridad:** nunca promover operar la cámara mientras se conduce, manejar maquinaria peligrosa o trabajar con electricidad exponiéndose a riesgos por interactuar con el chat. Diseñar captura manos libres, pausa y avisos sensatos; privacidad de terceros y ubicaciones de trabajo importan.

## Principios visuales, sin alterar la identidad
- Usar **exclusivamente** los tokens tipográficos, de color, iconografía de marca y radios de Jobeen que ya estén aprobados. Mobbin/X son referencias de **distribución y reducción del ruido visual**, no de colores, pesos, tamaños, marcas ni funcionalidades.
- Menús principales (Configuración Home, menú de opciones del perfil propio, menú de opciones del perfil público) comparten el **mismo lenguaje de superficie, filas, jerarquía y espacios**. Contenido y forma pueden diferir: Configuración necesita búsqueda y grupos; acciones contextuales no.
- Iconos solo cuando facilitan reconocer una acción; una fila admite uno, no una colección. Evitar iconos en opciones de navegación que ya se reconocen por el texto. Flecha solamente si navega.
- **Cinco pestañas interiores del perfil propio: solo texto; la galería JCards es privada y no figura en el visitante** `Todo | JCards | Videos | En vivo | Acerca de`. Quitar los iconos interiores, conservar las opciones y el desplazamiento horizontal. **No tocar la barra global inferior de cinco iconos** ni el acordeón.
- Teléfonos pequeños y grandes deben conservar el mismo número de columnas y la misma estructura; adaptar medidas sin ocultar controles o cortar texto. Material Design 3 se consulta para ergonomía y accesibilidad, manteniendo la decisión específica de Jobeen sobre composición estable.

## Plan de correcciones aprobadas, por fases
**Fase 1 — Unificación de menús principales y pestañas del perfil.**
- Crear un patrón de fila/superficie reutilizable de Jobeen.
- Aplicarlo a Configuración Home y menús de tres puntos del **perfil propio y visitante**, conservando rutas, confirmaciones y permisos.
- Convertir la banda interior de cinco pestañas del perfil a texto sin iconos; mantener selección, posición sticky, scroll y el mismo orden.
- Probar visualmente contraste, densidad, bordes, tamaño de texto, tema claro/oscuro, Jelly y teléfono estándar.

**Fase 2 — Consistencia de acciones y cuadros.**
- Armonizar el cuadro de opciones del chat (actual alerta nativa) con los diálogos Jobeen sin romper reportar/bloquear/Spam.
- Revisar hoja de Opciones de publicación, diálogo Eliminar contacto y otros menús con un mismo sistema de acciones.
- Validar confirmaciones, cancelaciones y errores.

**Fase 3 — Formularios y acordeones de JCard personal/negocio.**
- Compactar contenido sin modificar el arte ni identidad de las tarjetas.
- Idiomas: chips y pesos de Quitar/Agregar/Guardar.
- Profesiones: títulos y edición/borrado sin cortes ni filas rígidas.
- Privacidad: checkboxes alineados y opciones largas legibles.
- Verificar accesibilidad y proporciones en pantallas pequeñas y estándar sin cambiar estructura.

**Cierre por fase:** revisar workflows `validate` y `database`, probar visualmente Android y consultar al propietario antes de dar por permanente una regla, de tocar `main` o de desplegar funciones no autorizadas.

## Referencias estructurales
- Mobbin: pantallas iOS de X, investigadas por disposición y moderación de la densidad visual, **no** para importar estilos. https://mobbin.com/screens/e78e27cc-447f-409b-8102-8cdad3cc6219
- Mobbin: pantalla iOS de Configuración de X. https://mobbin.com/screens/fa4ef9ec-8e63-43cb-8f91-bd27930ab485

## Notas de traspaso
El repositorio conserva el nombre histórico `Jobin` en rutas, componentes y Expo; la identidad actual del producto es **Jobeen**. No renombrar rutas, claves, bundle IDs ni base de datos solo por coherencia editorial. Las capacidades futuras (regalos, captura con gafas) son visión, **no funcionalidades existentes**.
