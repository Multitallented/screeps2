import { CreepRole } from "../creep/creep-role";
import { CreepRoleEnum } from "../creep/creep-role-enum";
import { CreepRoleTransfer } from "../creep/roles/creep-role-transfer";
import { CreepRoleTransport } from "../creep/roles/creep-role-transport";

export class CreepUtil {
  public static getBodyPartCost(bodyPartConstant: BodyPartConstant): number {
    switch (bodyPartConstant) {
      case CLAIM:
        return 600;
      case HEAL:
        return 250;
      case RANGED_ATTACK:
        return 150;
      case WORK:
        return 100;
      case ATTACK:
        return 80;
      case TOUGH:
        return 10;
      case MOVE:
      case CARRY:
      default:
        return 50;
    }
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
