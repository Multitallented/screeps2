import { CreepRoleEnum } from "../../creeps/roles/creep-role-enum";
import { CreepSpawnData } from "../../creeps/creep-spawn-data";

const spawnNextCreep = function (this: StructureSpawn): boolean {
  if (this.spawning) {
    // this.room.displayMessage(this.pos, this.spawning.name);
    return true;
  }

  const nextCreepToSpawn: CreepSpawnData | null = this.room.getPlanner(this.room).getNextCreepToSpawn();
  if (nextCreepToSpawn && nextCreepToSpawn.options.memory && nextCreepToSpawn.options.memory.role) {
    const creepEnum: CreepRoleEnum = nextCreepToSpawn.options.memory.role;
    this.room.incrementAndDecrement(this.room, creepEnum, null);
    if (nextCreepToSpawn.options.memory) {
      nextCreepToSpawn.options.memory.homeRoom = this.room.name;
    }
    this.room.visual.text(nextCreepToSpawn.options.memory.role, this.pos.x + 1, this.pos.y, { align: "left" });
    if (
      nextCreepToSpawn.getEnergyRequired() <= this.room.energyAvailable &&
      (nextCreepToSpawn.getEnergyRequired() + 100 < this.room.energyAvailable ||
        this.room.energyAvailable / this.room.energyCapacityAvailable >= nextCreepToSpawn.minPercentCapacity)
    ) {
      this.spawnCreep(nextCreepToSpawn.bodyArray, nextCreepToSpawn.name, nextCreepToSpawn.options);
      return true;
    }
  }
  return false;
};

declare global {
  interface StructureSpawn {
    spawnNextCreep(): boolean;
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
