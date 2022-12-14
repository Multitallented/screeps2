import { ErrorMapper } from "utils/ErrorMapper";
import * as profiler from "./screeps-profiler";
import {CreepRoleEnum} from "./creep/creep-role-enum";
import {NeedCreep} from "./decisions/need-creep";
import {GlobalDecisionController} from "./decisions/global-decision-controller";
import {RoomObjectFixed} from "./room/room-object-fixed";
import {CreepPrototype} from "./creep/creep-prototype";
import {SpawnController} from "./structures/spawn-controller";
import {CreepController} from "./creep/creep-controller";
import {RoomController} from "./room/room-controller";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    roomData: Map<string, GlobalRoomMemory>;
    username?: string;
    debug?: boolean;
    creepNeeds: Array<NeedCreep>;
  }

  interface GlobalRoomMemory {
    sources: SourceMemory;
    posMap: Array<RoomObjectFixed>;
    hostileCreeps: number;
    hostileMelee: number;
    hostileHealer: number;
    hostileRanged: number;
    hostileBuildings: number;
    hostileWorkers: number;
    hostilePowerCreeps: number;
    hostileStructures: number;
  }

  interface CreepMemory {
    action?: string;
    target?: Id<_HasId>;
    destination?: RoomPosition;
    role?: CreepRoleEnum;
    resourceType?: ResourceConstant;
    fromRoom?: string;
    toRoom?: string;
    endRoom?: string;
    withdraw?: boolean; // If the creep is supposed to withdraw or deposit
    need?: string;
  }

  interface SourceMemory {
    sources: Map<string, number>;
    qty?: number;
    spots?: number;
  }

  interface RoomMemory {
    storeEnergy?: boolean; // Whether or not the room is storing energy in Storage
    storage: Array<Id<_HasId>>;
    creepCount: Map<CreepRoleEnum, number>;
    exits?: Map<ExitConstant, boolean>;
    center?: RoomPosition;
    radius?: number;
    sites?: Map<number, Map<string, StructureConstant>>;
    ramparts?: Map<string, StructureConstant>;
    sourceContainers?: Array<RoomPosition>;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

profiler.enable();
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  profiler.wrap(() => {
    initPrototypes();
    initMemory();
    RoomController.run();
    GlobalDecisionController.generateNeeds();

    CreepController.run();
    SpawnController.run();
  });
});

function initPrototypes() {
  CreepPrototype.init();
}

function initMemory() {
  if (!Memory.creepNeeds) {
    Memory.creepNeeds = new Array<NeedCreep>();
  }
  if (!Memory.roomData) {
    Memory.roomData = <Map<string, GlobalRoomMemory>>{};
  }
  if (!Memory.username) {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (room.controller && room.controller.my && room.controller.owner) {
        Memory.username = room.controller.owner?.username;
      }
    }
  }
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    if (!room) {
      continue;
    }
    room.memory.creepCount = <Map<CreepRoleEnum, number>>{};
    for (const creep of room.find(FIND_MY_CREEPS)) {
      if (!creep.memory.role) {
        continue;
      }
      if (room.memory.creepCount[creep.memory.role]) {
        room.memory.creepCount[creep.memory.role] += 1;
      } else {
        room.memory.creepCount[creep.memory.role] = 1;
      }
    }
  }
}
