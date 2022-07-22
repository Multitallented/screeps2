import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { CreepSpawnData } from "../../creeps/creep-spawn-data";

export interface RoomPlannerInterface {
  reassignCreeps();
  getNextReassignRole(force?: boolean): ReassignRole | null;
  buildMemory();
  getNextCreepToSpawn(): CreepSpawnData | null;
}

export interface ReassignRole {
  type: string;
  newRole: CreepRoleEnum;
  oldRole: CreepRoleEnum;
}
