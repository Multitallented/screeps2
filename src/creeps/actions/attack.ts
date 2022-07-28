export class AttackAction {
  static KEY = "attack";

  public static run(creep: Creep): void {
    if (!creep.memory.target) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    const invader: Creep | Structure = Game.getObjectById(creep.memory.target) as Creep | Structure;
    if (!invader) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(invader, 1)) {
      creep.moveToTarget();
      return;
    }
    creep.attack(invader);
    creep.moveTo(invader.pos);
  }

  public static setAction(creep: Creep, invader: Creep | Structure | PowerCreep): void {
    creep.memory.target = invader.id;
    creep.memory.action = AttackAction.KEY;
    if (Memory.debug) {
      creep.say("✘ attack");
    }
  }
}
