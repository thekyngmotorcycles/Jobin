import type {MessageScope} from "./session-continuity";
import type {LegacyInventoryEntry} from "./legacy-private-inventory";
export async function inspectLegacyPrivateInventory(_scope:MessageScope):Promise<LegacyInventoryEntry[]>{
 throw Error("La revisión de datos del dispositivo requiere una aplicación nativa compatible.");
}
