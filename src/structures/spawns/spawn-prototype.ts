import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { CreepSpawnData } from "../../creeps/creep-spawn-data";

const spawnNextCreep = function (this: StructureSpawn) {
  if (this.spawning) {
    // this.room.displayMessage(this.pos, this.spawning.name);
    return;
  }

  const nextCreepToSpawn: CreepSpawnData | null = this.room.getPlanner(this.room).getNextCreepToSpawn();
  if (
    nextCreepToSpawn &&
    nextCreepToSpawn.options &&
    nextCreepToSpawn.options.memory &&
    nextCreepToSpawn.options.memory.role
  ) {
    const creepEnum: CreepRoleEnum = CreepRoleEnum[nextCreepToSpawn.options.memory.role] as CreepRoleEnum;
    const creepCount = this.room.creepCountArray.get(creepEnum);
    if (creepCount) {
      this.room.creepCountArray.set(creepEnum, creepCount + 1);
    } else {
      this.room.creepCountArray.set(creepEnum, 1);
    }
    nextCreepToSpawn.options.memory.homeRoom = this.room.name;
    this.room.visual.text(nextCreepToSpawn.options.memory.role, this.pos.x + 1, this.pos.y, { align: "left" });
    if (
      nextCreepToSpawn.getEnergyRequired() <= this.room.energyAvailable &&
      (nextCreepToSpawn.getEnergyRequired() + 100 < this.room.energyAvailable ||
        this.room.energyAvailable / this.room.energyCapacityAvailable >= nextCreepToSpawn.minPercentCapacity)
    ) {
      this.spawnCreep(nextCreepToSpawn.bodyArray, nextCreepToSpawn.name, nextCreepToSpawn.options);
    }
  }
};

declare global {
  interface StructureSpawn {
    spawnNextCreep();
    init: boolean;
  }
}

export class SpawnPrototype {
  public static init(): void {
    if (!StructureSpawn.hasOwnProperty("init")) {
      StructureSpawn.prototype.spawnNextCreep = spawnNextCreep;
      StructureSpawn.prototype.init = true;
    }
  }
}
