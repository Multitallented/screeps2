import { CreepRoleEnum } from "../creep/creep-role-enum";
import { NeedCreep } from "./need-creep";
import { Util } from "../utils/util";
import { RoomObjectFixed } from "../room/room-object-fixed";
import _ from "lodash";

export class GlobalDecisionController {
  public static generateNeeds(): void {
    this.scanAllOccupiedRoomsForHostiles();
    this.replaceMissingFixedCreeps();
    this.generateMovingCreepNeeds();
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
      (Memory.roomData[key] as GlobalRoomMemory).hostileStructures = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: (s: Structure) => {
          return s.structureType !== STRUCTURE_POWER_BANK;
        }
      }).length;
      (Memory.roomData[key] as GlobalRoomMemory).hostilePowerCreeps = room.find(FIND_HOSTILE_POWER_CREEPS).length;
      (Memory.roomData[key] as GlobalRoomMemory).hostileRanged = ranged;
      (Memory.roomData[key] as GlobalRoomMemory).hostileHealer = heal;
      (Memory.roomData[key] as GlobalRoomMemory).hostileMelee = melee;
      (Memory.roomData[key] as GlobalRoomMemory).hostileWorkers = Math.max(0, creeps - ranged - heal - melee);

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
      this.cleanupOldNeeds(room);
    }
  }

  public static cleanupOldNeeds(room: Room): void {
    const roomData = Util.getRoomData(room.name);
    roomData.creepNeeds = _.pick(roomData.creepNeeds, function (need: NeedCreep, key) {
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
    if (transporters < 1) {
      this.createTransporterNeed(room, transporters);
    }
  }

  private static createTransporterNeed(room: Room, transporters: number) {
    const mem: CreepMemory = { role: CreepRoleEnum.TRANSPORT };
    const pos = new RoomPosition(25, 25, room.name);
    const roomData = Util.getRoomData(room.name);
    const key = Util.getNeedKey(CreepRoleEnum.TRANSPORT, pos);
    if (!roomData.creepNeeds[key]) {
      roomData.creepNeeds[key] = new NeedCreep(
        CreepRoleEnum.TRANSPORT,
        transporters ? 500 : 1000,
        mem,
        pos,
        null,
        null,
        false
      );
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
          this.createFixedCreepNeed(roomObjectFixed, roomName, roomData);
        }
      }
    }
  }

  private static createFixedCreepNeed(roomObjectFixed: RoomObjectFixed, roomName: string, roomData: GlobalRoomMemory) {
    const creep = Game.creeps[roomObjectFixed.id];
    if (!creep || !creep.ticksToLive || creep.ticksToLive < 60) {
      const pos = new RoomPosition(roomObjectFixed.x, roomObjectFixed.y, roomName);
      const mem: CreepMemory = { role: roomObjectFixed.creepRole, destination: pos };
      const key = Util.getNeedKey(roomObjectFixed.creepRole, pos);
      if (!roomData.creepNeeds[key]) {
        roomData.creepNeeds[key] = new NeedCreep(
          roomObjectFixed.creepRole,
          roomObjectFixed.priority,
          mem,
          pos,
          creep ? creep.id : null,
          null,
          false
        );
      }
    }
  }
}
