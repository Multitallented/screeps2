export class MoveAction {
  static KEY = "move";

  private static setNewAction(creep: Creep) {
    delete creep.memory.target;
    delete creep.memory.destination;
  }

  public static run(creep: Creep): boolean {
    if (
      (!creep.memory.target && !creep.memory.destination) ||
      (creep.memory.destination && creep.pos.inRangeTo(creep.memory.destination, 1))
    ) {
      MoveAction.setNewAction(creep);
      return false;
    } else if (creep.memory.target) {
      const target = Game.getObjectById(creep.memory.target);
      if (
        !target ||
        !(target as unknown as RoomObject).pos ||
        creep.pos.inRangeTo((target as unknown as RoomObject).pos, 1)
      ) {
        MoveAction.setNewAction(creep);
        return false;
      }
    }
    if (!creep.fatigue && creep.memory.destination) {
      creep.moveTo(creep.memory.destination, { reusePath: 999, maxRooms: 1 });
    }
    return true;
  }

  public static setActionPos(creep: Creep, pos: RoomPosition): void {
    delete creep.memory.target;
    creep.memory.destination = pos;
    creep.memory.action = MoveAction.KEY;
    if (Memory.debug) {
      creep.say("→ move");
    }
  }
  public static setActionTarget(creep: Creep, thing: Structure | Creep): void {
    delete creep.memory.destination;
    creep.memory.target = thing.id;
    creep.memory.action = MoveAction.KEY;
    if (Memory.debug) {
      creep.say("→ move");
    }
  }
}
