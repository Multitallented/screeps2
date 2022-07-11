import { CreepRoleEnum } from "./creep-role-enum";
import { MineEnergyAction } from "../actions/mine-energy";
import { TransferAction } from "../actions/transfer";
import { WithdrawAction } from "../actions/withdraw";

export class Transport {
  static KEY: CreepRoleEnum = CreepRoleEnum.TRANSPORT;

  public static setAction(creep: Creep): void {
    switch (creep.memory.action) {
      case WithdrawAction.KEY:
      case MineEnergyAction.KEY:
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) < 1) {
          creep.goGetEnergy(creep.getActiveBodyparts(WORK) > 0, true);
        } else {
          creep.deliverEnergyToSpawner();
        }
        break;
      case TransferAction.KEY:
      default:
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          creep.deliverEnergyToSpawner();
        } else {
          creep.goGetEnergy(creep.getActiveBodyparts(WORK) > 0, true);
        }
        break;
    }
    creep.runAction();
  }
}
