import * as _ from "lodash";
import { InitPlanner } from "./planners/init-planner";
import { RoomPlannerInterface } from "./planners/room-planner-interface";
import { CreepRoleEnum } from "../creeps/roles/creep-role-enum";
import { ConstructionSiteData } from "../structures/construction/construction-site-data";
import { WaitAction } from "../creeps/actions/wait";
import { Transport } from "../creeps/roles/transport";
import { Miner } from "../creeps/roles/miner";
import { MinePlanner } from "./planners/mine-planner";
import { VoidPlanner } from "./planners/void-planner";
import { Traveler } from "../creeps/roles/traveler";
import { ObjectIterator } from "lodash";
import { Util } from "../utils/util";

const getPlanner = function (room: Room): RoomPlannerInterface {
  return getPlannerByName(room, getPlannerType(room));
};

function getPlannerType(room: Room): string {
  if (room.controller && room.controller.my) {
    return "init";
  } else if (room.controller) {
    return "mine";
  } else {
    return "void";
  }
}

function getPlannerByName(room: Room, name: string): RoomPlannerInterface {
  switch (name) {
    case "mine":
      return new MinePlanner(room);
    case "init":
      return new InitPlanner(room);
    default:
      return new VoidPlanner(room);
  }
}

const findNextEnergySource = function (creep: Creep) {
  const sources = _.sortBy(creep.room.find(FIND_SOURCES_ACTIVE), function (source: Source) {
    // This might need to be faster?
    return creep.room.findPath(creep.pos, source.pos).length;
  });
  for (const source of sources) {
    const currentlyAssigned: number = creep.room.find(FIND_MY_CREEPS, {
      filter: (creep: Creep) => {
        return creep.memory.target === source.id;
      }
    }).length;
    const spaces: number = creep.room.getNumberOfMiningSpacesAtSource(source.id);
    if (currentlyAssigned < spaces) {
      return source;
    }
  }
  if (sources.length > 0) {
    return sources[0];
  }
  return null;
};

const getAdjacentRoomName = function (this: Room, direction: ExitConstant): string {
  const isWest = this.name.indexOf("W") !== -1;
  const isNorth = this.name.indexOf("N") !== -1;
  const splitName = this.name.slice(1).split(isNorth ? "N" : "S");
  const x = Number(splitName[0]);
  const y = Number(splitName[1]);

  return Util.getRoomKey(direction, isWest, isNorth, x, y);
};

