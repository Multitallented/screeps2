export class PickupAction {
  static KEY = "pickup";

  public static run(creep: Creep): void {
    if (!creep.memory.target) {
      creep.setNextAction();
      return;
    }
    const targetResource: Resource = Game.getObjectById(creep.memory.target) as Resource;
    if (!targetResource || creep.store.getFreeCapacity(targetResource.resourceType) < 1) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(targetResource, 1)) {
      creep.moveToTarget();
      return;
    }
    creep.pickup(targetResource);
  }

  public static setAction(creep: Creep, resource: Resource): void {
    creep.memory.target = resource.id;
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("⚡ pickup");
    }
  }
}
