import { CreepRoleEnum } from "./creep-role-enum";
import { CreepRole } from "./creep-role";
import { CreepRoleTransport } from "./roles/creep-role-transport";
import { CreepRoleTransfer } from "./roles/creep-role-transfer";

export class CreepController {
  public static run(): void {
    _.forEach(Game.creeps, creep => {
      if (!creep.memory.need) {
        let needs = Memory.creepNeeds;
        needs = _.sortBy(needs, need => {
          return need.priority;
        });
        for (const need of needs) {
          if (need.creepRole === creep.memory.role && (need.spawning || !need.filled)) {
            need.spawning = false;
            need.filled = creep.id;
            creep.memory.need = need.pos.roomName;
          }
        }
      }
      creep.runAction();
    });
  }

  public static getCreepRole(role: CreepRoleEnum): CreepRole {
    switch (role) {
      case CreepRoleEnum.TRANSPORT:
        return new CreepRoleTransport();
      case CreepRoleEnum.TRANSFER:
      default:
        return new CreepRoleTransfer();
    }
  }
}
