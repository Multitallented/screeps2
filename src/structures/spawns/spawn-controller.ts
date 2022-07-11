import * as _ from "lodash";
import { SpawnPrototype } from "./spawn-prototype";

export class SpawnController {
  public static spawnCreeps(room: Room): void {
    SpawnPrototype.init();
    _.forEach(
      room.find(FIND_STRUCTURES, {
        filter: (structure: Structure) => {
          return structure.structureType === STRUCTURE_SPAWN;
        }
      }),
      (spawn: StructureSpawn) => {
        spawn.spawnNextCreep();
      }
    );
  }
}
