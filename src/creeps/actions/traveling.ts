import { LeaveRoomAction } from "./leave-room";

export class TravelingAction {
  static KEY = "traveling";

  public static run(creep: Creep): void {
    LeaveRoomAction.moveIntoRoom(creep);
    if (creep.fatigue > 0) {
      return;
    }
    if (!creep.memory.endRoom) {
      delete creep.memory.destination;
      delete creep.memory.toRoom;
      creep.setNextAction();
      return;
    }
    if (creep.memory.endRoom === creep.room.name) {
      delete creep.memory.destination;
      delete creep.memory.toRoom;
      creep.setNextAction();
      return;
    }
    if (!creep.memory.toRoom || !creep.memory.fromRoom || creep.memory.fromRoom !== creep.room.name) {
      creep.memory.fromRoom = creep.room.name;
      const route: Array<{ exit: ExitConstant; room: string }> | ERR_NO_PATH = Game.map.findRoute(
        creep.room,
        creep.memory.endRoom
      );
      if (route !== ERR_NO_PATH && route.length) {
        creep.memory.toRoom = route[0].room;
        creep.memory.destination = <RoomPosition>creep.pos.findClosestByPath(route[0].exit);
        creep.moveToTarget();
      } else {
        delete creep.memory.destination;
        delete creep.memory.toRoom;
        creep.setNextAction();
      }
      return;
    }
    if (!creep.memory.destination && creep.memory.toRoom) {
      creep.memory.fromRoom = creep.room.name;
      const exitDirection = creep.room.findExitTo(creep.memory.toRoom);
      if (!creep.room.memory.exits) {
        delete creep.room.memory.exits;
        return;
      }
      if (exitDirection && creep.room.memory.exits[exitDirection]) {
        creep.memory.destination = <RoomPosition>creep.pos.findClosestByPath(<ExitConstant>exitDirection);
      } else {
        delete creep.memory.destination;
        delete creep.memory.toRoom;
        creep.setNextAction();
        return;
      }
    }
    creep.moveToTarget();
  }

  public static setAction(creep: Creep, pos: RoomPosition): void {
    creep.memory.fromRoom = creep.room.name;
    creep.memory.endRoom = pos.roomName;
    const route: Array<{ exit: ExitConstant; room: string }> | ERR_NO_PATH = Game.map.findRoute(
      creep.room,
      pos.roomName
    );
    if (route !== ERR_NO_PATH && route.length) {
      creep.memory.toRoom = route[0].room;
      creep.memory.destination = <RoomPosition>creep.pos.findClosestByPath(route[0].exit);
      creep.moveToTarget();
    }
    creep.memory.action = TravelingAction.KEY;
    creep.say("✈ traveling");
  }
}
