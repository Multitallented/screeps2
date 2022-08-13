import {CreepRoleEnum} from "../creep/creep-role-enum";

export class RoomObjectFixed {
  constructor(public x: number,
              public y: number,
              public creepRole: CreepRoleEnum,
              public structure: StructureConstant,
              public id: string,
              public priority: number) {
  }
}
