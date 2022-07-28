export class ReserveControllerAction {
  static KEY = "reserve-controller";

  public static run(creep: Creep): void {
    const claimedRoom = creep.room.controller && creep.room.controller.my;
    const claimUnnecessary =
      creep.room &&
      creep.room.controller &&
      creep.room.controller.reservation &&
      creep.room.controller.reservation.ticksToEnd > 3000;
    if (claimedRoom || claimUnnecessary || !creep.room.controller) {
      creep.setNextAction();
      return;
    }
    creep.memory.target = creep.room.controller.id;
    if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
      creep.moveToTarget();
      return;
    }
    creep.reserveController(creep.room.controller);
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("® reserve");
    }
  }
}
