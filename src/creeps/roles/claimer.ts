import { ClaimControllerAction } from "../actions/claim-controller";
import { CreepRoleEnum } from "./creep-role-enum";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";
import { TravelingAction } from "../actions/traveling";

export class Claimer {
  static KEY: CreepRoleEnum = CreepRoleEnum.CLAIMER;

  public static setAction(creep: Creep): void {
    if (!creep.memory.endRoom) {
      const canClaimAnyRoom = GrandStrategyPlanner.canClaimAnyRoom();
      if (canClaimAnyRoom && !creep.memory.toRoom && Memory.roomData) {
        const bestRoom = GrandStrategyPlanner.getBestRoomToClaim(creep.room, false);
        if (bestRoom) {
          creep.memory.endRoom = bestRoom;
        }
      }
    }
    if (creep.memory.endRoom && creep.memory.endRoom !== creep.room.name) {
      TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.endRoom));
    } else if (creep.memory.endRoom && creep.memory.endRoom === creep.room.name) {
      ClaimControllerAction.setAction(creep);
    }
    creep.runAction();
  }
}
