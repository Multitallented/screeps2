import { CreepRoleEnum } from "../creep/creep-role-enum";

export class RoomObjectFixed {
  constructor(
    public x: number,
    public y: number,
    public creepRole: CreepRoleEnum | null,
    public structure: StructureConstant | null,
    public id: string | null,
    public priority: number
  ) {}
}
