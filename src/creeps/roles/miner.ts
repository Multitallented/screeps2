import { CreepRoleEnum } from "./creep-role-enum";
import { MineEnergyAction } from "../actions/mine-energy";
import { TransferAction } from "../actions/transfer";
import { WaitAction } from "../actions/wait";
import { WithdrawAction } from "../actions/withdraw";
import _ from "lodash";

export class Miner {
  static KEY: CreepRoleEnum = CreepRoleEnum.MINER;
  public static setAction(creep: Creep): void {
    let nearestContainer: Structure | null = null;
    let sources: Array<Source>;
    let closestDistance = 99999;
    switch (creep.memory.action) {
      case WithdrawAction.KEY:
      case MineEnergyAction.KEY:
        _.forEach(creep.room.find(FIND_STRUCTURES), (s: Structure) => {
          if (s.structureType === STRUCTURE_LINK && (<StructureLink>s).store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            const distance = Math.max(1, creep.pos.getRangeTo(s.pos));
            if (distance < closestDistance) {
              closestDistance = distance;
              nearestContainer = s;
            }
          } else if (
            (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_STORAGE) &&
            (<StructureContainer>s).store.getFreeCapacity(RESOURCE_ENERGY) > 0
          ) {
            const distance = Math.max(1, creep.pos.getRangeTo(s.pos));
            if (distance * 2 < closestDistance) {
              closestDistance = distance * 2;
              nearestContainer = s;
            }
          }
        });
        if (nearestContainer) {
          TransferAction.setAction(creep, nearestContainer, RESOURCE_ENERGY);
        } else {
          WaitAction.setActionUntilNextTick(creep);
        }
        break;
      case TransferAction.KEY:
      default:
        sources = creep.room.find(FIND_SOURCES_ACTIVE);
        for (const source of sources) {
          const reassignMiners = new Array<Creep>();
          const otherMinersOnSource = creep.room.find(FIND_MY_CREEPS, {
            filter: (c: Creep) => {
              if (c.memory && c.memory.role === Miner.KEY && c.memory.target === source.id) {
                const range = creep.pos.getRangeTo(source.pos);
                if (c !== creep && c.pos.getRangeTo(source.pos) > range) {
                  reassignMiners.push(c);
                  return false;
                } else {
                  return true;
                }
              }
              return false;
            }
          });
          if (otherMinersOnSource.length < 1) {
            _.forEach(reassignMiners, (c: Creep) => {
              delete c.memory.target;
            });
            MineEnergyAction.setActionWithTarget(creep, source);
            creep.runAction();
            return;
          }
        }
        MineEnergyAction.setAction(creep);
        break;
    }
    creep.runAction();
  }
}
