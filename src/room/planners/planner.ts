import * as _ from "lodash";
import { Util } from "../../utils/util";

export class Planner {
  public populateSourcesMemory(room: Room): boolean {
    if (!room.memory.sources || !Memory.roomData || !Memory.roomData[room.name]) {
      room.memory.sources = { sources: new Map<string, number>() } as SourceMemory;
      const sources = room.find(FIND_SOURCES);
      if (!Memory.roomData) {
        Memory.roomData = new Map<string, GlobalRoomMemory>();
      }
      if (!Memory.roomData[room.name]) {
        Memory.roomData[room.name] = {};
      }
      (Memory.roomData[room.name] as GlobalRoomMemory).sources = {
        sources: new Map<string, number>(),
        qty: sources.length
      };
      let totalSourceSpots = 0;
      _.forEach(sources, (source: Source) => {
        const currentNumberOfSpots = room.getNumberOfMiningSpacesAtSource(source.id);
        totalSourceSpots += currentNumberOfSpots;
        if (!room.memory.sources) {
          room.memory.sources = {} as SourceMemory;
        }
        if (!room.memory.sources.sources) {
          room.memory.sources.sources = new Map<string, number>();
        }
        room.memory.sources.sources[source.id] = currentNumberOfSpots;
      });
      if (Memory.roomData.get(room.name)?.sources) {
        (Memory.roomData[room.name] as GlobalRoomMemory).sources.spots = totalSourceSpots;
      }
      return true;
    }
    if (!room.memory.sources.sources) {
      const sources = room.find(FIND_SOURCES);
      let totalSourceSpots = 0;
      _.forEach(sources, (source: Source) => {
        const currentNumberOfSpots = room.getNumberOfMiningSpacesAtSource(source.id);
        totalSourceSpots += currentNumberOfSpots;
        if (!room.memory.sources?.sources) {
          room.memory.sources = {} as SourceMemory;
        }
        room.memory.sources.sources[source.id] = currentNumberOfSpots;
      });
      (Memory.roomData[room.name] as GlobalRoomMemory).sources.spots = totalSourceSpots;
    }
    return false;
  }

  public populateContainerMemory(room: Room): boolean {
    if (!room.memory.containerStructure) {
      const sources = room.find(FIND_SOURCES);
      const containerLocationsNeeded = new Array<RoomObject>();
      let linkNumber = 5;
      _.forEach(sources, (source: Source) => {
        this.placeContainerAndLink(source.pos, linkNumber);
        linkNumber++;
        containerLocationsNeeded.push(source);
      });
      if (room.controller) {
        containerLocationsNeeded.push(room.controller);
        this.placeContainerAndLink(room.controller.pos, 5);
      }
      room.memory.center = <RoomPosition>room.getPositionAt(25, 25);
      if (containerLocationsNeeded.length) {
        room.memory.center = this.getCenterOfArray(containerLocationsNeeded, room);
      }

      const minerals: Array<Mineral> = room.find(FIND_MINERALS);
      if (minerals.length && room.memory.sites !== undefined && room.memory.sites.get(6) !== undefined) {
        (room.memory.sites.get(6) as Map<string, StructureConstant>).set(
          <string>(<unknown>minerals[0].pos.x) + ":" + <string>(<unknown>minerals[0].pos.y),
          STRUCTURE_EXTRACTOR
        );
      }
      room.memory.containerStructure = true;
      return true;
    }
    return false;
  }

  public placeContainerAndLink(pos: RoomPosition, linkNumber: number): void {
    const room: Room = Game.rooms[pos.roomName];
    if (!room || room.memory.sites === undefined) {
      return;
    }
    const positionMap = new Map<string, RoomPosition>();
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        positionMap[Util.getRoomPositionKey(pos.x + i, pos.y + j)] = new RoomPosition(
          pos.x + i,
          pos.y + j,
          pos.roomName
        );
      }
    }
    let containerPos: RoomPosition | undefined;
    let linkPos: RoomPosition | undefined;
    _.forEach(room.lookAtArea(pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true), (s: LookAtResultWithPos) => {
      if (!positionMap[Util.getRoomPositionKey(s.x, s.y)]) {
        return;
      }
      if (s.type === "structure" && (<AllLookAtTypes>(<unknown>s)).structure.structureType === STRUCTURE_CONTAINER) {
        containerPos = new RoomPosition(s.x, s.y, room.name);
        delete positionMap[<string>(<unknown>s.x) + ":" + <string>(<unknown>s.y)];
        return;
      }
      if (s.type === "structure" && (<AllLookAtTypes>(<unknown>s)).structure.structureType === STRUCTURE_LINK) {
        linkPos = new RoomPosition(s.x, s.y, room.name);
        delete positionMap[Util.getRoomPositionKey(s.x, s.y)];
        return;
      }
      if (room.isOpen(s)) {
        delete positionMap[Util.getRoomPositionKey(s.x, s.y)];
      }
    });
    if (containerPos !== null && containerPos instanceof RoomPosition) {
      (room.memory.sites[0] as Map<string, StructureConstant>)[
        Util.getRoomPositionKey(containerPos.x, containerPos.y)
      ] = STRUCTURE_CONTAINER;
    }
    if (linkPos) {
      (room.memory.sites[5] as Map<string, StructureConstant>)[Util.getRoomPositionKey(linkPos.x, linkPos.y)] =
        STRUCTURE_LINK;
    }
    if (containerPos && linkPos) {
      return;
    }
    for (const key in positionMap) {
      if (key && positionMap[key]) {
        const pos: RoomPosition = <RoomPosition>positionMap[key];
        if (!containerPos) {
          containerPos = pos;
          (room.memory.sites[0] as Map<string, StructureConstant>)[key] = STRUCTURE_CONTAINER;
        } else if (!linkPos) {
          linkPos = pos;
          (room.memory.sites[linkNumber] as Map<string, StructureConstant>)[key] = STRUCTURE_LINK;
        }
      }
    }
    if (!linkPos && containerPos) {
      const nextAvailablePosition = this.getFirstOpenAdjacentSpot(containerPos);
      if (nextAvailablePosition) {
        linkPos = nextAvailablePosition;
        (room.memory.sites[linkNumber] as Map<string, StructureConstant>)[
          Util.getRoomPositionKey(linkPos.x, linkPos.y)
        ] = STRUCTURE_LINK;
      }
    }
  }

  private getFirstOpenAdjacentSpot(pos: RoomPosition): RoomPosition | null {
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
        if (Planner.hasPlannedStructureAt(new RoomPosition(s.x, s.y, pos.roomName), false)) {
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

  public getCenterOfArray(roomObjects: Array<RoomObject>, room: Room): RoomPosition {
    let maxX = 50;
    let minX = 0;
    let maxY = 50;
    let minY = 0;
    const roomName = room.name;
    _.forEach(roomObjects, (entity: RoomObject) => {
      if (!entity || !entity.pos) {
        return;
      }
      maxX = entity.pos.x > maxX ? entity.pos.x : maxX;
      minX = entity.pos.x < minX ? entity.pos.x : minX;
      maxY = entity.pos.y > maxY ? entity.pos.y : maxY;
      minY = entity.pos.y < minY ? entity.pos.y : minY;
    });
    const x = Math.round(minX + Math.floor(Math.abs(maxX - minX) / 2));
    const y = Math.round(minY + Math.floor(Math.abs(maxY - minY) / 2));
    return new RoomPosition(x, y, roomName);
  }
}
