export class CreepController {
  public static run(): void {
    _.forEach(Game.creeps, creep => {
      if (!creep.memory.need) {
        let needs = Memory.creepNeeds;
        needs = _.sortBy(needs, need => {
          return need.priority;
        });
        for (const need of needs) {
          if (need.creepRole === creep.memory.role && (need.spawning || !need.filled)) {
            need.spawning = false;
            need.filled = creep.id;
            creep.memory.need = need.pos.roomName;
          }
        }
      }
      creep.runAction();
    });
  }
}
