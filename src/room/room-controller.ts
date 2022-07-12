import * as _ from "lodash";
import { LinkController } from "../structures/links/link-controller";
import { RoomPrototype } from "./room-prototype";
import { SpawnController } from "../structures/spawns/spawn-controller";
import { TowerController } from "../structures/towers/tower-controller";

export class RoomController {
  static runRooms() {
    RoomPrototype.init();
    _.forEach(Game.rooms, function (room: Room) {
      delete room.memory.creepCount;
      TowerController.run(room);
      room.getPlanner(room).reassignCreeps();
      SpawnController.spawnCreeps(room);
      room.getPlanner(room).buildMemory();
      room.makeConstructionSites();
      LinkController.run(room);
    });
  }
}
