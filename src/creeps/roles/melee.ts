import { AttackAction } from "../actions/attack";
import { CreepRoleEnum } from "./creep-role-enum";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";
import { TravelingAction } from "../actions/traveling";

export class Melee {
  static KEY: CreepRoleEnum = CreepRoleEnum.MELEE;
  public static setAction(creep: Creep): void {
    const invader: Creep | null = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (invader) {
      AttackAction.setAction(creep, invader);
      creep.runAction();
      return;
    }
    const powerCreep: PowerCreep | null = creep.pos.findClosestByRange(FIND_HOSTILE_POWER_CREEPS);
    if (powerCreep) {
      AttackAction.setAction(creep, powerCreep);
      creep.runAction();
      return;
    }
    const invaderStructure: AnyOwnedStructure | null = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
    if (invaderStructure) {
      AttackAction.setAction(creep, invaderStructure);
      creep.runAction();
      return;
    }

    const hostileRoom = GrandStrategyPlanner.findHostileRoom(creep.room.name, creep);
    if (hostileRoom) {
      TravelingAction.setAction(creep, new RoomPosition(25, 25, hostileRoom));
      creep.runAction();
    }
  }
}
