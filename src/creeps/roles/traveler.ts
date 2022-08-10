import { CreepRoleEnum } from "./creep-role-enum";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";
import { LeaveRoomAction } from "../actions/leave-room";
import { MineEnergyAction } from "../actions/mine-energy";
import { RecycleAction } from "../actions/recycle";
import { TransferAction } from "../actions/transfer";
import { TravelingAction } from "../actions/traveling";
import { WithdrawAction } from "../actions/withdraw";

export class Traveler {
  static KEY: CreepRoleEnum = CreepRoleEnum.TRAVELER;

  public static setAction(creep: Creep): void {
    let destinationRoomName: string | null;
    switch (creep.memory.action) {
      case TravelingAction.KEY:
      case LeaveRoomAction.KEY:
        if (!creep.memory.endRoom) {
          creep.memory.endRoom = creep.memory.homeRoom;
        }
        if (creep.room.name !== creep.memory.endRoom) {
          if (creep.room.controller && creep.room.controller.my && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
            creep.deliverEnergyToSpawner(true);
          } else if (creep.memory.endRoom) {
            TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.endRoom));
          } else {
            creep.setNextAction();
            return;
          }
        } else {
          // If the creep has reached the endRoom...
          if (creep.room.controller && creep.room.controller.my) {
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
              creep.deliverEnergyToSpawner(true);
            } else {
              creep.memory.homeRoom = creep.room.name;
              const travelRoom = GrandStrategyPlanner.findTravelerDestinationRoom(creep.room.name, creep);
              if (!travelRoom) {
                creep.room.reassignIdleCreep(creep, true);
              } else {
                if (travelRoom === creep.room.name) {
                  creep.memory.homeRoom = creep.room.name;
                  delete creep.memory.endRoom;
                  delete creep.memory.travel;
                  Traveler.getNextRoom(creep);
                  if (!creep.memory.travel) {
                    creep.room.reassignIdleCreep(creep, true);
                  }
                } else {
                  TravelingAction.setAction(creep, new RoomPosition(25, 25, travelRoom));
                }
              }
            }
          } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && creep.room.find(FIND_SOURCES).length > 0) {
            creep.goGetEnergy(true, false);
          } else {
            if (creep.room.name === creep.memory.homeRoom) {
              Traveler.getNextRoom(creep);
            } else if (creep.memory.homeRoom) {
              TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.homeRoom));
            }
          }
        }
        break;
      case WithdrawAction.KEY:
      case MineEnergyAction.KEY:
        destinationRoomName = GrandStrategyPlanner.findNewTravelerHomeRoom(creep);
        creep.memory.endRoom = destinationRoomName == null ? creep.memory.homeRoom : destinationRoomName;
        if (creep.memory.endRoom) {
          TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.endRoom));
        } else {
          creep.setNextAction();
          return;
        }
        break;
      case TransferAction.KEY:
      default:
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          if (creep.room.controller && creep.room.controller.my) {
            creep.deliverEnergyToSpawner(true);
          } else if (creep.memory.homeRoom) {
            TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.homeRoom));
          } else {
            const newHomeRoom = GrandStrategyPlanner.findNewTravelerHomeRoom(creep);
            creep.memory.homeRoom = newHomeRoom ? newHomeRoom : creep.room.name;
            creep.setNextAction();
          }
        } else {
          Traveler.getNextRoom(creep);
          if (!creep.memory.travel) {
            RecycleAction.setAction(creep);
          }
        }
        break;
    }
    creep.runAction();
  }

  public static getNextRoom(creep: Creep): void {
    const helpRoom = GrandStrategyPlanner.findTravelerDestinationRoom(creep.room.name, creep);
    if (!helpRoom) {
      // creep.room.reassignIdleCreep(creep);
      if (creep.memory.homeRoom && creep.memory.homeRoom !== creep.room.name) {
        creep.memory.endRoom = creep.memory.homeRoom;
        creep.memory.travel = creep.memory.endRoom;
        TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.homeRoom));
      }
      // LeaveRoomAction.setAction(creep, null);
    } else {
      creep.memory.endRoom = helpRoom;
      creep.memory.travel = creep.memory.endRoom;
      TravelingAction.setAction(creep, new RoomPosition(25, 25, helpRoom));
    }
  }
}
