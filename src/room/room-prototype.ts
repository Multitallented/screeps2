import _ from "lodash";
import { Util } from "../utils/util";

const getNumberOfMiningSpacesAtSource = function (this: Room, sourceId: Id<Source>): number {
  const roomData = Memory.roomData[this.name];
  if (roomData.sources && roomData.sources.qty && roomData.sources.sources) {
    return roomData.sources.sources[sourceId] as number;
  }
  const sourceMap = this.findNumberOfSourcesAndSpaces();
  if (sourceMap && sourceMap.sources) {
    const spots = sourceMap.sources[sourceId] as number;
    if (spots) {
      return spots;
    } else {
      return 0;
    }
  }
  return 0;
};

const getTotalNumberOfMiningSpaces = function (this: Room): number {
  const sourceMap = this.findNumberOfSourcesAndSpaces();
  if (sourceMap && sourceMap.spots) {
    return sourceMap.spots;
  }
  return 0;
};

const findNumberOfSourcesAndSpaces = function (this: Room): SourceMemory {
  let numberSources = 0;
  let numberSpaces = 0;
  const sourceSpacesMap = {} as Map<string, number>;
  _.forEach(this.find(FIND_SOURCES), (source: Source) => {
    numberSources++;
    const availablePositions = {} as Map<string, boolean>;
    for (let x = source.pos.x - 1; x < source.pos.x + 2; x++) {
      for (let y = source.pos.y - 1; y < source.pos.y + 2; y++) {
        if (!(x < 0 || x > 49 || y < 0 || x > 49)) {
          availablePositions[Util.getRoomPositionKey(x, y)] = true;
        }
      }
    }
    _.forEach(
      this.lookAtArea(source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true),
      (lookupObject: LookAtResultWithPos) => {
        if (
          (lookupObject.type === "structure" &&
            lookupObject.structure &&
            lookupObject.structure.structureType !== STRUCTURE_ROAD &&
            lookupObject.structure.structureType !== STRUCTURE_CONTAINER &&
            lookupObject.structure.structureType !== STRUCTURE_RAMPART) ||
          (lookupObject.type === "terrain" && lookupObject.terrain !== "swamp" && lookupObject.terrain !== "plain")
        ) {
          delete availablePositions[Util.getRoomPositionKey(lookupObject.x, lookupObject.y)];
        }
      }
    );
    const spacesAtThisSource = Object.keys(availablePositions).length;
    numberSpaces += spacesAtThisSource;
    sourceSpacesMap[source.id] = spacesAtThisSource;
  });
  return {
    qty: numberSources,
    spots: numberSpaces,
    sources: sourceSpacesMap
  };
};

const isSpotOpen = function (this: Room, pos: RoomPosition): boolean {
  let isThisSpotOpen = true;
  _.forEach(Game.rooms[pos.roomName].lookAt(pos), (s: LookAtResultWithPos) => {
    if (this.isOpen(s)) {
      isThisSpotOpen = false;
    }
  });
  return isThisSpotOpen;
};
const isOpen = function (s: LookAtResultWithPos): boolean {
  return !((s.type !== "terrain" || s.terrain !== "wall") && s.type !== "structure" && s.type !== "constructionSite");
};

const getAdjacentRoomName = function (this: Room, direction: ExitConstant): string {
  const isWest = this.name.indexOf("W") !== -1;
  const isNorth = this.name.indexOf("N") !== -1;
  const splitName = this.name.slice(1).split(isNorth ? "N" : "S");
  const x = Number(splitName[0]);
  const y = Number(splitName[1]);

  return Util.getRoomKey(direction, isWest, isNorth, x, y);
};

const getEnergyInStorage = function (this: Room): number {
  let energy = 0;
  _.forEach(
    this.find(FIND_STRUCTURES, {
      filter: (s: Structure) => {
        return s.structureType === STRUCTURE_STORAGE || s.structureType === STRUCTURE_CONTAINER;
      }
    }),
    (s: StructureStorage | StructureContainer) => {
      energy += s.store.energy;
    }
  );
  return energy;
};

declare global {
  interface Room {
    getNumberOfMiningSpacesAtSource(sourceId: Id<Source>): number;
    getTotalNumberOfMiningSpaces(): number;
    findNumberOfSourcesAndSpaces(): SourceMemory;
    isSpotOpen(pos: RoomPosition): boolean;
    isOpen(s: LookAtResultWithPos): boolean;
    getAdjacentRoomName(direction: ExitConstant): string;
    getEnergyInStorage(): number;
  }
}

export class RoomPrototype {
  public static init() {
    Room.prototype.getNumberOfMiningSpacesAtSource = getNumberOfMiningSpacesAtSource;
    Room.prototype.getTotalNumberOfMiningSpaces = getTotalNumberOfMiningSpaces;
    Room.prototype.findNumberOfSourcesAndSpaces = findNumberOfSourcesAndSpaces;
    Room.prototype.isSpotOpen = isSpotOpen;
    Room.prototype.isOpen = isOpen;
    Room.prototype.getAdjacentRoomName = getAdjacentRoomName;
    Room.prototype.getEnergyInStorage = getEnergyInStorage;
  }
}
