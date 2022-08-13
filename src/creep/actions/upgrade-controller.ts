
export class UpgradeControllerAction {
  static KEY = "upgrade-controller";

  public static run(creep: Creep): boolean {
    if (
      !creep.room.controller ||
      (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 &&
        (creep.room.controller.reservation || !creep.room.controller.my))
    ) {
      delete creep.memory.action;
      delete creep.memory.target;
      delete creep.memory.destination;
      return false;
    }
    if (!creep.memory.target || creep.memory.target !== creep.room.controller.id) {
      creep.memory.target = creep.room.controller.id;
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return false;
    }
    if (!creep.pos.inRangeTo(creep.room.controller, 3)) {
      if (!creep.fatigue) {
        creep.moveTo(creep.room.controller.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.upgradeController(creep.room.controller);
    return true;
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("⚡ upgrade");
    }
  }
}
