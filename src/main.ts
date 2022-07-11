import { CreepController } from "./creeps/creep-controller";
import { ErrorMapper } from "utils/ErrorMapper";
import { RoomController } from "./room/room-controller";
import { RoomPrototype } from "./room/room-prototype";
import { CreepRoleEnum } from "./creeps/roles/creep-role-enum";

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
  }

  interface RoomMemory {
    ccontainer?: string;
    closestLink?: string;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  RoomPrototype.init();
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
  new CreepController();
  RoomController.runRooms();
});
