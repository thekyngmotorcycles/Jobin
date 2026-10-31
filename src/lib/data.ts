export type Intent = "Profesionales" | "Amistad" | "Citas";
export type Relationship = "Prefiero no decirlo" | "Soltero/a" | "Casado/a" | "En una relación";
// rating y reviews son valores de ejemplo para demostrar el orden; no son reseñas reales.
export const professionals = [
{id:"ana",name:"Ana Rivera",role:"Diseñadora de interiores",city:"Miami",initials:"AR",headline:"Espacios pequeños. Grandes posibilidades.",description:"Te enseño cómo transformamos este estudio en un hogar lleno de luz.",service:"Consulta de diseño",price:85,tags:["Diseño","Hogar"],rating:4.9,reviews:132},
{id:"marcos",name:"Marcos Díaz",role:"Barbero · Studio 305",city:"Miami",initials:"MD",headline:"Los detalles hacen la diferencia.",description:"Un día en el estudio: técnica, conversación y un buen corte.",service:"Corte y barba",price:45,tags:["Barbería","Estilo"],rating:4.7,reviews:86},
{id:"sofia",name:"Sofía Torres",role:"Entrenadora personal",city:"Orlando",initials:"ST",headline:"Un poco más fuerte, cada día.",description:"Así preparo una sesión de fuerza para alguien que empieza de cero.",service:"Sesión personal",price:60,tags:["Fitness","Bienestar"],rating:4.8,reviews:54}
];
export const guilds = [
{name:"Miami Creativos",city:"Miami",members:248,description:"Diseño, fotografía y nuevas ideas para nuestra ciudad."},
{name:"Orlando Emprende",city:"Orlando",members:186,description:"Conoce a quienes están construyendo su próximo proyecto."},
{name:"Oficios del Sur",city:"Miami",members:324,description:"Profesionales locales que comparten experiencia y oportunidades."}
];
