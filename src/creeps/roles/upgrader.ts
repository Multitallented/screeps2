import { CreepRoleEnum } from "./creep-role-enum";
import { MineEnergyAction } from "../actions/mine-energy";
import { UpgradeControllerAction } from "../actions/upgrade-controller";
import { WithdrawAction } from "../actions/withdraw";

export class Upgrader {
  static KEY: CreepRoleEnum = CreepRoleEnum.UPGRADER;
  public static setAction(creep: Creep): void {
    switch (creep.memory.action) {
      case WithdrawAction.KEY:
      case MineEnergyAction.KEY:
        UpgradeControllerAction.setAction(creep);
        break;
      case UpgradeControllerAction.KEY:
      default:
        creep.goGetEnergy(true, false);
        break;
    }
    creep.runAction();
  }
}
