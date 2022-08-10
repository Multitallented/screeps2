export class RecycleAction {
  static KEY = "recycle";

  public static run(creep: Creep): void {
    if (!creep.room.controller || !creep.room.controller.my) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    let spawn: StructureSpawn | null;
    if (!creep.memory.target) {
      const spawns = creep.room.find(FIND_MY_SPAWNS);
      if (spawns.length < 1) {
        delete creep.memory.target;
        creep.setNextAction();
        return;
      }
      spawn = spawns[0];
      creep.memory.target = spawn.id;
    } else {
      spawn = <StructureSpawn>Game.getObjectById(creep.memory.target);
    }
    if (!spawn) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(spawn, 1)) {
      creep.moveToTarget();
      return;
    }
    spawn.recycleCreep(creep);
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = RecycleAction.KEY;
    if (Memory.debug) {
      creep.say("♻ recycle");
    }
  }
}
