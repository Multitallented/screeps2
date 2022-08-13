export class ClaimControllerAction {
  static KEY = "claim-controller";

  public static run(creep: Creep): boolean {
    const claimedRoom = creep.room.controller && creep.room.controller.my;
    if (claimedRoom || creep.room.controller === undefined) {
      return false;
    }

    creep.memory.target = creep.room.controller.id;
    if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
      if (!creep.fatigue) {
        creep.moveTo(creep.room.controller.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.claimController(creep.room.controller);
    return true;
    // const claimMessage = creep.claimController(creep.room.controller);
    // if (claimMessage === OK) {
    //   if (Memory.roomData && Memory.roomData[creep.room.name]) {
    //     delete Memory.roomData[creep.room.name];
    //     creep.room.memory.sendBuilders = true;
    //   }
    // }
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = this.KEY;
    if (Memory.debug) {
      creep.say("♔ claim");
    }
  }
}
