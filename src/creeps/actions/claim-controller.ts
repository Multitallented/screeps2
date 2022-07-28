export class ClaimControllerAction {
  static KEY = "claim-controller";

  public static run(creep: Creep): void {
    const claimedRoom = creep.room.controller && creep.room.controller.my;
    if (claimedRoom || creep.room.controller === undefined) {
      creep.setNextAction();
      return;
    }

    creep.memory.target = creep.room.controller.id;
    if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
      creep.moveToTarget();
      return;
    }
    const claimMessage = creep.claimController(creep.room.controller);
    if (claimMessage === OK) {
      if (Memory.roomData && Memory.roomData[creep.room.name]) {
        delete Memory.roomData[creep.room.name];
        creep.room.memory.sendBuilders = true;
      }
    }
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("♔ claim");
    }
  }
}
