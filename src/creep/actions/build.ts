export class BuildAction {
  static KEY = "build";

  public static run(creep: Creep): boolean {
    if (creep.store.getUsedCapacity() === 0 || !creep.memory.target) {
      delete creep.memory.target;
      return false;
    }
    const constructionSite: ConstructionSite = <ConstructionSite>Game.getObjectById(creep.memory.target);
    if (!constructionSite || (!constructionSite.progress && !constructionSite.progressTotal)) {
      return false;
    }
    if (!creep.pos.inRangeTo(constructionSite, 3)) {
      if (!creep.fatigue) {
        creep.moveTo(constructionSite.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.build(constructionSite);
    return true;
  }

  public static setAction(creep: Creep, target: ConstructionSite): void {
    creep.memory.target = target.id;
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("✍ build");
    }
  }
}
