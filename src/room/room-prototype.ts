import * as _ from "lodash";
import { ConstructionSiteData } from "../structures/construction/construction-site-data";
import { CreepRoleEnum } from "../creeps/roles/creep-role-enum";
import { InitPlanner } from "./planners/init-planner";
import { MinePlanner } from "./planners/mine-planner";
import { Miner } from "../creeps/roles/miner";
import { ObjectIterator } from "lodash";
import { RoomPlannerInterface } from "./planners/room-planner-interface";
import { Transport } from "../creeps/roles/transport";
import { Traveler } from "../creeps/roles/traveler";
import { VoidPlanner } from "./planners/void-planner";
import { WaitAction } from "../creeps/actions/wait";
import { Util } from "../utils/util";
import {GrandStrategyPlanner} from "../war/grand-strategy-planner";

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
  if (this.memory.sources && this.memory.sources.qty && this.memory.sources.sources) {
    return this.memory.sources.sources[sourceId] as number;
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

const getNumberOfCreepsByRole = function (this: Room, role: CreepRoleEnum): number {
  initCreepCountArray(this);
  if (this.memory.creepCount === undefined) {
    return 0;
  }
  const count = this.memory.creepCount[role] as number;
  return count !== undefined ? count : 0;
};

function initCreepCountArray(room: Room): void {
  if (room.memory.creepCount === undefined) {
    room.memory.creepCount = {} as Map<CreepRoleEnum, number>;
    _.forEach(room.find(FIND_MY_CREEPS), (creep: Creep) => {
      if (creep.memory && creep.memory.role && room.memory.creepCount !== undefined) {
        const currentRole: CreepRoleEnum = creep.memory.role;
        const count = room.memory.creepCount[currentRole] as number;
        if (count) {
          room.memory.creepCount[currentRole] = count + 1;
        } else {
          room.memory.creepCount[currentRole] = 1;
        }
      }
    });
    _.forEach(room.find(FIND_MY_SPAWNS), (spawn: StructureSpawn) => {
      if (spawn.spawning) {
        for (const creepName in CreepRoleEnum) {
          if (
            isNaN(Number(creepName)) &&
            spawn.spawning.name.indexOf(creepName.toLowerCase()) !== -1 &&
            room.memory.creepCount !== undefined
          ) {
            const creepEnum: CreepRoleEnum = CreepRoleEnum[creepName] as CreepRoleEnum;
            const count = room.memory.creepCount[creepEnum] as number;
            if (count) {
              room.memory.creepCount[creepEnum] = count + 1;
            } else {
              room.memory.creepCount[creepEnum] = 1;
            }
          }
        }
      }
    });
  }
}
function reassignCreepAndUpdateTravelerMemory(creep: Creep, newRole: CreepRoleEnum) {
  const oldRole: CreepRoleEnum = creep.memory.role as CreepRoleEnum;
  if (newRole === CreepRoleEnum.TRAVELER) {
    _.forEach(Memory.roomData, (roomData: GlobalRoomMemory) => {
      if (roomData.travelers && roomData.travelers.indexOf(creep.id) !== -1) {
        roomData.travelers.splice(roomData.travelers.indexOf(creep.id), 1);
      }
    });
  } else {
    if (!Memory.roomData[creep.room.name]) {
      Memory.roomData[creep.room.name] = {} as GlobalRoomMemory;
    }
    if (!(Memory.roomData[creep.room.name] as GlobalRoomMemory).travelers) {
      (Memory.roomData[creep.room.name] as GlobalRoomMemory).travelers = new Array<Id<_HasId>>();
    }
    if ((Memory.roomData[creep.room.name] as GlobalRoomMemory).travelers.indexOf(creep.id) === -1) {
      (Memory.roomData[creep.room.name] as GlobalRoomMemory).travelers.push(creep.id);
    }
  }
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
  return oldRole;
}

const reassignAllCreeps = function (this: Room, newRole: CreepRoleEnum, filter: (creep: Creep) => boolean) {
  if (this.memory.creepCount == null) {
    this.getNumberOfCreepsByRole(newRole);
  }
  let creepReassigned = false;
  _.forEach(this.find(FIND_MY_CREEPS), (creep: Creep) => {
    if (!creepReassigned && filter(creep)) {
      const oldRole = reassignCreepAndUpdateTravelerMemory(creep, newRole);
      creepReassigned = true;
      incrementAndDecrement(creep.room, newRole, oldRole);
    }
  });
};

const reassignSingleCreep = function (this: Room, newRole: CreepRoleEnum, filter: (creep: Creep) => boolean) {
  if (this.memory.creepCount == null) {
    this.getNumberOfCreepsByRole(newRole);
  }
  let reassigned = false;
  _.forEach(this.find(FIND_MY_CREEPS), (creep: Creep) => {
    if (!reassigned && filter(creep)) {
      const oldRole = reassignCreepAndUpdateTravelerMemory(creep, newRole);
      incrementAndDecrement(creep.room, newRole, oldRole);
      reassigned = true;
    }
  });
};

const incrementAndDecrement = function (room: Room, increment: CreepRoleEnum, decrement: CreepRoleEnum | null) {
  if (!room.memory.creepCount) {
    return;
  }
  const countInc = room.memory.creepCount[increment] as number;
  if (countInc) {
    room.memory.creepCount[increment] = countInc + 1;
  } else {
    room.memory.creepCount[increment] = 1;
  }
  if (!decrement) {
    return;
  }
  let count = room.memory.creepCount[decrement] as number;
  count = count ? count : 0;
  room.memory.creepCount[decrement] = count - 1;
};

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

const reassignIdleCreep = function (this: Room, creep: Creep, force?: boolean) {
  const oldRole: CreepRoleEnum = creep.memory.role as CreepRoleEnum;
  if (oldRole === Transport.KEY || oldRole === Miner.KEY) {
    WaitAction.setActionUntilNextTick(creep);
    return;
  }
  const newRoleObj = getPlanner(this).getNextReassignRole(force);
  if (newRoleObj == null) {
    if (oldRole === Traveler.KEY) {
      Traveler.getNextRoom(creep);
    } else if (creep.memory.homeRoom !== this.name && oldRole === CreepRoleEnum.BUILDER) {
      this.reassignSingleCreep(CreepRoleEnum.TRAVELER, (cCreep: Creep) => {
        return cCreep.id === creep.id;
      });
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
  incrementAndDecrement(creep.room, newRole, oldRole);
};

declare global {
  interface Room {
    reassignAllCreeps(newRole: CreepRoleEnum, filter: (creep: Creep) => boolean | null);
    reassignSingleCreep(newRole: CreepRoleEnum, filter: (creep: Creep) => boolean | null);
    planner: RoomPlannerInterface | null;
    getPlanner(room: Room): RoomPlannerInterface;
    getNumberOfCreepsByRole(role: string): number;
    findNextEnergySource(creep: Creep): Source | null;
    getNumberOfMiningSpacesAtSource(sourceId: Id<Source>): number;
    getTotalNumberOfMiningSpaces(): number;
    findNumberOfSourcesAndSpaces(): SourceMemory;
    makeConstructionSites();
    isSpotOpen(pos: RoomPosition): boolean;
    isOpen(s: LookAtResultWithPos): boolean;
    reassignIdleCreep(creep: Creep, force?: boolean);
    getAdjacentRoomName(direction: ExitConstant): string;
    incrementAndDecrement(room: Room, increment: CreepRoleEnum, decrement: CreepRoleEnum | null): void;
  }
}

export class RoomPrototype {
  public static init() {
    Room.prototype.reassignAllCreeps = reassignAllCreeps;
    Room.prototype.reassignSingleCreep = reassignSingleCreep;
    Room.prototype.planner = null;
    Room.prototype.getNumberOfCreepsByRole = getNumberOfCreepsByRole;
    Room.prototype.findNextEnergySource = findNextEnergySource;
    Room.prototype.getNumberOfMiningSpacesAtSource = getNumberOfMiningSpacesAtSource;
    Room.prototype.getTotalNumberOfMiningSpaces = getTotalNumberOfMiningSpaces;
    Room.prototype.getPlanner = getPlanner;
    Room.prototype.findNumberOfSourcesAndSpaces = findNumberOfSourcesAndSpaces;
    Room.prototype.makeConstructionSites = makeConstructionSites;
    Room.prototype.reassignIdleCreep = reassignIdleCreep;
    Room.prototype.isSpotOpen = isSpotOpen;
    Room.prototype.isOpen = isOpen;
    Room.prototype.getAdjacentRoomName = getAdjacentRoomName;
    Room.prototype.incrementAndDecrement = incrementAndDecrement;
  }
}
