export interface CreepRole {
  doAction(creep: Creep): boolean;
  buildCreep(energy: number): Array<BodyPartConstant>;
}
