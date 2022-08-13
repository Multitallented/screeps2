import {CreepRole} from "../creep-role";

export class CreepRoleTransfer implements CreepRole {
  constructor(private creep: Creep) {
  }

  doAction(): boolean {
    if (!this.creep.memory.destination) {
      return false;
    }
    const fixedPos = this.creep.memory.destination;
    if (this.creep.pos !== fixedPos) {
      if (!this.creep.fatigue) {
        const moveResponse = this.creep.moveTo(fixedPos, {reusePath: 999, maxRooms: 1});
        if (moveResponse === ERR_NO_PATH) {
          return false;
        }
      }
    }
    if (this.creep.pos !== fixedPos) {
      return true;
    }

    const withdraw = this.creep.memory.withdraw;
    if (this.creep.store.energy > 49) {
      const nearestContainerList = this.creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: (s:Structure) => {
          return (s.structureType === STRUCTURE_CONTAINER && (<StructureContainer>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49 && !(withdraw || this.creep.room.memory.storage.indexOf(s.id) === -1)) ||
            (!withdraw && s.structureType === STRUCTURE_LINK && this.creep.room.memory.storeEnergy && (<StructureLink>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49) ||
            (s.structureType === STRUCTURE_EXTENSION && (<StructureExtension>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49) ||
            (s.structureType === STRUCTURE_SPAWN && (<StructureSpawn>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49) ||
            (!withdraw && s.structureType === STRUCTURE_STORAGE && (<StructureStorage>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49);
        }});
      if (nearestContainerList.length > 0) {
        this.creep.transfer(nearestContainerList[0], RESOURCE_ENERGY, 50);
        return true;
      }
    } else {
      const nearestEnergyContainer = this.creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: (s:Structure) => {
          return (s.structureType === STRUCTURE_CONTAINER && (<StructureContainer>s).store.energy > 49 && (withdraw || this.creep.room.memory.storage.indexOf(s.id) === -1)) ||
            (withdraw && s.structureType === STRUCTURE_LINK && this.creep.room.memory.storeEnergy && (<StructureLink>s).store.energy > 49) ||
            (withdraw && s.structureType === STRUCTURE_STORAGE && (<StructureStorage>s).store.energy > 49);
        }});
      if (nearestEnergyContainer.length > 0) {
        this.creep.withdraw(nearestEnergyContainer[0], RESOURCE_ENERGY, 50);
        return true;
      }
    }
    return false;
  }

  buildCreep(energy: number): Array<BodyPartConstant> {
    return [ MOVE, CARRY ];
  }
}
