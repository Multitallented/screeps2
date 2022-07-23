import { ClaimControllerAction } from "../actions/claim-controller";
import { CreepRoleEnum } from "./creep-role-enum";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";
import { TravelingAction } from "../actions/traveling";
import { ReserveControllerAction } from "../actions/reserve-controller";

export class Claimer {
  static KEY: CreepRoleEnum = CreepRoleEnum.CLAIMER;

  public static setAction(creep: Creep): void {
    if (!creep.memory.endRoom) {
      const canClaimAnyRoom = GrandStrategyPlanner.canClaimAnyRoom();
      if (canClaimAnyRoom && !creep.memory.toRoom && Memory.roomData) {
        const bestRoom = GrandStrategyPlanner.getBestRoomToClaim(creep.room, false);
        if (bestRoom) {
          creep.memory.endRoom = bestRoom;
          creep.memory.claim = bestRoom;
        }
      }
    }
    if (creep.memory.endRoom && creep.memory.endRoom !== creep.room.name) {
      TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.endRoom));
    } else if (creep.memory.endRoom && creep.memory.endRoom === creep.room.name) {
      if (creep.memory.claim && creep.memory.claim === creep.room.name) {
        ClaimControllerAction.setAction(creep);
      } else {
        ReserveControllerAction.setAction(creep);
      }
    }
    if (!creep.memory.endRoom) {
      const travelerRoom = GrandStrategyPlanner.findTravelerDestinationRoom(creep.room.name, null);
      if (travelerRoom) {
        TravelingAction.setAction(creep, new RoomPosition(25, 25, travelerRoom));
      }
    }
    creep.runAction();
  }
}
