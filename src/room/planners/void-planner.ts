import { CreepSpawnData } from "../../creeps/creep-spawn-data";
import { Planner } from "./planner";
import { RoomPlannerInterface } from "./room-planner-interface";

export class VoidPlanner extends Planner implements RoomPlannerInterface {
  private room: Room;

  constructor(room: Room) {
    super();
    this.room = room;
  }

  buildMemory() {
    this.populateSourcesMemory(this.room);
  }

  getNextReassignRole(force?: boolean) {
    return null;
  }

  reassignCreeps() {
    // Do nothing
  }

  getNextCreepToSpawn(): CreepSpawnData | null {
    return null;
  }
}
