import * as _ from "lodash";

export class MineEnergyAction {
  static KEY = "mine-energy";

  public static run(creep: Creep): void {
    const freeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
    let workPartCount = 0;
    _.forEach(creep.body, (bodyPart: BodyPartDefinition) => {
      if (bodyPart.type === WORK) {
        workPartCount += 1;
      }
    });
    if (freeCapacity < workPartCount * 2) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    if (!creep.memory.target) {
      const newSource: Source = <Source>creep.room.findNextEnergySource(creep);
      if (newSource) {
        creep.memory.target = newSource.id;
      } else {
        creep.setNextAction();
        return;
      }
    }
    const source: Source = Game.getObjectById(creep.memory.target) as Source;
    if (!source || source.energy < 1) {
      delete creep.memory.target;
      creep.setNextAction();
      return;
    }
    if (!creep.pos.inRangeTo(source, 1)) {
      creep.moveToTarget();
      return;
    }
    creep.harvest(source);
  }

  public static setActionWithTarget(creep: Creep, target: Source): void {
    creep.memory.action = this.KEY;
    creep.memory.target = target.id;
    creep.say("⚡ mine");
    // creep.say('🔄 harvest');
  }

  public static setAction(creep: Creep): void {
    creep.memory.action = this.KEY;
    delete creep.memory.target;
    const source: Source = <Source>creep.room.findNextEnergySource(creep);
    if (source) {
      creep.memory.target = source.id;
    }
    creep.say("⚡ mine");
    // creep.say('🔄 harvest');
  }
}
