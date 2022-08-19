import { CreepRoleEnum } from "../creep/creep-role-enum";

export class NeedCreep {
  public spawning = false;

  constructor(
    public creepRole: CreepRoleEnum,
    public priority: number,
    public memory: CreepMemory,
    public pos: RoomPosition,
    public relieve: Id<_HasId> | null,
    public filled: Id<_HasId> | null,
    public old: boolean
  ) {}
}
