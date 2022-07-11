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
      if (!this.room.memory.sites) {
        this.room.memory.sites = new Map<number, Map<string, StructureConstant>>();
        this.room.memory.sites.set(0, new Map<string, StructureConstant>());
        this.room.memory.sites.set(1, new Map<string, StructureConstant>());
        this.room.memory.sites.set(2, new Map<string, StructureConstant>());
        this.room.memory.sites.set(3, new Map<string, StructureConstant>());
        this.room.memory.sites.set(4, new Map<string, StructureConstant>());
        this.room.memory.sites.set(5, new Map<string, StructureConstant>());
        this.room.memory.sites.set(6, new Map<string, StructureConstant>());
        this.room.memory.sites.set(7, new Map<string, StructureConstant>());
        this.room.memory.sites.set(8, new Map<string, StructureConstant>());
      }
      if (!this.room.memory.sites2) {
        this.room.memory.sites2 = new Map<string, StructureConstant>();
      }
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
    if (travelers < 1) {
      return null;
    }
    const miners = this.room.getNumberOfCreepsByRole(Miner.KEY);
    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES).length;
    const builders = this.room.getNumberOfCreepsByRole(Builder.KEY);
    const containers: Array<StructureContainer> = this.room.find(FIND_STRUCTURES, {
      filter: (s: Structure) => {
        return s.structureType === STRUCTURE_CONTAINER;
      }
    });
    if ((builders < 2 && constructionSites > 0) || builders < 1) {
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
