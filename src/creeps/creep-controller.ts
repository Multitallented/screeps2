import * as _ from "lodash";
import { CreepPrototype } from "./creep-prototype";

export class CreepController {
  constructor() {
    CreepPrototype.init();
    _.forEach(Game.creeps, creep => {
      if (!Memory.username) {
        Memory.username = creep.owner.username;
      }
      if (!creep.spawning) {
        if (creep.memory.actionSwitched) {
          delete creep.memory.actionSwitched;
        }
        creep.runAction();
      }
    });
  }
}
