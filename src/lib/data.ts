export type Intent = "Profesionales" | "Amistad" | "Citas";
export type Relationship = "Prefiero no decirlo" | "Soltero/a" | "Casado/a" | "En una relación";
export const professionals = [
{id:"ana",name:"Ana Rivera",role:"Diseñadora de interiores",city:"Miami",initials:"AR",color:"#d0ac8d",headline:"Espacios pequeños. Grandes posibilidades.",description:"Te enseño cómo transformamos este estudio en un hogar lleno de luz.",service:"Consulta de diseño",price:85,tags:["Diseño","Hogar"]},
{id:"marcos",name:"Marcos Díaz",role:"Barbero · Studio 305",city:"Miami",initials:"MD",color:"#8b9f92",headline:"Los detalles hacen la diferencia.",description:"Un día en el estudio: técnica, conversación y un buen corte.",service:"Corte y barba",price:45,tags:["Barbería","Estilo"]},
{id:"sofia",name:"Sofía Torres",role:"Entrenadora personal",city:"Orlando",initials:"ST",color:"#9b9eb5",headline:"Un poco más fuerte, cada día.",description:"Así preparo una sesión de fuerza para alguien que empieza de cero.",service:"Sesión personal",price:60,tags:["Fitness","Bienestar"]}
];
export const guilds = [
{name:"Miami Creativos",city:"Miami",members:248,description:"Diseño, fotografía y nuevas ideas para nuestra ciudad."},
{name:"Orlando Emprende",city:"Orlando",members:186,description:"Conoce a quienes están construyendo su próximo proyecto."},
{name:"Oficios del Sur",city:"Miami",members:324,description:"Profesionales locales que comparten experiencia y oportunidades."}
];
