export class PickupAction {
  static KEY = "pickup";

  public static run(creep: Creep): boolean {
    if (!creep.memory.target) {
      return false;
    }
    const targetResource: Resource = Game.getObjectById(creep.memory.target) as Resource;
    if (!targetResource || creep.store.getFreeCapacity(targetResource.resourceType) < 1) {
      delete creep.memory.target;
      return false;
    }
    if (!creep.pos.inRangeTo(targetResource, 1)) {
      if (!creep.fatigue) {
        creep.moveTo(targetResource.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.pickup(targetResource);
    return true;
  }

  public static setAction(creep: Creep, resource: Resource): void {
    creep.memory.target = resource.id;
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("⚡ pickup");
    }
  }
}
