import * as _ from "lodash";
import { ConstructionSiteData } from "../../structures/construction/construction-site-data";
import { CreepBodyBuilder } from "../../creeps/creep-body-builder";
import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { CreepSpawnData } from "../../creeps/creep-spawn-data";
import { GrandStrategyPlanner } from "../../war/grand-strategy-planner";
import { Planner } from "./planner";
import { RoomPlannerInterface } from "./room-planner-interface";

export class InitPlanner extends Planner implements RoomPlannerInterface {
  private readonly room: Room;
  private creepsAssigned = false;

  constructor(room: Room) {
    super();
    this.room = room;
  }

  public getNextReassignRole(force?: boolean) {
    const travelers = this.room.getNumberOfCreepsByRole(CreepRoleEnum.TRAVELER);
    const transports = this.room.getNumberOfCreepsByRole(CreepRoleEnum.TRANSPORT);
    const builders = this.room.getNumberOfCreepsByRole(CreepRoleEnum.BUILDER);
    const upgraders = this.room.getNumberOfCreepsByRole(CreepRoleEnum.UPGRADER);
    const miners = this.room.getNumberOfCreepsByRole(CreepRoleEnum.MINER);
    const hasContainers: boolean =
      this.room.find(FIND_STRUCTURES, {
        filter: (s: Structure) => {
          return s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK;
        }
      }).length > 0;
    // const spawnersNeedingEnergy = this.room.find(FIND_MY_STRUCTURES, {filter: (s:Structure) => {
    //         return s['store'] && (s.structureType === STRUCTURE_SPAWN ||
    //             s.structureType === STRUCTURE_EXTENSION) && s['store'].getFreeCapacity(RESOURCE_ENERGY) > 0;
    //     }});
    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES).length;
    const spawns = this.room.find(FIND_MY_SPAWNS).length;
    if (spawns < 1 || (builders + upgraders + miners < 2 && this.room.energyAvailable < 300)) {
      this.room.memory.sendBuilders = true;
    } else if (this.room.energyAvailable / this.room.energyCapacityAvailable > 0.63) {
      delete this.room.memory.sendBuilders;
    }
    if (spawns < 1 && upgraders < 1 && travelers > 0) {
      return { newRole: CreepRoleEnum.UPGRADER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
    } else if (spawns < 1 && upgraders < 1 && builders > 0) {
      return { newRole: CreepRoleEnum.UPGRADER, oldRole: CreepRoleEnum.BUILDER, type: "single" };
    } else if (hasContainers && spawns < 1 && upgraders < 1 && miners > 0) {
      return { newRole: CreepRoleEnum.UPGRADER, oldRole: CreepRoleEnum.MINER, type: "single" };
    } else if (spawns < 1 && builders < 3 && travelers > 0) {
      return { newRole: CreepRoleEnum.BUILDER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
    } else if (spawns < 1 && miners < 2 && travelers > 0) {
      return { newRole: CreepRoleEnum.MINER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
    } else if (spawns < 1 && travelers > 0 && upgraders < 3) {
      return { newRole: CreepRoleEnum.UPGRADER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
    }
    if (spawns > 0 && transports < 1 && builders > 0 && (!this.room.controller || this.room.controller.level < 4)) {
      return { newRole: CreepRoleEnum.TRANSPORT, oldRole: CreepRoleEnum.BUILDER, type: "single" };
    }
    if (spawns > 0 && transports < 1 && upgraders > 0 && (!this.room.controller || this.room.controller.level < 4)) {
      return { newRole: CreepRoleEnum.TRANSPORT, oldRole: CreepRoleEnum.UPGRADER, type: "single" };
    }
    if (upgraders < 1 && builders > 0) {
      return { newRole: CreepRoleEnum.UPGRADER, oldRole: CreepRoleEnum.BUILDER, type: "single" };
    }
    if (spawns > 0 && builders > transports && transports < 2) {
      return { newRole: CreepRoleEnum.TRANSPORT, oldRole: CreepRoleEnum.BUILDER, type: "single" };
    }
    if (
      ((upgraders / 2 > builders && constructionSites > 0) ||
        (builders < 1 && this.room.energyAvailable < 0.6 * this.room.energyCapacityAvailable)) &&
      upgraders > 1
    ) {
      return { newRole: CreepRoleEnum.BUILDER, oldRole: CreepRoleEnum.UPGRADER, type: "single" };
    }
    const travelerRoom = GrandStrategyPlanner.findTravelerDestinationRoom(this.room.name, null);
    if (upgraders > 4 && travelerRoom) {
      return { newRole: CreepRoleEnum.TRAVELER, oldRole: CreepRoleEnum.UPGRADER, type: "single" };
    }
    if (
      travelerRoom &&
      ((builders > this.room.find(FIND_SOURCES).length * 3 && constructionSites > 0) ||
        (builders > 1 && constructionSites < 1))
    ) {
      return { newRole: CreepRoleEnum.TRAVELER, oldRole: CreepRoleEnum.BUILDER, type: "single" };
    }
    if (force) {
      if (constructionSites > 0) {
        return { newRole: CreepRoleEnum.BUILDER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
      } else {
        return { newRole: CreepRoleEnum.UPGRADER, oldRole: CreepRoleEnum.TRAVELER, type: "single" };
      }
    }
    return null;
  }

  public reassignCreeps(): void {
    if (this.creepsAssigned) {
      return;
    }

    let i = 0;
    let nextReassignRole = this.getNextReassignRole();
    while (i < 2 && nextReassignRole) {
      i++;
      if (nextReassignRole.type === "all") {
        this.room.reassignAllCreeps(nextReassignRole.newRole, (creep: Creep) => {
          return (
            creep.memory && nextReassignRole && (!creep.memory.role || creep.memory.role === nextReassignRole.oldRole)
          );
        });
      } else {
        console.log(
          this.room.name + " init reassigning " + nextReassignRole.oldRole + " to " + nextReassignRole.newRole
        );
        this.room.reassignSingleCreep(nextReassignRole.newRole, (creep: Creep) => {
          return (
            creep.memory && nextReassignRole && (!creep.memory.role || creep.memory.role === nextReassignRole.oldRole)
          );
        });
      }
      nextReassignRole = this.getNextReassignRole();
    }
    this.creepsAssigned = true;
  }

  public getNextCreepToSpawn(): CreepSpawnData | null {
    const transports = this.room.getNumberOfCreepsByRole(CreepRoleEnum.TRANSPORT);
    const builders = this.room.getNumberOfCreepsByRole(CreepRoleEnum.BUILDER);
    const upgraders = this.room.getNumberOfCreepsByRole(CreepRoleEnum.UPGRADER);
    const miners = this.room.getNumberOfCreepsByRole(CreepRoleEnum.MINER);
    const controllerLevel = this.room.controller ? this.room.controller.level : 0;
    const percentEnergyAvailable = this.room.energyAvailable / this.room.energyCapacityAvailable;
    // const spawns = this.room.find(FIND_MY_SPAWNS).length;
    const minerNearDeath =
      this.room.find(FIND_MY_CREEPS, {
        filter: (creep: Creep) => {
          return (
            creep.memory && creep.memory.role === CreepRoleEnum.MINER && creep.ticksToLive && creep.ticksToLive < 120
          );
        }
      }).length > 0;
    const hasContainers: boolean =
      this.room.find(FIND_STRUCTURES, {
        filter: (s: Structure) => {
          return s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK;
        }
      }).length > 0;
    let sources = 0;
    if (this.room.memory.sources && this.room.memory.sources.sources) {
      sources += Object.keys(this.room.memory.sources.sources).length;
    } else {
      sources = this.room.find(FIND_SOURCES_ACTIVE).length;
    }

    // if (spawns > 1) {
    //   console.log(
    //     "room: " +
    //       this.room.name +
    //       " Upgraders: " +
    //       <string>(<unknown>this.room.getNumberOfCreepsByRole(CreepRoleEnum.UPGRADER)) +
    //       " Transport: " +
    //       <string>(<unknown>this.room.getNumberOfCreepsByRole(CreepRoleEnum.TRANSPORT)) +
    //       " Miners: " +
    //       <string>(<unknown>this.room.getNumberOfCreepsByRole(CreepRoleEnum.MINER)) +
    //       " Builders: " +
    //       <string>(<unknown>this.room.getNumberOfCreepsByRole(CreepRoleEnum.BUILDER)) +
    //       " Sources: " +
    //       <string>(<unknown>sources)
    //   );
    // }
    // TODO make this more efficient
    const imminentHostiles = GrandStrategyPlanner.findHostileRoom(this.room.name, null) !== null;
    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES).length;

    if (transports < 1) {
      const energy = controllerLevel < 4 ? Math.min(this.room.energyAvailable, 350) : this.room.energyAvailable;
      return CreepSpawnData.build(
        CreepRoleEnum.TRANSPORT,
        hasContainers ? CreepBodyBuilder.buildTransport(energy) : CreepBodyBuilder.buildBasicWorker(energy),
        0
      );
    } else if (upgraders < 1) {
      const energy = controllerLevel < 4 ? Math.min(this.room.energyAvailable, 600) : this.room.energyAvailable;
      return CreepSpawnData.build(CreepRoleEnum.UPGRADER, CreepBodyBuilder.buildBasicWorker(energy), 0);
    } else if (miners < 1 && hasContainers) {
      return CreepSpawnData.build(
        CreepRoleEnum.MINER,
        CreepBodyBuilder.buildMiner(Math.min(this.room.energyAvailable, 750)),
        0
      );
    } else if (hasContainers && (miners < sources || (minerNearDeath && miners <= sources))) {
      return CreepSpawnData.build(
        CreepRoleEnum.MINER,
        CreepBodyBuilder.buildMiner(Math.min(this.room.energyAvailable, 750)),
        transports > 1 ? 1 : 0.5
      );
    } else if (
      hasContainers &&
      controllerLevel < 4 &&
      (transports < 3 ||
        (transports < builders + upgraders / 2 && transports < 2 * sources) ||
        (constructionSites < 1 && transports < 2 * sources + 1))
    ) {
      return CreepSpawnData.build(
        CreepRoleEnum.TRANSPORT,
        CreepBodyBuilder.buildTransport(this.room.energyAvailable),
        transports > 1 ? 1 : 0.4
      );
    } else if (imminentHostiles) {
      return CreepSpawnData.build(
        CreepRoleEnum.MELEE,
        CreepBodyBuilder.buildMelee(Math.min(this.room.energyAvailable, 500)),
        0.4
      );
    } else if (
      controllerLevel < 4 &&
      upgraders + 1 < Math.max(2, this.room.getTotalNumberOfMiningSpaces()) &&
      upgraders / 2 <= builders
    ) {
      return CreepSpawnData.build(
        CreepRoleEnum.UPGRADER,
        CreepBodyBuilder.buildBasicWorker(Math.min(this.room.energyAvailable, 900)),
        1
      );
    } else if (constructionSites > 0 && ((builders < 3 * sources && controllerLevel < 4) || builders < 3)) {
      return CreepSpawnData.build(
        CreepRoleEnum.BUILDER,
        CreepBodyBuilder.buildBasicWorker(Math.min(this.room.energyAvailable, 900)),
        1
      );
    } else if (GrandStrategyPlanner.canClaimAnyRoom()) {
      // TODO only build 1 for the room
      return CreepSpawnData.build(CreepRoleEnum.CLAIMER, CreepBodyBuilder.buildClaimer(), 0.5);
    }
    const travelerRoom = GrandStrategyPlanner.findTravelerDestinationRoom(this.room.name, null);
    if (travelerRoom && Game.rooms[travelerRoom]) {
      const travelerRoomActive = Game.rooms[travelerRoom];
      const claimers = travelerRoomActive.find(FIND_MY_CREEPS, {
        filter: (c: Creep) => {
          return c.memory.action === CreepRoleEnum.CLAIMER;
        }
      }).length;
      if (
        travelerRoomActive.controller &&
        !travelerRoomActive.controller.my &&
        claimers < 3 &&
        (!travelerRoomActive.controller.reservation || travelerRoomActive.controller.reservation.ticksToEnd < 120)
      ) {
        return CreepSpawnData.build(CreepRoleEnum.CLAIMER, CreepBodyBuilder.buildClaimer(), 0.5);
      }
    }
    if (travelerRoom && this.room.energyAvailable > 600 && upgraders > 2 && percentEnergyAvailable <= 0.7) {
      return CreepSpawnData.build(
        CreepRoleEnum.TRAVELER,
        CreepBodyBuilder.buildBasicWorker(Math.min(this.room.energyAvailable, 450)),
        1
      );
    } else if (travelerRoom && percentEnergyAvailable > 0.7 && this.room.energyAvailable > 600) {
      return CreepSpawnData.build(
        CreepRoleEnum.TRAVELER,
        CreepBodyBuilder.buildBasicWorker(Math.min(this.room.energyAvailable, 1000)),
        1
      );
    } else if (percentEnergyAvailable > 0.9 && upgraders < 4 && controllerLevel < 4) {
      return CreepSpawnData.build(
        CreepRoleEnum.UPGRADER,
        CreepBodyBuilder.buildBasicWorker(this.room.energyAvailable),
        1
      );
    }
    return null;
  }

  public buildMemory() {
    if (this.room.memory.ccontainer && !Game.getObjectById(<Id<_HasId>>this.room.memory.ccontainer)) {
      delete this.room.memory.ccontainer;
    }
    if (this.room.memory.closestLink && !Game.getObjectById(<Id<_HasId>>this.room.memory.closestLink)) {
      delete this.room.memory.closestLink;
    }
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

    if (!this.room.memory.exits || this.room.memory.exits[FIND_EXIT_TOP] === undefined) {
      if (!this.room.memory.exits) {
        this.room.memory.exits = {} as Map<ExitConstant, boolean>;
      }
      this.room.memory.exits[FIND_EXIT_TOP] = findExitAndPlanWalls(FIND_EXIT_TOP, this.room);
      return;
    }
    if (this.room.memory.exits[FIND_EXIT_BOTTOM] === undefined) {
      this.room.memory.exits[FIND_EXIT_BOTTOM] = findExitAndPlanWalls(FIND_EXIT_BOTTOM, this.room);
      return;
    }
    if (this.room.memory.exits[FIND_EXIT_LEFT] === undefined) {
      this.room.memory.exits[FIND_EXIT_LEFT] = findExitAndPlanWalls(FIND_EXIT_LEFT, this.room);
      return;
    }
    if (this.room.memory.exits[FIND_EXIT_RIGHT] === undefined) {
      this.room.memory.exits[FIND_EXIT_RIGHT] = findExitAndPlanWalls(FIND_EXIT_RIGHT, this.room);
      return;
    }

    if (!this.room.controller || (!this.room.controller.reservation && !this.room.controller.my)) {
      return;
    }

    if (this.populateContainerMemory(this.room)) {
      return;
    }

    if (
      !this.room.memory[STRUCTURE_TOWER + "Structure"] &&
      this.room.memory.center &&
      this.room.controller &&
      this.room.controller.my
    ) {
      planBuildings(this.room, STRUCTURE_TOWER);
      return;
    }
    if (
      !this.room.memory[STRUCTURE_STORAGE + "Structure"] &&
      this.room.memory.center &&
      this.room.controller &&
      this.room.controller.my
    ) {
      planBuildings(this.room, STRUCTURE_STORAGE);
      return;
    }
    if (
      !this.room.memory[STRUCTURE_SPAWN + "Structure"] &&
      this.room.memory.center &&
      this.room.controller &&
      this.room.controller.my
    ) {
      planBuildings(this.room, STRUCTURE_SPAWN);
      return;
    }
    if (
      !this.room.memory[STRUCTURE_POWER_SPAWN + "Structure"] &&
      this.room.memory.center &&
      this.room.controller &&
      this.room.controller.my
    ) {
      planBuildings(this.room, STRUCTURE_POWER_SPAWN);
      return;
    }
    if (
      !this.room.memory[STRUCTURE_TERMINAL + "Structure"] &&
      this.room.memory.center &&
      this.room.controller &&
      this.room.controller.my
    ) {
      planBuildings(this.room, STRUCTURE_TERMINAL);
      return;
    }

    if (this.planSourceRoads(this.room)) {
      return;
    }

    if (this.planExitRoads(this.room)) {
      return;
    }

    // TODO break this up into multiple ticks?
    if (
      !this.room.memory[STRUCTURE_EXTENSION + "Structure"] &&
      this.room.memory.center &&
      this.room.controller &&
      this.room.controller.my
    ) {
      planBuildings(this.room, STRUCTURE_EXTENSION);
      return;
    }

    // this.room.memory['complete'] = true;
  }
}

function findExitAndPlanWalls(exit: ExitConstant, room: Room): boolean {
  if (!room.memory.sites2) {
    room.memory.sites2 = new Map<string, StructureConstant>();
  }
  if (!room.memory.sites) {
    room.memory.sites = new Map<number, Map<string, StructureConstant>>();
  }
  if (!room.memory.sites[2]) {
    room.memory.sites[2] = new Map<string, StructureConstant>();
  }
  let exitExists = false;
  let x = -1;
  let y = -1;
  let isX = false;
  const exits = new Array<number>();
  let exitSize = 0;
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
    let isRampart = false;
    let spotHasNoWall = false;
    if (isX) {
      const newY = y === 2 ? 0 : 49;
      spotHasNoWall =
        _.filter(room.lookAt(x, newY), (c: LookAtResultWithPos) => {
          if (
            c.type === "structure" &&
            c.structure &&
            c.structure.structureType !== STRUCTURE_RAMPART &&
            c.structure.structureType !== STRUCTURE_WALL
          ) {
            isRampart = true;
          }
          return c.type === "terrain" && c.terrain === "wall";
        }).length < 1;
    } else {
      const newX = x === 2 ? 0 : 49;
      spotHasNoWall =
        _.filter(room.lookAt(newX, y), (c: LookAtResultWithPos) => {
          if (
            c.type === "structure" &&
            c.structure &&
            c.structure.structureType !== STRUCTURE_RAMPART &&
            c.structure.structureType !== STRUCTURE_WALL
          ) {
            isRampart = true;
          }
          return c.type === "terrain" && c.terrain === "wall";
        }).length < 1;
    }
    if (spotHasNoWall) {
      if (exitSize === 0) {
        if (isX) {
          if (room.isSpotOpen(new RoomPosition(x - 1, y, room.name))) {
            (room.memory.sites[2] as Map<string, StructureConstant>)[
              <string>(<unknown>(x - 1)) + ":" + <string>(<unknown>y)
            ] = STRUCTURE_WALL;
          }
          if (room.isSpotOpen(new RoomPosition(x - 1, y, room.name))) {
            (room.memory.sites[2] as Map<string, StructureConstant>)[
              <string>(<unknown>(x - 2)) + ":" + <string>(<unknown>y)
            ] = STRUCTURE_WALL;
          }
          const newY = y === 2 ? 1 : 48;
          if (room.isSpotOpen(new RoomPosition(x - 1, newY, room.name))) {
            (room.memory.sites[2] as Map<string, StructureConstant>)[
              <string>(<unknown>(x - 2)) + ":" + <string>(<unknown>newY)
            ] = STRUCTURE_WALL;
          }
        } else {
          if (room.isSpotOpen(new RoomPosition(x, y - 1, room.name))) {
            (room.memory.sites[2] as Map<string, StructureConstant>)[
              <string>(<unknown>x) + ":" + <string>(<unknown>(y - 1))
            ] = STRUCTURE_WALL;
          }
          if (room.isSpotOpen(new RoomPosition(x, y - 1, room.name))) {
            (room.memory.sites[2] as Map<string, StructureConstant>)[
              <string>(<unknown>x) + ":" + <string>(<unknown>(y - 2))
            ] = STRUCTURE_WALL;
          }
          const newX = x === 2 ? 1 : 48;
          if (room.isSpotOpen(new RoomPosition(newX, y - 1, room.name))) {
            (room.memory.sites[2] as Map<string, StructureConstant>)[
              <string>(<unknown>newX) + ":" + <string>(<unknown>(y - 2))
            ] = STRUCTURE_WALL;
          }
        }
      }
      exitSize += 1;
      if (isRampart) {
        room.memory.sites2[<string>(<unknown>x) + ":" + <string>(<unknown>y)] = STRUCTURE_RAMPART;
      } else {
        (room.memory.sites[2] as Map<string, StructureConstant>)[<string>(<unknown>x) + ":" + <string>(<unknown>y)] =
          STRUCTURE_WALL;
      }
    } else if (exitSize) {
      if (isX) {
        if (room.isSpotOpen(new RoomPosition(x, y, room.name))) {
          (room.memory.sites[2] as Map<string, StructureConstant>)[<string>(<unknown>x) + ":" + <string>(<unknown>y)] =
            STRUCTURE_WALL;
        }
        if (room.isSpotOpen(new RoomPosition(x + 1, y, room.name))) {
          (room.memory.sites[2] as Map<string, StructureConstant>)[
            <string>(<unknown>(x + 1)) + ":" + <string>(<unknown>y)
          ] = STRUCTURE_WALL;
        }
        const newY = y === 2 ? 1 : 48;
        if (room.isSpotOpen(new RoomPosition(x + 1, newY, room.name))) {
          (room.memory.sites[2] as Map<string, StructureConstant>)[
            <string>(<unknown>(x + 1)) + ":" + <string>(<unknown>newY)
          ] = STRUCTURE_WALL;
        }
      } else {
        if (room.isSpotOpen(new RoomPosition(x, y, room.name))) {
          (room.memory.sites[2] as Map<string, StructureConstant>)[<string>(<unknown>x) + ":" + <string>(<unknown>y)] =
            STRUCTURE_WALL;
        }
        if (room.isSpotOpen(new RoomPosition(x, y + 1, room.name))) {
          (room.memory.sites[2] as Map<string, StructureConstant>)[
            <string>(<unknown>x) + ":" + <string>(<unknown>(y + 1))
          ] = STRUCTURE_WALL;
        }
        const newX = x === 2 ? 1 : 48;
        if (room.isSpotOpen(new RoomPosition(newX, y + 1, room.name))) {
          (room.memory.sites[2] as Map<string, StructureConstant>)[
            <string>(<unknown>newX) + ":" + <string>(<unknown>(y + 1))
          ] = STRUCTURE_WALL;
        }
      }
      exits.push(dynamicCoord - Math.round(exitSize / 2));
      exitSize = 0;
    }
    exitExists = exitExists || spotHasNoWall;
  }

  for (const exit of exits) {
    if (isX) {
      delete (room.memory.sites[2] as Map<string, StructureConstant>)[
        <string>(<unknown>(exit - 1)) + ":" + <string>(<unknown>y)
      ];
      delete (room.memory.sites[2] as Map<string, StructureConstant>)[
        <string>(<unknown>exit) + ":" + <string>(<unknown>y)
      ];
      delete (room.memory.sites[2] as Map<string, StructureConstant>)[
        <string>(<unknown>(exit + 1)) + ":" + <string>(<unknown>y)
      ];
      room.memory.sites2[<string>(<unknown>(exit - 1)) + ":" + <string>(<unknown>y)] = STRUCTURE_RAMPART;
      room.memory.sites2[<string>(<unknown>exit) + ":" + <string>(<unknown>y)] = STRUCTURE_RAMPART;
      room.memory.sites2[<string>(<unknown>(exit + 1)) + ":" + <string>(<unknown>y)] = STRUCTURE_RAMPART;
    } else {
      delete (room.memory.sites[2] as Map<string, StructureConstant>)[
        <string>(<unknown>x) + ":" + <string>(<unknown>(exit - 1))
      ];
      delete (room.memory.sites[2] as Map<string, StructureConstant>)[
        <string>(<unknown>x) + ":" + <string>(<unknown>exit)
      ];
      delete (room.memory.sites[2] as Map<string, StructureConstant>)[
        <string>(<unknown>x) + ":" + <string>(<unknown>(exit + 1))
      ];
      room.memory.sites2[<string>(<unknown>x) + ":" + <string>(<unknown>(exit - 1))] = STRUCTURE_RAMPART;
      room.memory.sites2[<string>(<unknown>x) + ":" + <string>(<unknown>exit)] = STRUCTURE_RAMPART;
      room.memory.sites2[<string>(<unknown>x) + ":" + <string>(<unknown>(exit + 1))] = STRUCTURE_RAMPART;
    }
  }
  return exitExists;
}

function loopFromCenter(room: Room, x: number, y: number, size: number, callback: (x: number, y: number) => boolean) {
  let d = 3;
  let c = 0;
  let s = 1;

  for (let k = 1; k <= size - 1; k++) {
    for (let j = 0; j < (k < size - 1 ? 2 : 3); j++) {
      for (let i = 0; i < s; i++) {
        if (callback(x, y)) {
          return;
        }

        c++;
        switch (d) {
          case 0:
            y = y + 1;
            break;
          case 1:
            x = x + 1;
            break;
          case 2:
            y = y - 1;
            break;
          case 3:
            x = x - 1;
            break;
        }
      }
      d = (d + 1) % 4;
    }
    s = s + 1;
  }
  callback(x, y);
}

function getPositionPlusShapeBuffer(room: Room, type: StructureConstant): ConstructionSiteData | null {
  const center: RoomPosition = <RoomPosition>room.memory.center;
  if (!room.memory.loopCenter) {
    room.memory.loopCenter = new Map<string, boolean>();
  }
  const size: number = 38 - 2 * Math.max(Math.abs(center.x - 25), Math.abs(center.y - 25));
  let siteFound: ConstructionSiteData | null = null;
  loopFromCenter(room, center.x, center.y, size, (currentX: number, currentY: number) => {
    if (!room.memory.loopCenter) {
      room.memory.loopCenter = new Map<string, boolean>();
    }
    if (room.memory.loopCenter[<string>(<unknown>currentX) + ":" + <string>(<unknown>currentY)]) {
      return false;
    }
    room.memory.loopCenter[<string>(<unknown>currentX) + ":" + <string>(<unknown>currentY)] = true;
    let positionOk = true;
    const currentPlannedPosition: RoomPosition = new RoomPosition(currentX, currentY, room.name);
    if (
      Planner.hasPlannedStructureAt(currentPlannedPosition, false) ||
      _.filter(room.lookAt(currentX, currentY), c => {
        return c.type === "structure" || (c.type === "terrain" && c.terrain === "wall");
      }).length
    ) {
      positionOk = false;
    }
    if (positionOk) {
      const topPosition = new RoomPosition(currentX, currentY + 1, room.name);
      const topPosOk = !Planner.hasPlannedStructureAt(topPosition, true) && room.isSpotOpen(topPosition);
      const bottomPosition = new RoomPosition(currentX, currentY - 1, room.name);
      const bottomPosOk = !Planner.hasPlannedStructureAt(bottomPosition, true) && room.isSpotOpen(bottomPosition);
      const rightPosition = new RoomPosition(currentX + 1, currentY, room.name);
      const rightPosOk = !Planner.hasPlannedStructureAt(rightPosition, true) && room.isSpotOpen(rightPosition);
      const leftPosition = new RoomPosition(currentX - 1, currentY, room.name);
      const leftPosOk = !Planner.hasPlannedStructureAt(leftPosition, true) && room.isSpotOpen(leftPosition);
      positionOk = topPosOk && bottomPosOk && leftPosOk && rightPosOk;
    }
    if (positionOk) {
      siteFound = new ConstructionSiteData(new RoomPosition(currentX, currentY, room.name), type);
      return true;
    }
    return false;
  });
  return siteFound;
}

function getPositionWithBuffer(room: Room, buffer: number, type: StructureConstant): ConstructionSiteData | null {
  const center: RoomPosition = <RoomPosition>room.memory.center;
  if (!room.memory.loopCenter) {
    room.memory.loopCenter = new Map<string, boolean>();
  }
  const size: number = 38 - 2 * Math.max(Math.abs(center.x - 25), Math.abs(center.y - 25));
  let siteFound: ConstructionSiteData | null = null;
  loopFromCenter(room, center.x, center.y, size, (currentX: number, currentY: number) => {
    if (!room.memory.loopCenter) {
      room.memory.loopCenter = new Map<string, boolean>();
    }
    if (room.memory.loopCenter[<string>(<unknown>currentX) + ":" + <string>(<unknown>currentY)]) {
      return false;
    }
    room.memory.loopCenter[<string>(<unknown>currentX) + ":" + <string>(<unknown>currentY)] = true;
    let positionOk = true;
    const currentPlannedPosition: RoomPosition = new RoomPosition(currentX, currentY, room.name);
    if (
      Planner.hasPlannedStructureAt(currentPlannedPosition, false) ||
      _.filter(room.lookAt(currentX, currentY), c => {
        return c.type === "structure" || (c.type === "terrain" && c.terrain === "wall");
      }).length
    ) {
      positionOk = false;
    }
    if (buffer > 0 && positionOk) {
      loopFromCenter(room, currentX, currentY, 1 + 2 * buffer, (bufferX: number, bufferY: number) => {
        const currentBufferPosition: RoomPosition = new RoomPosition(bufferX, bufferY, room.name);
        if (
          Planner.hasPlannedStructureAt(currentBufferPosition, true) ||
          _.filter(room.lookAt(bufferX, bufferY), (c: LookAtResultWithPos) => {
            return c.type === "structure" && c.structure && c.structure.structureType !== STRUCTURE_ROAD;
          }).length
        ) {
          positionOk = false;
          return true;
        }
        return false;
      });
    }
    if (positionOk) {
      siteFound = new ConstructionSiteData(new RoomPosition(currentX, currentY, room.name), type);
      return true;
    }
    return false;
  });
  return siteFound;
}

function planBuildings(room: Room, structureType: StructureConstant) {
  const alreadyPlaced: Array<Structure> = room.find(FIND_STRUCTURES, {
    filter: (s: Structure) => {
      return s.structureType === structureType;
    }
  });
  let numberAlreadyPlanned = 0;
  _.forEach(alreadyPlaced, (s: Structure) => {
    for (let i = 0; i < 9; i++) {
      if (
        numberAlreadyPlanned < (CONTROLLER_STRUCTURES[structureType] as { [p: number]: number })[i] &&
        room.memory.sites !== undefined
      ) {
        numberAlreadyPlanned++;
        (room.memory.sites[i] as Map<string, StructureConstant>)[
          <string>(<unknown>s.pos.x) + ":" + <string>(<unknown>s.pos.y)
        ] = structureType;
        if (
          room.memory.sites2 !== undefined &&
          (structureType === STRUCTURE_SPAWN ||
            structureType === STRUCTURE_STORAGE ||
            structureType === STRUCTURE_TOWER ||
            structureType === STRUCTURE_LINK ||
            structureType === STRUCTURE_TERMINAL ||
            structureType === STRUCTURE_LAB)
        ) {
          room.memory.sites2[<string>(<unknown>s.pos.x) + ":" + <string>(<unknown>s.pos.y)] = STRUCTURE_RAMPART;
        }
        return;
      }
    }
  });
  let numberPlaced = alreadyPlaced.length;
  for (let i = 0; i < 9; i++) {
    while (numberPlaced < (CONTROLLER_STRUCTURES[structureType] as { [p: number]: number })[i]) {
      numberPlaced++;
      let constructionSiteData: ConstructionSiteData | null = null;
      if (structureType === STRUCTURE_EXTENSION) {
        constructionSiteData = getPositionPlusShapeBuffer(room, structureType);
      } else {
        constructionSiteData = getPositionWithBuffer(room, 1, structureType);
      }
      if (constructionSiteData && room.memory.sites !== undefined) {
        (room.memory.sites[i] as Map<string, StructureConstant>)[
          <string>(<unknown>constructionSiteData.pos.x) + ":" + <string>(<unknown>constructionSiteData.pos.y)
        ] = structureType;
      }
    }
  }
  room.memory[structureType + "Structure"] = true;
}
