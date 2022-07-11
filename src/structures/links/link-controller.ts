import * as _ from "lodash";

export class LinkController {
  public static run(room: Room): void {
    let closestLink: StructureLink | null = null;
    let closestLinkRange = 99;
    const myLinks = room.find(FIND_MY_STRUCTURES, {
      filter: (s: Structure) => {
        return s.structureType === STRUCTURE_LINK;
      }
    });
    _.forEach(myLinks, (link: StructureLink) => {
      if (!link.room.controller) {
        return;
      }
      const range = link.pos.getRangeTo(link.room.controller.pos);
      if (closestLink == null || closestLinkRange > range) {
        closestLink = link;
        closestLinkRange = range;
      }
    });
    if (closestLink !== null && room.memory != null && room.memory.closestLink == null) {
      room.memory.closestLink = (<StructureLink>closestLink).id;
    }
    _.forEach(myLinks, (link: StructureLink) => {
      if (closestLink !== null && closestLink.id !== link.id && link.cooldown < 1 && link.store.energy > 0) {
        link.transferEnergy(
          closestLink,
          Math.min(link.store.energy, closestLink.store.getFreeCapacity(RESOURCE_ENERGY))
        );
      }
    });
  }
}
