import * as _ from "lodash";

export class MineEnergyAction {
  static KEY = "mine-energy";

  public static run(creep: Creep): boolean {
    const freeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let workPartCount = 0;
    _.forEach(creep.body, (bodyPart: BodyPartDefinition) => {
      if (bodyPart.type === WORK) {
        workPartCount += 1;
      }
    });
    if (freeCapacity < workPartCount * 2) {
      delete creep.memory.target;
      return false;
    }
    if (!creep.memory.target) {
      return false;
    }
    let creepsMining = 0;
    _.forEach(creep.room.find(FIND_MY_CREEPS), (cCreep: Creep) => {
      if (cCreep.memory.target === creep.memory.target) {
        creepsMining++;
      }
    });
    const source: Source = Game.getObjectById(creep.memory.target) as Source;
    if (!source || source.energy < 1) {
      delete creep.memory.target;
      return false;
    }
    if (!creep.pos.inRangeTo(source, 1)) {
      if (!creep.fatigue) {
        creep.moveTo(source.pos, { reusePath: 999, maxRooms: 1 });
      }
      return true;
    }
    creep.harvest(source);
    return true;
  }

  public static setActionWithTarget(creep: Creep, target: Source): void {
    creep.memory.action = this.KEY;
    creep.memory.target = target.id;
    if (Memory.debug) {
      creep.say("⚡ mine");
    }
  }

}
