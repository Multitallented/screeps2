export class Util {
  public static getRoomPositionKey(x: number, y: number): string {
    return <string>(<unknown>x) + ":" + <string>(<unknown>y);
  }

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

  public static getConstructionKey(roomName: string, structureType: StructureConstant, x: number, y: number): string {
    return (
      roomName + " " + <string>(<unknown>structureType) + ": " + <string>(<unknown>x) + "x " + <string>(<unknown>y)
    );
  }
}
