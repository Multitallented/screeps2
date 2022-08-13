export class TransferAction {
  public static KEY = "transfer";

  public static run(creep: Creep): boolean {
    if (!creep.memory.target) {
      delete creep.memory.resourceType;
      return false;
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
      delete creep.memory.target;
      delete creep.memory.resourceType;
      return false;
    }
    if (!creep.pos.inRangeTo(structure, 1)) {
      if (!creep.fatigue) {
        creep.moveTo(structure.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.transfer(structure, resourceType);
    delete creep.memory.target;
    delete creep.memory.resourceType;
    return true;
  }

  public static setAction(creep: Creep, target: Structure, resourceType: ResourceConstant): void {
    creep.memory.action = this.KEY;
    creep.memory.target = target.id;
    creep.memory.resourceType = resourceType;
    if (Memory.debug) {
      creep.say("⚡ give");
    }
  }
}
