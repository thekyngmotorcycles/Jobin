# Jobin — Reglas permanentes de trabajo (AGENTS.md)

Este archivo es la fuente de referencia para asistentes y desarrolladores que continúen el proyecto Jobin, incluso desde otro chat.

## Repositorio y arquitectura
- Repositorio GitHub: thekyngmotorcycles/Jobin.
- App web y móvil: Expo Router / React Native / TypeScript. Backend: Supabase. Preview Android: Expo EAS OTA.
- Idioma de la interfaz: español, excepto nombres propios Jobin y JCard.
- Diseño de marca: wordmark Jobin cursivo, tarjetas JCard con temas y detalles satinados.
- No incluir tokens, contraseñas, claves de Supabase ni credenciales en prompts, commits o archivos de traspaso.

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
