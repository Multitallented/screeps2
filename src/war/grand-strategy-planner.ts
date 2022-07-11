import * as _ from "lodash";

export class GrandStrategyPlanner {
  public static getBestRoomToClaim(room: Room, reserve: boolean): string | null {
    let mostSources = 0;
    let mostSpots = 0;
    let bestRoom: string | null = null;
    _.forEach(Memory.roomData, (roomData: GlobalRoomMemory | undefined, key) => {
      if (!key || !Memory.username) {
        return;
      }
      const currentRoom: Room = Game.rooms[key];
      if (!currentRoom || !currentRoom.controller || currentRoom.controller.my) {
        return;
      }
      if (currentRoom && reserve && GrandStrategyPlanner.canReserve(Memory.username, currentRoom)) {
        return;
      }
      if (room && GrandStrategyPlanner.getDistanceBetweenTwoRooms(room.name, key) > 3) {
        return;
      }
      let numberOfSources = 0;
      let numberOfSpots = 0;
      const rData: GlobalRoomMemory | undefined = Memory.roomData.get(key);
      if (rData !== undefined && rData.sources) {
        numberOfSources = rData.sources.qty ? rData.sources.qty : 0;
        numberOfSpots = rData.sources.spots ? rData.sources.spots : 0;
      }

      if (numberOfSources > mostSources || (numberOfSources === mostSources && mostSpots > numberOfSpots)) {
        bestRoom = key;
        mostSpots = numberOfSpots;
        mostSources = numberOfSources;
      }
    });
    return bestRoom;
  }

  public static canClaimAnyRoom(): boolean {
    const numberOfOwnedRooms = _.filter(Game.rooms, r => {
      return r.controller && r.controller.my;
    }).length;
    return Game.gcl.level > numberOfOwnedRooms;
  }

  public static canReserve(username: string, room: Room): boolean {
    return <boolean>(
      (room.controller &&
        (!room.controller.reservation || room.controller.reservation.username === username) &&
        !room.controller.my &&
        !room.controller.owner)
    );
  }

  public static findNewTravelerHomeRoom(creep: Creep): string | null {
    let helpRoom: string | null = null;
    let leastEnergy = 99999;
    _.forEach(Game.rooms, (room: Room) => {
      if (room.name === creep.memory.endRoom) {
        return;
      }
      if (!room.controller || !room.controller.my) {
        return;
      }
      if (this.getDistanceBetweenTwoRooms(room.name, creep.room.name) > 4) {
        return;
      }
      if (leastEnergy > room.energyAvailable) {
        leastEnergy = room.energyAvailable;
        helpRoom = room.name;
      }
    });
    return helpRoom;
  }

  public static findTravelerDestinationRoom(creep: Creep): string | null {
    let helpRoom: string | null = null;
    let helpReallyNeeded = false;
    let emergencyHelpNeeded = false;
    _.forEach(Game.rooms, (room: Room) => {
      if (room.name === creep.memory.endRoom) {
        return;
      }
      let numberOfSpots = 0;
      const numberOfCreeps = room.find(FIND_MY_CREEPS).length;
      if (room.memory.sources && room.memory.sources.sources) {
        _.forEach(room.memory.sources.sources, sourceNumber => {
          numberOfSpots += sourceNumber;
        });
      }
      if (numberOfCreeps - 4 < Math.max(2, numberOfSpots) && room.controller && room.controller.my) {
        emergencyHelpNeeded = true;
        helpRoom = room.name;
      }
      const roomDistance = GrandStrategyPlanner.getDistanceBetweenTwoRooms(room.name, creep.room.name);
      if (roomDistance > 1) {
        return;
      }
      if (
        (room.controller && room.controller.reservation && room.controller.reservation.username === Memory.username) ||
        room.memory.sendBuilders
      ) {
        if (!emergencyHelpNeeded && numberOfCreeps - 1 < Math.max(2, numberOfSpots)) {
          helpReallyNeeded = true;
          helpRoom = room.name;
        } else if (!emergencyHelpNeeded && !helpReallyNeeded && numberOfCreeps - 4 < Math.max(2, numberOfSpots)) {
          helpRoom = room.name;
        } else if (!emergencyHelpNeeded && !helpReallyNeeded && (!room.controller || !room.controller.my)) {
          helpRoom = room.name;
        }
      }
    });
    return helpRoom;
  }

  public static getDistanceBetweenTwoRooms(room1Name: string, room2Name: string): number {
    const is1West = room1Name.indexOf("W") !== -1;
    const is1North = room1Name.indexOf("N") !== -1;
    const split1Name = room1Name.slice(1).split(is1North ? "N" : "S");
    const x1 = Number(split1Name[0]);
    const y1 = Number(split1Name[1]);

    const is2West = room2Name.indexOf("W") !== -1;
    const is2North = room2Name.indexOf("N") !== -1;
    const split2Name = room2Name.slice(1).split(is2North ? "N" : "S");
    const x2 = Number(split2Name[0]);
    const y2 = Number(split2Name[1]);

    const verticalDistance = Math.abs(is1West === is2West ? x1 - x2 : x1 + x2);
    const horizontalDistance = Math.abs(is1North === is2North ? y1 - y2 : y1 + y2);
    return Math.max(verticalDistance, horizontalDistance);
  }
}
