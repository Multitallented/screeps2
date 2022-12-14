import { RecycleAction } from "./actions/recycle";
import { MoveAction } from "./actions/move";
import { AttackAction } from "./actions/attack";
import { ClaimControllerAction } from "./actions/claim-controller";
import { CreepRoleEnum } from "./creep-role-enum";
import { CreepRoleTransfer } from "./roles/creep-role-transfer";
import { CreepRoleTransport } from "./roles/creep-role-transport";
import { ReserveControllerAction } from "./actions/reserve-controller";
import { PickupAction } from "./actions/pickup";
import { RepairAction } from "./actions/repair";
import { UpgradeControllerAction } from "./actions/upgrade-controller";
import { BuildAction } from "./actions/build";
import { TransferAction } from "./actions/transfer";
import { TravelingAction } from "./actions/traveling";
import { WithdrawAction } from "./actions/withdraw";
import { MineEnergyAction } from "./actions/mine-energy";

const setNextAction = function (this: Creep) {
  switch (this.memory.role) {
    case CreepRoleEnum.TRANSPORT:
      new CreepRoleTransport().doAction(this);
      break;
    case CreepRoleEnum.TRANSFER:
      new CreepRoleTransfer().doAction(this);
      break;
    default:
      // Do nothing
      break;
  }
};

const runAction = function (this: Creep) {
  switch (this.memory.action) {
    case RecycleAction.KEY:
      RecycleAction.run(this);
      break;
    case MoveAction.KEY:
      MoveAction.run(this);
      break;
    case AttackAction.KEY:
      AttackAction.run(this);
      break;
    case TravelingAction.KEY:
      TravelingAction.run(this);
      break;
    case ClaimControllerAction.KEY:
      ClaimControllerAction.run(this);
      break;
    case ReserveControllerAction.KEY:
      ReserveControllerAction.run(this);
      break;
    case PickupAction.KEY:
      PickupAction.run(this);
      break;
    case RepairAction.KEY:
      RepairAction.run(this);
      break;
    case UpgradeControllerAction.KEY:
      UpgradeControllerAction.run(this);
      break;
    case BuildAction.KEY:
      BuildAction.run(this);
      break;
    case TransferAction.KEY:
      TransferAction.run(this);
      break;
    case WithdrawAction.KEY:
      WithdrawAction.run(this);
      break;
    case MineEnergyAction.KEY:
      MineEnergyAction.run(this);
      break;
    default:
      this.setNextAction();
      break;
  }
};

declare global {
  interface Creep {
    setNextAction();
    runAction();
    init: boolean;
  }
}

export class CreepPrototype {
  public static init(): void {
    if (!Creep.hasOwnProperty("init")) {
      Creep.prototype.setNextAction = setNextAction;
      Creep.prototype.runAction = runAction;
      Creep.prototype.init = true;
    }
  }
}
