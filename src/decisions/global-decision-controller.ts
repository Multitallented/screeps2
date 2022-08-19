import { CreepRoleEnum } from "../creep/creep-role-enum";
import { NeedCreep } from "./need-creep";
import { Util } from "../utils/util";
import { RoomObjectFixed } from "../room/room-object-fixed";
import _ from "lodash";

export class GlobalDecisionController {
  public static generateNeeds(): void {
    for (const need of Memory.creepNeeds) {
      need.old = true;
    }
    this.scanAllOccupiedRoomsForHostiles();
    this.replaceMissingFixedCreeps();
    this.generateMovingCreepNeeds();
    this.cleanupOldNeeds();
  }

  public static scanAllOccupiedRoomsForHostiles(): void {
    _.forEach(Memory.roomData, (roomData: GlobalRoomMemory, key) => {
      if (!key) {
        return;
      }
      const room = Game.rooms[key];
      if (!room) {
        return;
      }
      let ranged = 0;
      let melee = 0;
      let heal = 0;
      let creeps = 0;
      _.forEach(room.find(FIND_HOSTILE_CREEPS), (creep: Creep) => {
        if (
          _.filter(creep.body, (bodyPart: BodyPartDefinition) => {
            return bodyPart.type === ATTACK;
          }).length > 0
        ) {
          melee++;
        }
        if (
          _.filter(creep.body, (bodyPart: BodyPartDefinition) => {
            return bodyPart.type === RANGED_ATTACK;
          }).length > 0
        ) {
          ranged++;
        }
        if (
          _.filter(creep.body, (bodyPart: BodyPartDefinition) => {
            return bodyPart.type === HEAL;
          }).length > 0
        ) {
          heal++;
        }
        creeps++;
      });
      (<GlobalRoomMemory>Memory.roomData[key]).hostileStructures = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s: Structure) => {
          return s.structureType !== STRUCTURE_POWER_BANK;
        }
      }).length;
      (<GlobalRoomMemory>Memory.roomData[key]).hostilePowerCreeps = room.find(FIND_HOSTILE_POWER_CREEPS).length;
      (<GlobalRoomMemory>Memory.roomData[key]).hostileRanged = ranged;
      (<GlobalRoomMemory>Memory.roomData[key]).hostileHealer = heal;
      (<GlobalRoomMemory>Memory.roomData[key]).hostileMelee = melee;
      (<GlobalRoomMemory>Memory.roomData[key]).hostileWorkers = Math.max(0, creeps - ranged - heal - melee);

      // TODO create needs
    });
  }

  public static generateMovingCreepNeeds(): void {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room) {
        continue;
      }
      this.generateTransporterNeeds(room);
      this.generateUpgraderNeeds(room);
    }
  }

  public static cleanupOldNeeds(): void {
    Memory.creepNeeds = _.pick(Memory.creepNeeds, function (need: NeedCreep) {
      if (!need.old && need.filled) {
        const creep = Game.creeps[need.filled];
        if (creep) {
          delete creep.memory.need;
          // TODO reassign creep?
        }
      }
      return !need.old;
    });
  }

  public static generateTransporterNeeds(room: Room): void {
    if (!room.controller) {
      return;
    }
    if (!room.controller.my && room.getEnergyInStorage() < 100) {
      return;
    }
    // TODO don't send to hostile rooms
    const transporters: number = <number>room.memory.creepCount[CreepRoleEnum.TRANSPORT]
      ? <number>room.memory.creepCount[CreepRoleEnum.TRANSPORT]
      : 0;
    if (transporters < 2) {
      this.createTransporterNeed(room, transporters);
    }
  }

  public static hasNeedCreep(role: CreepRoleEnum, roomName: string, count: number, x?: number, y?: number): boolean {
    const positionDependent = x && y;
    let i = -1;
    for (const need of Memory.creepNeeds) {
      if (need.creepRole === role && (!positionDependent || (need.pos.x === x && need.pos.y === y))) {
        need.old = false;
        i++;
      }
    }
    return count <= i;
  }

  private static createTransporterNeed(room: Room, transporters: number) {
    const travelerCount = room.controller && room.controller.my ? 2 : 1;
    const mem: CreepMemory = { role: CreepRoleEnum.TRANSPORT };
    const pos = new RoomPosition(25, 25, room.name);
    for (let i = 0; i < travelerCount; i++) {
      if (this.hasNeedCreep(CreepRoleEnum.TRANSPORT, room.name, i)) {
        Memory.creepNeeds.push(
          new NeedCreep(CreepRoleEnum.TRANSPORT, transporters ? 500 : 1000, mem, pos, null, null, false)
        );
      }
    }
  }

  public static generateUpgraderNeeds(room: Room): void {
    // TODO stub
  }

  public static replaceMissingFixedCreeps(): void {
    for (const roomName in Memory.roomData) {
      const roomData: GlobalRoomMemory = <GlobalRoomMemory>Memory.roomData[roomName];
      for (const roomObjectFixed of roomData.posMap) {
        if (roomObjectFixed.creepRole) {
          this.createFixedCreepNeed(roomObjectFixed, roomName);
        }
      }
    }
  }

  private static createFixedCreepNeed(roomObjectFixed: RoomObjectFixed, roomName: string) {
    const creep = Game.creeps[roomObjectFixed.id];
    if (!creep || !creep.ticksToLive || creep.ticksToLive < 60) {
      const pos = new RoomPosition(roomObjectFixed.x, roomObjectFixed.y, roomName);
      const mem: CreepMemory = { role: roomObjectFixed.creepRole, destination: pos };
      if (this.hasNeedCreep(roomObjectFixed.creepRole, roomName, 0, pos.x, pos.y)) {
        Memory.creepNeeds.push(
          new NeedCreep(
            roomObjectFixed.creepRole,
            roomObjectFixed.priority,
            mem,
            pos,
            creep ? creep.id : null,
            null,
            false
          )
        );
      }
    }
  }
}
