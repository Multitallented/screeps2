import { Util } from "../utils/util";
import _ from "lodash";

export class RoomController {
  public static run(): void {
    _.forEach(Game.rooms, (room: Room) => {
      this.initSitesArrays(room);
      const roomData = Util.getRoomData(room.name);
      if (!roomData.sources) {
        const sources = room.find(FIND_SOURCES);
        roomData.sources = {
          sources: {} as Map<string, number>,
          qty: sources.length,
          spots: sources.length
        };
        let totalSourceSpots = 0;
        _.forEach(sources, (source: Source) => {
          const currentNumberOfSpots = room.getNumberOfMiningSpacesAtSource(source.id);
          totalSourceSpots += currentNumberOfSpots;
          roomData.sources.sources[source.id] = Math.max(1, currentNumberOfSpots);
        });
        if (roomData.sources) {
          roomData.sources.spots = totalSourceSpots;
        }
        return;
      }
      if (!room.memory.center) {
        this.findCenterAndRadius(room);
      }
      if (room.memory.sourceContainers === undefined) {
        this.placeSourceContainers(room);
      }
      // TODO plan exit roads
      // TODO plan source roads
      // TODO plan spawns / power spawns
      // TODO plan storage / power bank
      // TODO plan terminal / lab / factory
      // TODO plan observer / nuker (level 8)
      // TODO plan links/containers
      // TODO plan extensions
    });
  }

  public static placeSourceContainers(room: Room): void {
    room.memory.sourceContainers = [];
    _.forEach(room.find(FIND_SOURCES), (source: Source) => {
      const sourceContainerPos = this.getFirstOpenAdjacentSpot(source.pos);
      if (sourceContainerPos && room.memory.sourceContainers) {
        const key = Util.getRoomPositionKey(sourceContainerPos.x, sourceContainerPos.y);
        (<Map<string, StructureConstant>>(<Map<number, Map<string, StructureConstant>>>room.memory.sites)[0])[key] =
          STRUCTURE_CONTAINER;
        (<Map<string, StructureConstant>>room.memory.ramparts)[key] = STRUCTURE_RAMPART;
        room.memory.sourceContainers.push(sourceContainerPos);
      }
    });
  }

  public static findCenterAndRadius(room: Room): void {
    let highestX = 0;
    let lowestX = 50;
    let highestY = 0;
    let lowestY = 0;
    _.forEach(room.find(FIND_SOURCES), (source: Source) => {
      if (highestX < source.pos.x) {
        highestX = source.pos.x;
      }
      if (highestY < source.pos.y) {
        highestY = source.pos.y;
      }
      if (lowestX > source.pos.x) {
        lowestX = source.pos.x;
      }
      if (lowestY > source.pos.y) {
        lowestY = source.pos.y;
      }
    });
    if (room.controller) {
      if (highestX < room.controller.pos.x) {
        highestX = room.controller.pos.x;
      }
      if (highestY < room.controller.pos.y) {
        highestY = room.controller.pos.y;
      }
      if (lowestX > room.controller.pos.x) {
        lowestX = room.controller.pos.x;
      }
      if (lowestY > room.controller.pos.y) {
        lowestY = room.controller.pos.y;
      }
    }
    let center: RoomPosition | null = new RoomPosition(
      Math.round((highestX + lowestX) / 2),
      Math.round((highestY + lowestY) / 2),
      room.name
    );
    center = this.getFirstOpenAdjacentSpot(center);
    if (!center) {
      center = new RoomPosition(25, 25, room.name);
    }
    room.memory.center = center;
    const xRadius = Math.max(Math.abs(center.x - highestX), Math.abs(center.x - lowestX));
    const yRadius = Math.max(Math.abs(center.y - highestY), Math.abs(center.y - lowestY));
    const radius = 4 + Math.max(xRadius, yRadius);
    room.memory.radius = radius;
  }

  public static initSitesArrays(room: Room): void {
    if (!room.memory.sites || Object.keys(room.memory.sites).length < 1) {
      room.memory.sites = {} as Map<number, Map<string, StructureConstant>>;
      room.memory.sites[0] = {} as Map<string, StructureConstant>;
      room.memory.sites[1] = {} as Map<string, StructureConstant>;
      room.memory.sites[2] = {} as Map<string, StructureConstant>;
      room.memory.sites[3] = {} as Map<string, StructureConstant>;
      room.memory.sites[4] = {} as Map<string, StructureConstant>;
      room.memory.sites[5] = {} as Map<string, StructureConstant>;
      room.memory.sites[6] = {} as Map<string, StructureConstant>;
      room.memory.sites[7] = {} as Map<string, StructureConstant>;
      room.memory.sites[8] = {} as Map<string, StructureConstant>;
    }
    if (!room.memory.ramparts) {
      room.memory.ramparts = {} as Map<string, StructureConstant>;
    }
  }

  private static getFirstOpenAdjacentSpot(pos: RoomPosition): RoomPosition | null {
    const positionMap = {};
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        positionMap[Util.getRoomPositionKey(pos.x + i, pos.y + j)] = new RoomPosition(
          pos.x + i,
          pos.y + j,
          pos.roomName
        );
      }
    }
    _.forEach(
      Game.rooms[pos.roomName].lookAtArea(pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true),
      (s: LookAtResultWithPos) => {
        if (!positionMap[Util.getRoomPositionKey(s.x, s.y)]) {
          return;
        }
        if (this.hasPlannedStructureAt(new RoomPosition(s.x, s.y, pos.roomName), false)) {
          delete positionMap[Util.getRoomPositionKey(s.x, s.y)];
          return;
        }
        const room = Game.rooms[pos.roomName];
        if (room.isOpen(s)) {
          delete positionMap[Util.getRoomPositionKey(s.x, s.y)];
        }
      }
    );
    for (const key in positionMap) {
      if (key && positionMap[key]) {
        return <RoomPosition>positionMap[key];
      }
    }
    return null;
  }

  public static hasPlannedStructureAt(roomPosition: RoomPosition, ignoreRoads: boolean): boolean {
    const room = Game.rooms[roomPosition.roomName];
    if (!room.memory.sites) {
      return false;
    }
    for (let i = 0; i < 9; i++) {
      const key = Util.getRoomPositionKey(roomPosition.x, roomPosition.y);
      if (room.memory.sites[i] && (room.memory.sites[i] as Map<string, StructureConstant>)[key]) {
        if (!ignoreRoads || (room.memory.sites[i] as Map<string, StructureConstant>)[key] !== "road") {
          return true;
        }
      }
    }
    return false;
  }
}
