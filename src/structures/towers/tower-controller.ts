import * as _ from "lodash";
import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";

export class TowerController {
  public static run(room: Room): void {
    let engagedTowers = 0;
    _.forEach(
      room.find(FIND_MY_STRUCTURES, {
        filter: (structure: Structure) => {
          return structure.structureType === STRUCTURE_TOWER;
        }
      }),
      (tower: StructureTower) => {
        const hasHostiles = GrandStrategyPlanner.hasHostilesInRoom(tower.room.name);
        if (hasHostiles) {
          const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
          if (closestHostile && (engagedTowers < 1 || !TowerController.isOnEdge(closestHostile.pos))) {
            const attackMessage = tower.attack(closestHostile);
            if (attackMessage === OK) {
              engagedTowers += 1;
            }
            return;
          }
        }
        const hasDamagedCreeps = tower.room.find(FIND_MY_CREEPS, {
          filter: (c: Creep) => {
            return c.hits < c.hitsMax;
          }
        });
        if (hasDamagedCreeps) {
          const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (c: Creep) => {
              return c.hits < c.hitsMax;
            }
          });
          if (damagedCreep) {
            tower.heal(damagedCreep);
            return;
          }
        }
        let sources: number;
        if (tower.room.memory.sources && tower.room.memory.sources.sources) {
          sources = Object.keys(tower.room.memory.sources.sources).length;
        } else {
          sources = tower.room.find(FIND_SOURCES_ACTIVE).length;
        }
        const controllerLevel = tower.room.controller ? tower.room.controller.level : 0;
        const repairMinUpgraders = controllerLevel > 7 ? 0 : sources;
        if (
          tower.store.getUsedCapacity(RESOURCE_ENERGY) > 750 &&
          controllerLevel > 2 &&
          tower.room.getNumberOfCreepsByRole(CreepRoleEnum.UPGRADER) > repairMinUpgraders &&
          tower.room.getNumberOfCreepsByRole(CreepRoleEnum.TRANSPORT) > 1 &&
          tower.room.energyAvailable > 0.6 * tower.room.energyCapacityAvailable &&
          tower.room.getNumberOfCreepsByRole(CreepRoleEnum.MINER) >= sources
        ) {
          const damagedStructure = _.sortBy(
            tower.room.find(FIND_STRUCTURES, {
              filter: (s: Structure) => {
                return s.hits / s.hitsMax < 0.75 && s.hits < 150000;
              }
            }),
            (s: Structure) => {
              return s.hits;
            }
          );
          if (damagedStructure && damagedStructure.length > 0) {
            tower.repair(damagedStructure[0]);
            return;
          }
        }
      }
    );
  }

  public static isOnEdge(pos: RoomPosition): boolean {
    return pos.x < 3 || pos.x > 47 || pos.y < 3 || pos.y > 47;
  }
}
