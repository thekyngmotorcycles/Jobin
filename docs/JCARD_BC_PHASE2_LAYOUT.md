# Jobeen JCard — B + C · Fase 2, cambio 1
**Estado:** rama experimental; revisión y aprobación pendientes. No fusionar, no publicar OTA ni actualizar Supabase.

## Qué se ha implementado
Se ha creado `src/theme/jcard-structure.ts` para centralizar los **valores actuales** y las reglas de las tres zonas: encabezado no contraíble, contenido flexible y pie no contraíble. Las caras personal y empresarial consumen el mismo contrato.

No se han cambiado medidas exteriores, tipografías visibles, íconos, colores, texturas, giro, botones, sellos, líneas ni comportamiento de contactos. El objetivo de este cambio es crear una base común **sin rediseñar aún**.

## Parámetros observados y conservados

| Parámetro | Valor actual |
| --- | --- |
| Ancho exterior máximo | 520 dp |
| Margen horizontal total en el cálculo de ancho | 32 dp |
| Umbral de diseño compacto | ancho menor a 350 dp |
| Alto en tema claro | 330 dp |
| Alto en tema oscuro | 400 dp |
| Incremento compacto de altura | +8 dp |
| Incremento máximo de altura por fuente ampliada | +12 dp |
| Padding de JCard personal claro / otros | 12 / 14 dp |
| Espacio interno personal claro / otros | 5 / 8 dp |
| Pie personal en tema claro | 76 dp |
| Pie personal en otros temas, sin profesiones secundarias | 92 dp |
| Pie personal en otros temas, con profesiones secundarias | 166 dp |
| Padding horizontal del negocio claro / otros | 10 / 14 dp |
| Padding superior del negocio claro / otros | 14 / 16 dp |
| Padding inferior del negocio claro / otros | 8 / 9 dp |
| Espacio del negocio claro / otros | 3 / 5 dp |
| Pie empresarial (sellos actuales) | 64 dp |

El cálculo de altura por fuente es `Math.round(Math.max(0, Math.min(fontScale,1.3)-1)*40)`. Las cantidades indicadas corresponden a la implementación actual y se conservan sin cambios en esta etapa.

## Reglas estructurales compartidas
1. **Encabezado:** `flexShrink: 0`.
2. **Contenido:** `flex: 1, minHeight: 0`.
3. **Pie:** `flexShrink: 0`, con altura reservada según los valores vigentes.

Estas reglas de distribución son una primera base de ingeniería. **No constituyen por sí solas una garantía visual de ausencia de solapamientos**: falta definir restricciones para contenido variable y probar los diseños renderizados.

## Pendientes que requieren otra autorización
- Diseñar alturas adaptables y tratar el contenido que no cabe en el Jelly Star.
- Alinear correo, teléfono y dirección mediante una columna común.
- Ubicar WhatsApp junto al último número de teléfono.
- Eliminar la línea superior no aprobada y el sello «En el mercado».
- Unificar la escala tipográfica y los encabezados degradados propio/visitante.
- Probar capturas en Android, revisar de forma visual y solo entonces publicar una OTA autorizada.

## Condiciones para integrar
Revisión de las diferencias en GitHub, comprobaciones de TypeScript, lint, pruebas automatizadas y exportación. La aprobación de CI no sustituye la revisión UX/UI ni prueba visual en Jelly Star. `development` y `main` permanecen intactos.
