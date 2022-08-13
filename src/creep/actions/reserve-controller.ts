export class ReserveControllerAction {
  static KEY = "reserve-controller";

  public static run(creep: Creep): boolean {
    const claimedRoom = creep.room.controller && creep.room.controller.my;
    const claimUnnecessary =
      creep.room &&
      creep.room.controller &&
      creep.room.controller.reservation &&
      creep.room.controller.reservation.ticksToEnd > 3000;
    if (claimedRoom || claimUnnecessary || !creep.room.controller) {
      return false;
    }
    creep.memory.target = creep.room.controller.id;
    if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
      if (!creep.fatigue) {
        creep.moveTo(creep.room.controller.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.reserveController(creep.room.controller);
    return true;
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("® reserve");
    }
  }
}
