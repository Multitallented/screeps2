import { CreepRole } from "../creep-role";

export class CreepRoleTransfer implements CreepRole {
  doAction(creep: Creep): boolean {
    if (!creep.memory.destination) {
      return false;
    }
    const fixedPos = creep.memory.destination;
    if (creep.pos !== fixedPos) {
      if (!creep.fatigue) {
        const moveResponse = creep.moveTo(fixedPos, { reusePath: 999, maxRooms: 1 });
        if (moveResponse === ERR_NO_PATH) {
          return false;
        }
      }
    }
    if (creep.pos !== fixedPos) {
      return true;
    }

    const withdraw = creep.memory.withdraw;
    if (creep.store.energy > 49) {
      const nearestContainerList = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (s: Structure) => {
          return (
            (s.structureType === STRUCTURE_CONTAINER &&
              (<StructureContainer>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49 &&
              !(withdraw || creep.room.memory.storage.indexOf(s.id) === -1)) ||
            (!withdraw &&
              s.structureType === STRUCTURE_LINK &&
              creep.room.memory.storeEnergy &&
              (<StructureLink>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49) ||
            (s.structureType === STRUCTURE_EXTENSION &&
              (<StructureExtension>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49) ||
            (s.structureType === STRUCTURE_SPAWN && (<StructureSpawn>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49) ||
            (!withdraw &&
              s.structureType === STRUCTURE_STORAGE &&
              (<StructureStorage>s).store.getFreeCapacity(RESOURCE_ENERGY) > 49)
          );
        }
      });
      if (nearestContainerList.length > 0) {
        creep.transfer(nearestContainerList[0], RESOURCE_ENERGY, 50);
        return true;
      }
    } else {
      const nearestEnergyContainer = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (s: Structure) => {
          return (
            (s.structureType === STRUCTURE_CONTAINER &&
              (<StructureContainer>s).store.energy > 49 &&
              (withdraw || creep.room.memory.storage.indexOf(s.id) === -1)) ||
            (withdraw &&
              s.structureType === STRUCTURE_LINK &&
              creep.room.memory.storeEnergy &&
              (<StructureLink>s).store.energy > 49) ||
            (withdraw && s.structureType === STRUCTURE_STORAGE && (<StructureStorage>s).store.energy > 49)
          );
        }
      });
      if (nearestEnergyContainer.length > 0) {
        creep.withdraw(nearestEnergyContainer[0], RESOURCE_ENERGY, 50);
        return true;
      }
    }
    return false;
  }

  buildCreep(energy: number): Array<BodyPartConstant> {
    return [MOVE, CARRY];
  }
}
