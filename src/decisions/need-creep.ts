import { CreepRoleEnum } from "../creep/creep-role-enum";

export class NeedCreep {
  constructor(public creepRole: CreepRoleEnum,
              public priority: number,
              public memory: CreepMemory,
              public pos: RoomPosition,
              public relieve: Id<_HasId> | null) {
  }
}
