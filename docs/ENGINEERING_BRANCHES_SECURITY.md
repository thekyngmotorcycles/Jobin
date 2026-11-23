# Jobeen — árbol de desarrollo y seguridad continua

**Documento de arquitectura, no backlog.** Las tareas, responsables, excepciones, pruebas reales y bloqueos viven solo en [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md). Aplican [AGENTS.md](../AGENTS.md) y las autorizaciones del propietario. La aplicación se llama **Jobeen**; el repositorio conserva el nombre histórico **Jobin**.

## Árbol de ramas

```text
main                      versión publicada y punto de recuperación; sin pushes directos
  └── development         integración estable del siguiente ciclo
       ├── feature/*      una función/producto, un PR y un responsable
       ├── fix/*          corrección acotada y prueba de regresión
       ├── security/*     un control de privacidad/autorización
       ├── test/*         pruebas sobre un contrato existente
       ├── governance/*   normas, controles automáticos y administración
       ├── docs/*         documentación acordada
       └── integration/* ensamblaje temporal de PRs dependientes
release/*                 candidato cortado de una integración validada; PR a main
hotfix/*                  incidente crítico de main; PR a main y vuelta a development
```

- Solo `main` y `development` son troncales permanentes. **No** crear ramas duraderas vacías para JShop, Videos, JCard o cada microservicio: generan conflictos y deuda de merges. El área se refleja en el nombre de una rama temporal y sus archivos.
- Aislamiento por objetivo y por dueño, no por chat. Para PRs apilados: describir base, HEAD esperado, dependencias y qué archivos edita cada agente. No rebase/merge automático en ramas de otro agente.
- Un cambio vive en `feature/<área>-<tarea>`, `fix/<área>-<tarea>` o `security/<área>-<tarea>` y vuelve por PR a la rama de integración correspondiente. `integration/*` se usa únicamente para juntar cambios relacionados antes de validar; se elimina tras integración aprobada y comprobada.
- `release/*` solo surge cuando existe una candidata verificable, no para simular progreso. Para `main`, el gate permite PR solo desde `release/*` o `hotfix/*`. Las ramas existentes de seguridad y piloto continúan apiladas hasta decisión de promoción; no se reescribe historia.
- No borrar ni fusionar ramas candidatas sin autorización. `main` y `development` actuales pueden estar por detrás de PRs de seguridad: primero resolver el árbol de dependencias y las regresiones, después promoción explícita. Mantener rollback y referencias verificables.

## Ciclo de una tarea

1. Leer `AGENTS.md` y el **delta actual** de `DEVELOPMENT_STATUS.md`; comprobar HEAD, PR y CI. No reabrir el inventario ni una auditoría completa.
2. Establecer hipótesis/causa, dueño de archivos, alcance mínimo, contrato de seguridad y criterio de aceptación concreto.
3. Abrir una única rama temporal; modificar código y **pruebas pertinentes juntas**. Proteger datos reales; fixtures ficticios solo en proyectos aislados; no introducir tokens o `service_role` en repositorio.
4. CI en PR: `validate` (tipos, lint, pruebas, export sin APK, autolinking, fail-closed y gate incremental) y `database` (migraciones y pruebas RLS). No mezclar verde de CI con pruebas hosted, Android físico o seguridad demostrada.
5. Revisar únicamente el delta, cobertura negativa de autorización y retrocompatibilidad. Si falla, corregir raíz y volver a ejecutar la prueba afectada; las suites de regresión generales siguen corriendo automáticamente.
6. Obtener aprobación antes de promover, compilar EAS, aplicar SQL alojado, activar gateway/CDN, OTA o publicar. Documentar SHA, evidencia y rollback y cerrar el alcance terminado. Si falta acceso a credenciales o servidor: `BLOQUEADO`, no crear código ficticio para ocultarlo.

## Defensas por capas

| Etapa | Mecanismo exigido | Evidencia válida |
| --- | --- | --- |
| Diseño/PR | amenazas por flujo (suplantación, IDOR, fuga entre cuentas, abuso, pérdidas de datos), propietario de datos y denegación por defecto | contrato, decisiones y pruebas negativas del flujo modificado |
| Código/CI | RLS/Storage, alcance UUID, revisión de sesiones y permisos, test diferencial de archivos sensibles, typing/lint/export y SQL tests | CI verde del SHA exacto más revisión de cambio |
| Integración | A/B/C con JWT reales, Auth, PostgREST, Storage y grants de RPC; acciones de lectura y escritura; regresiones del área | resultados HTTP de un piloto aislado, errores y cobertura del contrato |
| Android/web | KeyStore, aislamiento local, fuga por cachés/offline, A→B→A, restores, deep links y ciclo de vida | test físico del binario autorizado y evidencia reproducible |
| Operaciones | alertas, rate limiting, WAF/anti-DDoS, logs sin contenido privado, rotación, copias y simulacros, respuesta a incidentes | configuración verificada, monitoreo operativo y ensayos autorizados |

