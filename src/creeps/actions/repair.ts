export class RepairAction {
  static KEY = "repair";

  public static run(creep: Creep): void {
    if (creep.store.getUsedCapacity() === 0 || !creep.memory.target) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    const buildingNeedingRepair: Structure = Game.getObjectById(creep.memory.target) as Structure;
    if (!buildingNeedingRepair || buildingNeedingRepair.hits === buildingNeedingRepair.hitsMax) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(buildingNeedingRepair, 3)) {
      creep.moveToTarget();
      return;
    }
    creep.repair(buildingNeedingRepair);
  }

  public static setAction(creep: Creep, target: Structure): void {
    creep.memory.target = target.id;
    creep.memory.action = this.KEY;
    creep.say("✍ repair");
  }
}
