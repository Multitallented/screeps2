export class RepairAction {
  static KEY = "repair";

  public static run(creep: Creep): boolean {
    if (creep.store.getUsedCapacity() === 0 || !creep.memory.target) {
      delete creep.memory.target;
      return false;
    }
    const buildingNeedingRepair: Structure = Game.getObjectById(creep.memory.target) as Structure;
    if (!buildingNeedingRepair || buildingNeedingRepair.hits === buildingNeedingRepair.hitsMax) {
      delete creep.memory.target;
      return false;
    }
    if (!creep.pos.inRangeTo(buildingNeedingRepair, 3)) {
      if (!creep.fatigue) {
        creep.moveTo(buildingNeedingRepair.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.repair(buildingNeedingRepair);
    return true;
  }

  public static setAction(creep: Creep, target: Structure): void {
    creep.memory.target = target.id;
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("✍ repair");
    }
  }
}
