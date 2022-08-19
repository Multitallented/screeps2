import { CreepUtil } from "../utils/creep-util";
import { Util } from "../utils/util";

export class SpawnController {
  public static run(): void {
    _.forEach(Game.spawns, (spawn: StructureSpawn) => {
      if (spawn.spawning) {
        return;
      }
      let needs = Memory.creepNeeds;
      needs = _.sortBy(needs, need => {
        return need.priority;
      });
      for (const need of needs) {
        if (
          !need.spawning &&
          Util.getDistanceBetweenTwoRooms(need.pos.roomName, spawn.room.name) <= Math.max(1, need.priority / 100)
        ) {
          const creepRole = CreepUtil.getCreepRole(need.creepRole);
          need.spawning = true;
          spawn.spawnCreep(
            creepRole.buildCreep(spawn.room.energyAvailable),
            <string>(<unknown>need.creepRole) + <string>(<unknown>Game.time),
            { memory: need.memory }
          );
          return;
        }
      }
    });
  }
}
