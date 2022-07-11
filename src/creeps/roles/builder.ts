import * as _ from "lodash";
import { BuildAction } from "../actions/build";
import { CreepRoleEnum } from "./creep-role-enum";
import { MineEnergyAction } from "../actions/mine-energy";
import { RepairAction } from "../actions/repair";
import { WithdrawAction } from "../actions/withdraw";

export class Builder {
  static KEY: CreepRoleEnum = CreepRoleEnum.BUILDER;
  public static setAction(creep: Creep): void {
    switch (creep.memory.action) {
      case WithdrawAction.KEY:
      case MineEnergyAction.KEY:
        this.findNextJob(creep);
        break;
      case BuildAction.KEY:
      case RepairAction.KEY:
      default:
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          this.findNextJob(creep);
        } else {
          creep.goGetEnergy(true, false);
        }
        break;
    }
    creep.runAction();
  }

  public static findNextJob(creep: Creep): void {
    const repairThese = _.sortBy(
      creep.room.find(FIND_STRUCTURES, {
        filter: (s: Structure) => {
          return (
            ((s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_WALL) || s.hits < 1000) &&
            s.hits / s.hitsMax < 0.75 &&
            s.hits < 250000
          );
        }
      }),
      (s: Structure) => {
        return -1 * s.hits;
      }
    );
    if (repairThese.length > 0) {
      RepairAction.setAction(creep, repairThese[0]);
    } else {
      const site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
      if (site) {
        BuildAction.setAction(creep, site);
      } else {
        const repairThese2 = _.sortBy(
          creep.room.find(FIND_STRUCTURES, {
            filter: (s: Structure) => {
              return (
                (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) &&
                s.hits / s.hitsMax < 0.75 &&
                s.hits < 250000
              );
            }
          }),
          (s: Structure) => {
            return -1 * s.hits;
          }
        );
        if (repairThese2.length > 0) {
          RepairAction.setAction(creep, repairThese2[0]);
        } else {
          creep.room.reassignIdleCreep(creep);
          return;
        }
      }
    }
  }
}
