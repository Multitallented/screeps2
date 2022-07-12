import {TravelingAction} from "./traveling";
import {CreepRoleEnum} from "../roles/creep-role-enum";

export class TransferAction {
  public static KEY = "transfer";

  public static run(creep: Creep): void {
    if (!creep.memory.target) {
      delete creep.memory.resourceType;
      creep.setNextAction();
      return;
    }
    let resourceType: ResourceConstant = RESOURCE_ENERGY;
    if (creep.memory.resourceType) {
      resourceType = creep.memory.resourceType;
    }
    const structure: StructureContainer | StructureLink = Game.getObjectById(creep.memory.target) as
      | StructureContainer
      | StructureLink;
    let freeCapacity: number | null = 0;
    if (structure && structure.store) {
      freeCapacity = structure.store.getFreeCapacity(resourceType);
    }
    if (freeCapacity === null || freeCapacity < 1) {
      if (
        creep.memory.homeRoom !== undefined &&
        creep.memory.role === "miner" &&
        creep.room.controller &&
        (creep.room.controller.reservation || !creep.room.controller.my)
      ) {
        creep.memory.role = CreepRoleEnum.TRAVELER;
        TravelingAction.setAction(creep, new RoomPosition(25, 25, creep.memory.homeRoom));
      }

      delete creep.memory.target;
      delete creep.memory.resourceType;
      creep.setNextAction();
      return;
    }
    let inMinerRangeOfSource = true;
    let source: _HasId | null = null;
    if (creep.memory.source && creep.memory.role === CreepRoleEnum.MINER) {
      source = Game.getObjectById(creep.memory.source);
      if (source && (source as Source).pos) {
        inMinerRangeOfSource = creep.pos.inRangeTo(source as Source, 1);
      }
    }
    if (!creep.pos.inRangeTo(structure, 1) || (!inMinerRangeOfSource && structure.structureType !== STRUCTURE_LINK)) {
      creep.moveToTarget();
      return;
    }
    creep.transfer(structure, resourceType);
    delete creep.memory.target;
    delete creep.memory.resourceType;
    creep.setNextAction();
  }

  public static setAction(creep: Creep, target: Structure, resourceType: ResourceConstant): void {
    creep.memory.action = this.KEY;
    creep.memory.target = target.id;
    creep.memory.resourceType = resourceType;
    creep.say("⚡ give");
  }
}
