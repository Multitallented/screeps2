export class TravelingAction {
  static KEY = "traveling";

  public static run(creep: Creep): boolean {
    if (creep.pos.x === 0) {
      creep.moveTo(1, creep.pos.y);
      return true;
    } else if (creep.pos.x === 49) {
      creep.moveTo(48, creep.pos.y);
      return true;
    } else if (creep.pos.y === 0) {
      creep.moveTo(creep.pos.x, 1);
      return true;
    } else if (creep.pos.y === 49) {
      creep.moveTo(creep.pos.x, 48);
      return true;
    }
    if (creep.fatigue > 0) {
      return true;
    }
    if (creep.memory.endRoom && creep.memory.destination === null) {
      delete creep.memory.action;
      delete creep.memory.destination;
      return false;
    }
    if (!creep.memory.endRoom) {
      delete creep.memory.destination;
      delete creep.memory.toRoom;
      return false;
    }
    if (creep.memory.endRoom === creep.room.name) {
      delete creep.memory.destination;
      delete creep.memory.toRoom;
      return false;
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
        if (!creep.fatigue) {
          creep.moveTo(creep.memory.destination, { reusePath: 999, maxRooms: 1 });
        }
      } else {
        delete creep.memory.destination;
        delete creep.memory.toRoom;
        return false;
      }
      return true;
    }
    if (!creep.memory.destination && creep.memory.toRoom) {
      creep.memory.fromRoom = creep.room.name;
      const exitDirection = creep.room.findExitTo(creep.memory.toRoom);
      if (!creep.room.memory.exits) {
        delete creep.room.memory.exits;
        return false;
      }
      if (exitDirection && creep.room.memory.exits[exitDirection]) {
        creep.memory.destination = <RoomPosition>creep.pos.findClosestByPath(<ExitConstant>exitDirection);
      } else {
        delete creep.memory.destination;
        delete creep.memory.toRoom;
        return false;
      }
    }
    if (!creep.fatigue && creep.memory.destination) {
      creep.moveTo(creep.memory.destination, { reusePath: 999, maxRooms: 1 });
    }
    return true;
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
      if (!creep.fatigue) {
        creep.moveTo(creep.memory.destination, { reusePath: 999, maxRooms: 1 });
      }
    }
    creep.memory.action = TravelingAction.KEY;
    if (Memory.debug) {
      creep.say("✈ traveling");
    }
  }
}
