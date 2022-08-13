import {NeedCreep} from "./need-creep";
import {CreepRoleEnum} from "../creep/creep-role-enum";

export class GlobalDecisionController {
  public static needs: Array<NeedCreep>;

  public static generateNeeds() {
    this.needs = new Array<NeedCreep>();
    this.replaceMissingFixedCreeps();
    this.generateMovingCreepNeeds();
  }

  public static generateMovingCreepNeeds() {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (!room) {
        continue;
      }
      this.generateTransporterNeeds(room);
      this.generateUpgraderNeeds(room);
    }
  }

  public static generateTransporterNeeds(room: Room) {
    if (!room.controller) {
      return;
    }
    if (!room.controller.my && room.getEnergyInStorage() < 100) {
      return;
    }
    // TODO don't send to hostile rooms
    const transporters = room.memory.creepCount[CreepRoleEnum.TRANSPORT] ? room.memory.creepCount[CreepRoleEnum.TRANSPORT] : 0;
    if (transporters < 2) {
      const mem: CreepMemory = {role: CreepRoleEnum.TRANSPORT};
      const pos = new RoomPosition(25, 25, room.name);
      this.needs.push(new NeedCreep(CreepRoleEnum.TRANSPORT, transporters ? 500 : 1000, mem, pos, null));
    }
  }

  public static generateUpgraderNeeds(room: Room) {
    // TODO stub
  }

  public static replaceMissingFixedCreeps() {
    for (const roomName in Memory.roomData) {
      const roomData: GlobalRoomMemory = Memory.roomData[roomName];
      for (const roomObjectFixed of roomData.posMap) {
        if (roomObjectFixed.creepRole) {
          const creep = Game.creeps[roomObjectFixed.id];
          if (!creep || !creep.ticksToLive || creep.ticksToLive < 60) {
            const pos = new RoomPosition(roomObjectFixed.x, roomObjectFixed.y, roomName);
            const mem: CreepMemory = {role: roomObjectFixed.creepRole, destination: pos};
            this.needs.push(new NeedCreep(roomObjectFixed.creepRole, roomObjectFixed.priority, mem, pos, creep ? creep.id : null));
          }
        }
      }
    }
  }
}
