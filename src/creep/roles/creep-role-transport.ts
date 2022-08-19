import { CreepUtil } from "utils/creep-util";
import { CreepRole } from "../creep-role";

export class CreepRoleTransport implements CreepRole {
  public doAction(creep: Creep): boolean {
    // TODO finish this
    return true;
  }

  public buildCreep(energy: number): Array<BodyPartConstant> {
    const bodyArray: Array<BodyPartConstant> = [MOVE, CARRY];
    energy -= 200;
    const partCount = { MOVE: 1, CARRY: 1 };
    while (energy >= 50 && bodyArray.length < 30) {
      if (partCount.MOVE > partCount.CARRY) {
        bodyArray.unshift(CARRY);
        partCount.CARRY += 1;
        energy -= CreepUtil.getBodyPartCost(CARRY);
      } else {
        partCount.MOVE += 1;
        bodyArray.unshift(MOVE);
        energy -= CreepUtil.getBodyPartCost(MOVE);
      }
    }
    return bodyArray;
  }
}
