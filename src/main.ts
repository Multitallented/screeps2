import { CreepController } from "./creeps/creep-controller";
import { CreepRoleEnum } from "./creeps/roles/creep-role-enum";
import { ErrorMapper } from "utils/ErrorMapper";
import { RoomController } from "./room/room-controller";
import { RoomPrototype } from "./room/room-prototype";
import * as profiler from "./screeps-profiler";

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
  }

  interface GlobalRoomMemory {
    sources: SourceMemory;
    travelers: Array<Id<_HasId>>;
    hostileMelee: number;
    hostileHealer: number;
    hostileRanged: number;
    hostileBuildings: number;
    hostileWorkers: number;
    hostilePowerCreeps: number;
    hostileStructures: number;
    defenders: Array<Id<_HasId>>;
    status?: string;
  }

  interface MoveInProgress {
    dest: RoomPosition;
    time: number;
    path: string;
    room: string;
  }

  interface CreepMemory {
    action?: string;
    role?: CreepRoleEnum;
    homeRoom?: string;
    destination?: RoomPosition;
    target?: Id<_HasId>;
    prevPos?: RoomPosition;
    _move?: MoveInProgress;
    actionSwitched?: boolean;
    fromRoom?: string;
    originRoom?: string;
    toRoom?: string;
    endRoom?: string;
    travel?: string;
    resourceType?: ResourceConstant;
    source?: Id<_HasId>;
    wait?: string;
    claim?: string;
  }

  interface SourceMemory {
    sources: Map<string, number>;
    qty?: number;
    spots?: number;
  }

  interface RoomMemory {
    ccontainer?: string;
    closestLink?: string;
    sources?: SourceMemory;
    complete?: boolean;
    containerStructure?: boolean;
    sendBuilders?: boolean;
    towerStructure?: boolean;
    spawnStructure?: boolean;
    storageStructure?: boolean;
    powerSpawnStructure?: boolean;
    terminalStructure?: boolean;
    sourceRoads?: boolean;
    exitRoads?: boolean;
    extensionStructure?: boolean;
    sites?: Map<number, Map<string, StructureConstant>>;
    sites2?: Map<string, StructureConstant>;
    ticksTillNextConstruction?: number;
    loopCenter?: Map<string, boolean>;
    exits?: Map<ExitConstant, boolean>;
    center?: RoomPosition;
    creepCount?: Map<CreepRoleEnum, number>;
    travelerRoom?: string;
    towerRepair?: Id<_HasId>;
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
    RoomPrototype.init();
    for (const name in Memory.creeps) {
      if (!Game.creeps[name]) {
        delete Memory.creeps[name];
      }
    }
    new CreepController();
    RoomController.runRooms();
  });
});