**Autoevaluación ≠ autocorrección total.** GitHub Actions y Dependabot pueden detectar fallos de tests y dependencias conocidas, abrir PRs de actualización y detener merges **cuando se configuren las reglas de protección**. No pueden determinar solos toda vulnerabilidad, observar tráfico alojado sin telemetría ni revocar/recuperar datos sin servicios y permisos específicos. La corrección siempre exige revisión y aprobación; nunca hacer despliegues automáticos para «probar» una hipótesis.

## Reglas automáticas que acompañan al código

- `scripts/check-security-change-coverage.mjs`: en cada PR, clasifica los archivos sensibles por área (`database`, `workflow`, `expo-config`, `native`, `auth`, `media`, `social-privacy`). Cada área afectada requiere una prueba de regresión modificada **de su propia categoría**; un test de otra función no basta. Detecta también eliminación de código sensible; una prueba eliminada no cuenta como cobertura. Esto **no garantiza la calidad** del test, su ejecución ni la correspondencia semántica de los casos; revisión humana sigue siendo necesaria.
- `tests/security-change-coverage.test.ts`: verifica positivos, negativos, tests no relacionados, cambios multiárea y eliminaciones, sin credenciales ni conexiones.
- `.github/workflows/check.yml`: conserva `validate` y `database` y añade la comprobación incremental; ninguna operación EAS, SQL hosted o OTA.
- `.github/dependabot.yml`: propuestas semanales limitadas de versiones npm y GitHub Actions. Revisar cambios Expo/React Native que tengan implicaciones nativas; jamás auto-merge.
- `.github/workflows/security-dependencies.yml`: auditoría de CVE conocidas del lockfile semanal y manual, sin instalar binarios ni publicar nada. Un hallazgo abre un registro concreto para el componente afectado, no una nueva auditoría de toda la app. Funciona como alerta, no como defensa de runtime.

## Ajustes del repositorio que requieren activación/verificación manual

En GitHub → **Settings → Rules → Rulesets** (o Branch protection si corresponde al plan):

- Proteger `main` y `development`: exigir PR y status checks `validate` y `database`; bloquear `force push` y borrado. Evitar bypass por bots o agentes.
- Para `main`, incorporar una aprobación humana distinta del autor cuando la organización tenga esa capacidad. Sin otro revisor, no configurar un número imposible de aprobaciones; solicitar una revisión externa antes del lanzamiento.
- Activar Dependency graph, Dependabot alerts/security updates y, si el plan lo permite, secret scanning y análisis de código. Verificar la disponibilidad en GitHub antes de afirmarla. Mantener acciones y dependencias fijadas; revisar PRs automáticos.
- Proteger las variables EAS y Supabase en ámbitos piloto/producción separados; acceso mínimo, variables privadas sin compartir, sin secretos en PRs.
- Verificar en ajustes que los rulesets **estén activos**. Tener un documento o workflow en GitHub no activa por sí solo los controles administrativos.

## Riesgo conocido: JWT tras logout

SEC-06 `auth` y `core` pasaron en el piloto según el informe de Codex comunicado por el propietario. El informe también registra que REST aceptó un JWT emitido antes del cierre de sesión. Un access token firmado puede seguir siendo válido hasta el vencimiento; el cierre de sesión no garantiza revocación instantánea. Tratar por separado:

- Operaciones ordinarias: TTL acotado, refresh revocable, defensa de token robado, comprobación de identidad y controles RLS.
- Operaciones sensibles (credenciales, borrado, exportación privada, pagos futuros, evidencias críticas): además del JWT, comprobar sesión/autoridad vigente en servidor y reautenticación según contrato. Probar API directa con token cerrado/no válido.
- Revocación por origen/CDN, sesiones expuestas, Realtime y archivos ya descargados: contratos específicos; no afirmar protección completa sin evidencia.
- Registrar prioridad, prueba de explotación real o condición y decisión de alcance en `DEVELOPMENT_STATUS.md`. No modificar o invalidar Auth global por inferencia.

## Crecimiento ordenado

Antes de abrir a público: cerrar P0/P1, perímetro de medios, pruebas físicas y permisos, revisar telemetría de abuso y procesos de restauración/revocación. Cuando crezcan usuarios y volumen, medir errores, consumo de recursos, tráfico anómalo, lentitud, alertas, capacidad y costos **con datos reales**, evitando compras anticipadas. Escalar los controles proporcionales y automatizarlos donde sean deterministas, sin instalar componentes nativos ni crear infraestructura de pago por especulación.
