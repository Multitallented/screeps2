import * as _ from "lodash";
import { Builder } from "../../creeps/roles/builder";
import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { CreepSpawnData } from "../../creeps/creep-spawn-data";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";
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
    if (!Memory.roomData[this.room.name]) {
      Memory.roomData[this.room.name] = {} as GlobalRoomMemory;
    }
    if (GrandStrategyPlanner.hasHostilesInRoom(this.room.name)) {
      delete (Memory.roomData[this.room.name] as GlobalRoomMemory).status;
    } else if (
      this.room.memory.creepCount &&
      (this.room.memory.creepCount[CreepRoleEnum.TRAVELER] ||
        this.room.memory.creepCount[CreepRoleEnum.BUILDER] ||
        this.room.memory.creepCount[CreepRoleEnum.MINER])
    ) {
      (Memory.roomData[this.room.name] as GlobalRoomMemory).status = "mine";
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
    // if (!this.room.memory.exits || this.room.memory.exits[FIND_EXIT_TOP] === undefined) {
    //   if (!this.room.memory.exits) {
    //     this.room.memory.exits = {} as Map<ExitConstant, boolean>;
    //   }
    //   this.room.memory.exits[FIND_EXIT_TOP] = findExit(FIND_EXIT_TOP, this.room);
    //   return;
    // }
    // if (this.room.memory.exits[FIND_EXIT_BOTTOM] === undefined) {
    //   this.room.memory.exits[FIND_EXIT_BOTTOM] = findExit(FIND_EXIT_BOTTOM, this.room);
    //   return;
    // }
    // if (this.room.memory.exits[FIND_EXIT_LEFT] === undefined) {
    //   this.room.memory.exits[FIND_EXIT_LEFT] = findExit(FIND_EXIT_LEFT, this.room);
    //   return;
    // }
    // if (this.room.memory.exits[FIND_EXIT_RIGHT] === undefined) {
    //   this.room.memory.exits[FIND_EXIT_RIGHT] = findExit(FIND_EXIT_RIGHT, this.room);
    //   return;
    // }
    if (this.populateContainerMemory(this.room)) {
      return;
    }
    // if (this.planSourceRoads(this.room)) {
    //   return;
    // }
    // if (this.planExitRoads(this.room)) {
    //   return;
    // }
  }

  getNextReassignRole(force?: boolean): ReassignRole | null {
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
    let containersWithEnergy = 0;
    for (const container of containers) {
      containersWithEnergy += container.store.getUsedCapacity(RESOURCE_ENERGY);
      if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        freeContainers = true;
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
    if (containersWithEnergy < 1 && constructionSites > 0) {
      return { newRole: CreepRoleEnum.BUILDER, oldRole: CreepRoleEnum.TRAVELER, type: "all" };
    }
    if (force) {
      return { newRole: CreepRoleEnum.BUILDER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
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

function findExit(exit: ExitConstant, room: Room): boolean {
  let exitExists = false;
  let x = -1;
  let y = -1;
  let isX = false;
  for (let dynamicCoord = 2; dynamicCoord < 49; dynamicCoord++) {
    if (exit === FIND_EXIT_TOP) {
      y = 2;
      x = dynamicCoord;
      isX = true;
    } else if (exit === FIND_EXIT_BOTTOM) {
      y = 47;
      x = dynamicCoord;
      isX = true;
    } else if (exit === FIND_EXIT_RIGHT) {
      x = 47;
      y = dynamicCoord;
    } else if (exit === FIND_EXIT_LEFT) {
      x = 2;
      y = dynamicCoord;
    }
    let spotHasNoWall = false;
    if (isX) {
      const newY = y === 2 ? 0 : 49;
      spotHasNoWall =
        _.filter(room.lookAt(x, newY), (c: LookAtResultWithPos) => {
          return c.type === "terrain" && c.terrain === "wall";
        }).length < 1;
    } else {
      const newX = x === 2 ? 0 : 49;
      spotHasNoWall =
        _.filter(room.lookAt(newX, y), (c: LookAtResultWithPos) => {
          return c.type === "terrain" && c.terrain === "wall";
        }).length < 1;
    }
    exitExists = exitExists || spotHasNoWall;
  }
  return exitExists;
}
