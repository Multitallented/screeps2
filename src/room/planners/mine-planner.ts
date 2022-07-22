import * as _ from "lodash";
import { Builder } from "../../creeps/roles/builder";
import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { CreepSpawnData } from "../../creeps/creep-spawn-data";
import { Miner } from "../../creeps/roles/miner";
import { Planner } from "./planner";
import { ReassignRole, RoomPlannerInterface } from "./room-planner-interface";
import { Traveler } from "../../creeps/roles/traveler";

export class MinePlanner extends Planner implements RoomPlannerInterface {
  private room: Room;
  private creepsAssigned = false;

  constructor(room: Room) {
    super();
    this.room = room;
  }

  buildMemory() {
    if (this.room.memory.complete) {
      return;
    }
    if (!this.room.memory.sites) {
      this.initSitesArrays(this.room);
      return;
    }
    if (this.room.find(FIND_MY_CREEPS).length < 1) {
      return;
    }
    if (this.populateSourcesMemory(this.room)) {
      return;
    }
    if (this.populateContainerMemory(this.room)) {
      return;
    }
  }

  getNextReassignRole(): ReassignRole | null {
    const travelers = this.room.getNumberOfCreepsByRole(Traveler.KEY);
    const miners = this.room.getNumberOfCreepsByRole(Miner.KEY);
    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES).length;
    const builders = this.room.getNumberOfCreepsByRole(Builder.KEY);
    const containers: Array<StructureContainer> = this.room.find(FIND_STRUCTURES, {
      filter: (s: Structure) => {
        return s.structureType === STRUCTURE_CONTAINER;
      }
    });
    let hasRoomForEnergy = false;
    _.forEach(containers, (container: StructureContainer) => {
      if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        hasRoomForEnergy = true;
      }
    });
    if (!hasRoomForEnergy && miners > 0) {
      return { newRole: CreepRoleEnum.TRAVELER, oldRole: CreepRoleEnum.MINER, type: "all" };
    }
    if (travelers < 1) {
      return null;
    }
    if (((builders < 2 && constructionSites > 0) || builders < 1) && Builder.roomHasBuilderJobs(this.room)) {
      return { newRole: CreepRoleEnum.BUILDER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
    }
    let freeContainers = false;
    let containersWithEnergy = false;
    for (const container of containers) {
      if (container.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        containersWithEnergy = true;
      }
      if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        freeContainers = true;
        break;
      }
    }
    if (!containersWithEnergy && miners < containers.length) {
      return { newRole: CreepRoleEnum.MINER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
    }
    if (builders > 1 && constructionSites < 1) {
      return { newRole: CreepRoleEnum.TRAVELER, oldRole: CreepRoleEnum.BUILDER, type: "all" };
    }
    if (!freeContainers) {
      return { newRole: CreepRoleEnum.TRAVELER, oldRole: CreepRoleEnum.MINER, type: "all" };
    }
    return null;
  }

  reassignCreeps() {
    if (this.creepsAssigned) {
      return;
    }
    let i = 0;
    let nextReassignRole: ReassignRole | null = this.getNextReassignRole();
    while (i < 2 && nextReassignRole) {
      i++;
      if (nextReassignRole.type === "all") {
        this.room.reassignAllCreeps(nextReassignRole.newRole, (creep: Creep) => {
          return (
            creep.memory && (!creep.memory.role || (nextReassignRole && creep.memory.role === nextReassignRole.oldRole))
          );
        });
      } else {
        console.log(
          this.room.name + " mine reassigning " + nextReassignRole.oldRole + " to " + nextReassignRole.newRole
        );
        this.room.reassignSingleCreep(nextReassignRole.newRole, (creep: Creep) => {
          return (
            creep.memory && (!creep.memory.role || (nextReassignRole && creep.memory.role === nextReassignRole.oldRole))
          );
        });
      }
      nextReassignRole = this.getNextReassignRole();
    }
    this.creepsAssigned = true;
  }

  getNextCreepToSpawn(): CreepSpawnData | null {
    return null;
  }
}
