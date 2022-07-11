export class BuildAction {
  static KEY = "build";

  public static run(creep: Creep): void {
    if (creep.store.getUsedCapacity() === 0 || !creep.memory.target) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    const constructionSite: ConstructionSite = <ConstructionSite>Game.getObjectById(creep.memory.target);
    if (!constructionSite || (!constructionSite.progress && !constructionSite.progressTotal)) {
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(constructionSite, 3)) {
      creep.moveToTarget();
      return;
    }
    creep.build(constructionSite);
  }

  public static setAction(creep: Creep, target: ConstructionSite): void {
    creep.memory.target = target.id;
    creep.memory.action = this.KEY;
    creep.say("✍ build");
  }
}