const getNumberOfMiningSpacesAtSource = function (this: Room, sourceId: Id<Source>): number {
  const sourceMap = this.findNumberOfSourcesAndSpaces();
  if (sourceMap && sourceMap.sources) {
    const spots = sourceMap.sources.get(sourceId);
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

const getNumberOfSources = function (this: Room): number {
  const sourceMap = this.findNumberOfSourcesAndSpaces();
  if (sourceMap && sourceMap.qty) {
    return sourceMap.qty;
  }
  return 0;
};

const findNumberOfSourcesAndSpaces = function (this: Room): SourceMemory {
  if (this.memory.sources) {
    return this.memory.sources;
  }
  let numberSources = 0;
  let numberSpaces = 0;
  const sourceSpacesMap = new Map<string, number>();
  _.forEach(this.find(FIND_SOURCES), (source: Source) => {
    let spacesAtThisSource = 0;
    numberSources++;
    const availablePositions = new Map<string, boolean>();
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
    spacesAtThisSource += availablePositions.size;
    numberSpaces += availablePositions.size;
    sourceSpacesMap[source.id] = spacesAtThisSource;
  });
  this.memory.sources = {
    qty: numberSources,
    spots: numberSpaces,
    sources: sourceSpacesMap
  };
  return this.memory.sources;
};

const getNumberOfCreepsByRole = function (this: Room, role: CreepRoleEnum): number {
  this.creepCountArray = initCreepCountArray(this.creepCountArray, this);
  const count = this.creepCountArray.get(role);
  return count !== undefined ? count : 0;
};

function initCreepCountArray(creepCountArray: Map<CreepRoleEnum, number>, room: Room): Map<CreepRoleEnum, number> {
  if (creepCountArray === null) {
    creepCountArray = new Map();
    _.forEach(room.find(FIND_MY_CREEPS), (creep: Creep) => {
      if (creep.memory && creep.memory.role) {
        const currentRole: CreepRoleEnum = creep.memory.role;
        const count = creepCountArray.get(currentRole);
        if (count) {
          creepCountArray.set(currentRole, count + 1);
        } else {
          creepCountArray.set(currentRole, 1);
        }
      }
    });
    _.forEach(room.find(FIND_MY_SPAWNS), (spawn: StructureSpawn) => {
      if (spawn.spawning) {
        for (const creepName in CreepRoleEnum) {
          if (isNaN(Number(creepName)) && spawn.spawning.name.indexOf(creepName.toLowerCase()) !== -1) {
            const creepEnum: CreepRoleEnum = CreepRoleEnum[creepName] as CreepRoleEnum;
            const count = creepCountArray.get(creepEnum);
            if (count) {
              creepCountArray.set(creepEnum, count + 1);
            } else {
              creepCountArray.set(creepEnum, 1);
            }
          }
        }
      }
    });
  }
  return creepCountArray;
}

const reassignAllCreeps = function (this: Room, newRole: CreepRoleEnum, filter: (creep: Creep) => boolean) {
  if (this.creepCountArray == null) {
    this.getNumberOfCreepsByRole(newRole);
  }
  let creepReassigned = false;
  _.forEach(this.find(FIND_MY_CREEPS), (creep: Creep) => {
    if (!creepReassigned && filter(creep)) {
      const oldRole: CreepRoleEnum = creep.memory.role as CreepRoleEnum;
      creep.memory.role = newRole;
      delete creep.memory.action;
      delete creep.memory.target;
      delete creep.memory.fromRoom;
      delete creep.memory.originRoom;
      delete creep.memory.toRoom;
      delete creep.memory.endRoom;
      delete creep.memory.wait;
      delete creep.memory.actionSwitched;
      delete creep.memory.destination;
      creepReassigned = true;
      incrementAndDecrement(this.creepCountArray, newRole, oldRole);
    }
  });
};

const reassignSingleCreep = function (this: Room, newRole: CreepRoleEnum, filter: (creep: Creep) => boolean) {
  if (this.creepCountArray == null) {
    this.getNumberOfCreepsByRole(newRole);
  }
  let reassigned = false;
  _.forEach(this.find(FIND_MY_CREEPS), (creep: Creep) => {
    if (!reassigned && filter(creep)) {
      const oldRole: CreepRoleEnum = creep.memory.role as CreepRoleEnum;
      creep.memory.role = newRole;
      delete creep.memory.action;
      delete creep.memory.target;
      delete creep.memory.fromRoom;
      delete creep.memory.originRoom;
      delete creep.memory.toRoom;
      delete creep.memory.endRoom;
      delete creep.memory.wait;
      delete creep.memory.actionSwitched;
      delete creep.memory.destination;
      incrementAndDecrement(this.creepCountArray, newRole, oldRole);
      reassigned = true;
    }
  });
};

function incrementAndDecrement(map: Map<CreepRoleEnum, number>, increment: CreepRoleEnum, decrement: CreepRoleEnum) {
  let count = map.get(decrement);
  count = count ? count : 0;
  map.set(decrement, count - 1);
  const countInc = map.get(increment);
  if (countInc) {
    map.set(increment, countInc + 1);
  } else {
    map.set(increment, 1);
  }
}

function canPlaceRampart(pos: RoomPosition): boolean {
  let isRampartOpen = true;
  _.forEach(Game.rooms[pos.roomName].lookAt(pos), (s: LookAtResultWithPos) => {
    if (
      (s.type === "structure" && s.structure && s.structure.structureType === STRUCTURE_RAMPART) ||
      (s.type === "terrain" && s.terrain === "wall") ||
      s.type === "constructionSite"
    ) {
      isRampartOpen = false;
    }
  });
  return isRampartOpen;
}

const makeConstructionSites = function (this: Room) {
  if (this.memory.ticksTillNextConstruction) {
    this.memory.ticksTillNextConstruction -= 1;
  }
  if (!this.memory.sites || this.memory.ticksTillNextConstruction) {
    return;
  }
  this.memory.ticksTillNextConstruction = 120;
  const numberConstructionSites = this.find(FIND_MY_CONSTRUCTION_SITES).length;
  if (numberConstructionSites > 2) {
    return;
  }
  const constructionSites: Array<ConstructionSiteData> = [];
  const controllerLevel = this.controller ? this.controller.level : 0;
  for (let i = 0; i <= controllerLevel; i++) {
    if (this.memory.sites[i]) {
      _.forEach(this.memory.sites[i], ((structureType: StructureConstant, key: string) => {
        const roomPosition = new RoomPosition(+key.split(":")[0], +key.split(":")[1], this.name);
        if (this.isSpotOpen(roomPosition)) {
          constructionSites.push(new ConstructionSiteData(roomPosition, structureType));
        }
      }) as ObjectIterator<StructureConstant, string>);
    }
  }
  if (controllerLevel > 1 && this.memory.sites2 !== undefined) {
    _.forEach(this.memory.sites2, ((structureType: StructureConstant, key: string) => {
      const roomPosition = new RoomPosition(+key.split(":")[0], +key.split(":")[1], this.name);
      if (canPlaceRampart(roomPosition)) {
        constructionSites.push(new ConstructionSiteData(roomPosition, structureType));
      }
    }) as ObjectIterator<StructureConstant, string>);
  }
  if (constructionSites.length > 0) {
    ConstructionSiteData.sortByPriority(constructionSites);
    console.log(
      Util.getConstructionKey(
        constructionSites[0].pos.roomName,
        constructionSites[0].structureType,
        constructionSites[0].pos.x,
        constructionSites[0].pos.y
      )
    );
    this.createConstructionSite(constructionSites[0].pos, constructionSites[0].structureType);
    if (numberConstructionSites < 2 && constructionSites.length > 1) {
      console.log(
        Util.getConstructionKey(
          constructionSites[1].pos.roomName,
          constructionSites[1].structureType,
          constructionSites[1].pos.x,
          constructionSites[1].pos.y
        )
      );
      this.createConstructionSite(constructionSites[1].pos, constructionSites[1].structureType);
    }
    if (numberConstructionSites < 1 && constructionSites.length > 2) {
      console.log(
        Util.getConstructionKey(
          constructionSites[2].pos.roomName,
          constructionSites[2].structureType,
          constructionSites[2].pos.x,
          constructionSites[2].pos.y
        )
      );
      this.createConstructionSite(constructionSites[2].pos, constructionSites[2].structureType);
    }
  }
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

const reassignIdleCreep = function (this: Room, creep: Creep) {
  const oldRole: CreepRoleEnum = creep.memory.role as CreepRoleEnum;
  if (oldRole === Transport.KEY || oldRole === Miner.KEY) {
    WaitAction.setActionUntilNextTick(creep);
    return;
  }
  const newRoleObj = getPlanner(this).getNextReassignRole();
  if (newRoleObj == null) {
    if (oldRole === Traveler.KEY) {
      Traveler.getNextRoom(creep);
    } else {
      WaitAction.setActionUntilNextTick(creep);
    }
    return;
  }
  const newRole = newRoleObj.newRole;
  if (newRole === oldRole) {
    WaitAction.setActionUntilNextTick(creep);
    return;
  }
  creep.memory.role = newRole;
  delete creep.memory.action;
  delete creep.memory.target;
  incrementAndDecrement(this.creepCountArray, newRole, oldRole);
};

declare global {
  interface Room {
    reassignAllCreeps(newRole: CreepRoleEnum, filter: (creep: Creep) => boolean | null);
    reassignSingleCreep(newRole: CreepRoleEnum, filter: (creep: Creep) => boolean | null);
    planner: RoomPlannerInterface | null;
    creepCountArray: Map<CreepRoleEnum, number>;
    getPlanner(room: Room): RoomPlannerInterface;
    getNumberOfCreepsByRole(role: string): number;
    findNextEnergySource(creep: Creep): Source | null;
    getNumberOfMiningSpacesAtSource(sourceId: Id<Source>): number;
    getTotalNumberOfMiningSpaces(): number;
    getNumberOfSources(): number;
    findNumberOfSourcesAndSpaces(): SourceMemory;
    makeConstructionSites();
    isSpotOpen(pos: RoomPosition): boolean;
    isOpen(s: LookAtResultWithPos): boolean;
    reassignIdleCreep(creep: Creep);
    getAdjacentRoomName(direction: ExitConstant): string;
  }
}

export class RoomPrototype {
  static init() {
    Room.prototype.reassignAllCreeps = reassignAllCreeps;
    Room.prototype.reassignSingleCreep = reassignSingleCreep;
    Room.prototype.planner = null;
    Room.prototype.creepCountArray = new Map<CreepRoleEnum, number>();
    Room.prototype.getNumberOfCreepsByRole = getNumberOfCreepsByRole;
    Room.prototype.findNextEnergySource = findNextEnergySource;
    Room.prototype.getNumberOfMiningSpacesAtSource = getNumberOfMiningSpacesAtSource;
    Room.prototype.getTotalNumberOfMiningSpaces = getTotalNumberOfMiningSpaces;
    Room.prototype.getNumberOfSources = getNumberOfSources;
    Room.prototype.getPlanner = getPlanner;
    Room.prototype.findNumberOfSourcesAndSpaces = findNumberOfSourcesAndSpaces;
    Room.prototype.makeConstructionSites = makeConstructionSites;
    Room.prototype.reassignIdleCreep = reassignIdleCreep;
    Room.prototype.isSpotOpen = isSpotOpen;
    Room.prototype.isOpen = isOpen;
    Room.prototype.getAdjacentRoomName = getAdjacentRoomName;
  }
}
