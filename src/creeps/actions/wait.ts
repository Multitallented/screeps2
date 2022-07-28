export class WaitAction {
  static KEY = "wait";
  private static readonly RESERVED = "reserved";
  private static readonly WAITING = "waiting";
  public static run(creep: Creep): void {
    if (
      creep.memory.wait === WaitAction.RESERVED &&
      creep.room.controller &&
      ((creep.room.controller.reservation && creep.room.controller.reservation.username === Memory.username) ||
        creep.room.controller.my)
    ) {
      delete creep.memory.wait;
      creep.setNextAction();
    } else if (creep.memory.wait) {
      creep.setNextAction();
    }
  }

  public static setActionUntilReserved(creep: Creep): void {
    creep.memory.action = "wait";
    creep.memory.wait = WaitAction.RESERVED;
    if (Memory.debug) {
      creep.say("🕙 reserved");
    }
  }

  public static setActionUntilNextTick(creep: Creep): void {
    creep.memory.action = "wait";
    creep.memory.wait = WaitAction.WAITING;
    if (Memory.debug) {
      creep.say("🕙 idle");
    }
  }

  public static setActionPermenantly(creep: Creep): void {
    delete creep.memory.wait;
    creep.memory.action = "wait";
    if (Memory.debug) {
      creep.say("Zz sleep");
    }
  }
}
