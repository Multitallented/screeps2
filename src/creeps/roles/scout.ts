import { CreepRoleEnum } from "./creep-role-enum";
import { LeaveRoomAction } from "../actions/leave-room";
import { WaitAction } from "../actions/wait";

export class Transport {
  static KEY: CreepRoleEnum = CreepRoleEnum.SCOUT;
  public static setAction(creep: Creep): void {
    if (creep.room.controller && creep.room.controller.my) {
      LeaveRoomAction.setAction(creep, null);
      return;
    }
    if (!creep.room.memory.creepCount) {
      WaitAction.setActionPermenantly(creep);
      return;
    }
    if (creep.room.memory.creepCount[CreepRoleEnum.SCOUT] < 2) {
      WaitAction.setActionPermenantly(creep);
      return;
    }
    LeaveRoomAction.setAction(creep, null);
  }
}
