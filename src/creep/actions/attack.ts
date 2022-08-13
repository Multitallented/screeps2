export class AttackAction {
  static KEY = "attack";

  public static run(creep: Creep): boolean {
    if (!creep.memory.target) {
      delete creep.memory.target;
      return false;
    }
    const invader: Creep | Structure = Game.getObjectById(creep.memory.target) as Creep | Structure;
    if (!invader) {
      delete creep.memory.target;
      return false;
    }
    let moved = false;
    if (!creep.pos.inRangeTo(invader, 1)) {
      let moveMessage;
      if (!creep.fatigue) {
        moveMessage = creep.moveTo(invader.pos, { reusePath: 999, maxRooms: 1 });
      } else {
        moveMessage = ERR_TIRED;
      }
      if (moveMessage === ERR_NO_PATH) {
        return false;
      } else if (moveMessage === OK) {
        moved = true;
      }
    }
    creep.attack(invader);
    if (!moved) {
      creep.moveTo(invader.pos);
    }
    return true;
  }

  public static setAction(creep: Creep, invader: Creep | Structure | PowerCreep): void {
    creep.memory.target = invader.id;
    creep.memory.action = AttackAction.KEY;
    if (Memory.debug) {
      creep.say("✘ attack");
    }
  }
}
