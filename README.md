# Jobin · Professional Work

Base web de Jobin, la red profesional con descubrimiento visual, servicios y conexiones locales.

## Ejecutar
Requiere Node.js 22 o superior.

```sh
npm install
npm run dev
```

Abrir http://localhost:3000. Validar con `npm run lint`, `npm run typecheck` y `npm run build`.

## Incluido
- Next.js App Router y TypeScript; interfaz adaptable a móviles en español.
- Feed visual con profesionales de ejemplo, guardar e indicar interés.
- Catálogo de servicios y precios; filtros Miami y Orlando.
- Tarjetas para profesionales, amistad y citas; saltar y expresar interés.
- Sección de matches vacía: un interés unilateral nunca se presenta como match.
- Comunidades y perfil con estado sentimental opcional: soltero/a, casado/a o en una relación.
- Interacciones en memoria, reiniciadas al recargar.

## Pendiente de integración
No existen cuentas reales, persistencia, uploads, reproducción de video, reservas, cobros, chat, calendario ni videollamadas. Los portafolios son ilustraciones y las consultas muestran un aviso explícito de demostración.

Evolución prevista: Supabase Auth y PostgreSQL con RLS; video con Mux o Cloudflare Stream; Stripe Connect con onboarding y webhooks verificados; calendario con OAuth. Las claves privadas se utilizarán únicamente en servidor. No conectar esta interfaz directamente a tablas sin políticas de acceso.

Antes de producción, implementar consentimiento por tipo de conexión, privacidad del estado sentimental, bloqueo y reportes, control de edad para citas, coincidencias mutuas en servidor y prevención de reservas simultáneas.

## Arquitectura
`src/app`: interfaz y estilos. `src/lib/data.ts`: tipos y datos demo. `docs/roadmap.md`: siguientes entregas.

Repositorio principal: https://github.com/thekyngmotorcycles/Jobin.
