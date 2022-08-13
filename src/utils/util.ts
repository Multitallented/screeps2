import { CreepRoleEnum } from "../creep/creep-role-enum";

export class Util {
  public static getRoomKey(direction: ExitConstant, isWest: boolean, isNorth: boolean, x: number, y: number): string {
    if (direction === FIND_EXIT_TOP) {
      if (isNorth) {
        return (isWest ? "W" : "E") + <string>(<unknown>x) + "N" + <string>(<unknown>(y + 1));
      } else {
        return (isWest ? "W" : "E") + <string>(<unknown>x) + "S" + <string>(<unknown>(y - 1));
      }
    } else if (direction === FIND_EXIT_LEFT) {
      if (isWest) {
        return "W" + <string>(<unknown>(x + 1)) + (isNorth ? "N" : "S") + <string>(<unknown>y);
      } else {
        return "E" + <string>(<unknown>(x - 1)) + (isNorth ? "N" : "S") + <string>(<unknown>y);
      }
    } else if (direction === FIND_EXIT_RIGHT) {
      if (isWest) {
        return "W" + <string>(<unknown>(x - 1)) + (isNorth ? "N" : "S") + <string>(<unknown>y);
      } else {
        return "E" + <string>(<unknown>(x + 1)) + (isNorth ? "N" : "S") + <string>(<unknown>y);
      }
    } else if (direction === FIND_EXIT_BOTTOM) {
      if (isNorth) {
        return (isWest ? "W" : "E") + <string>(<unknown>x) + "N" + <string>(<unknown>(y - 1));
      } else {
        return (isWest ? "W" : "E") + <string>(<unknown>x) + "S" + <string>(<unknown>(y + 1));
      }
    }
    return "N";
  }

  public static getNeedKey(role: CreepRoleEnum, pos: RoomPosition): string {
    return role + ":" + pos.roomName + ":" + <string>(<unknown>pos.x) + ":" + <string>(<unknown>pos.y);
  }

  public static getRoomPositionKey(x: number, y: number): string {
    return <string>(<unknown>x) + ":" + <string>(<unknown>y);
  }

  public static getConstructionKey(roomName: string, structureType: StructureConstant, x: number, y: number): string {
    return (
      roomName + " " + <string>(<unknown>structureType) + ": " + <string>(<unknown>x) + "x " + <string>(<unknown>y)
    );
  }

  public static getRoomData(roomName: string): GlobalRoomMemory {
    if (!Memory.roomData[roomName]) {
      Memory.roomData[roomName] = <GlobalRoomMemory>{};
    }
    if (!(<GlobalRoomMemory>Memory.roomData[roomName]).sources) {
      const room = Game.rooms[roomName];
      if (room) {
        const sourceMem = {
          sources: {} as Map<string, number>,
          qty: 0,
          spots: 0
        };
        _.forEach(room.find(FIND_SOURCES), (s: Source) => {
          sourceMem.qty++;
          const spot = room.getNumberOfMiningSpacesAtSource(s.id);
          sourceMem.spots += spot;
          sourceMem.sources[s.id] = spot;
        });
        (<GlobalRoomMemory>Memory.roomData[roomName]).sources = sourceMem;
      }
    }
    return <GlobalRoomMemory>Memory.roomData[roomName];
  }
}
