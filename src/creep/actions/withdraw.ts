export class WithdrawAction {
  public static readonly KEY = "withdraw";

  public static run(creep: Creep): void {
    let resourceType: ResourceConstant = RESOURCE_ENERGY;
    if (creep.memory.resourceType) {
      resourceType = creep.memory.resourceType;
    }
    if (!creep.memory.target || creep.store.getFreeCapacity(resourceType) < 1) {
      delete creep.memory.target;
      delete creep.memory.resourceType;
      creep.setNextAction();
      return;
    }
    const container = Game.getObjectById(creep.memory.target);
    if (
      !container ||
      !(container as StructureContainer).store ||
      (container as StructureContainer).store.getUsedCapacity(resourceType) === 0
    ) {
      delete creep.memory.target;
      delete creep.memory.resourceType;
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(<Structure | Tombstone>container, 1)) {
      if (!creep.fatigue) {
        creep.moveTo((<Structure | Tombstone>container).pos, { reusePath: 999, maxRooms: 1 });
      }
      return;
    }
    creep.withdraw(
      <Structure | Tombstone>container,
      resourceType,
      Math.min(
        creep.store.getFreeCapacity(resourceType),
        (container as StructureContainer).store.getUsedCapacity(resourceType)
      )
    );
    delete creep.memory.target;
    delete creep.memory.resourceType;
    creep.setNextAction();
  }

  public static setAction(creep: Creep, target: _HasId, resourceType: ResourceConstant): void {
    creep.memory.action = this.KEY;
    creep.memory.target = target.id;
    creep.memory.resourceType = resourceType;
    if (Memory.debug) {
      creep.say("⚡ take");
    }
  }
}
