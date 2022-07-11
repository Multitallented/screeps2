export class Util {
  public static getRoomPositionKey(x: number, y: number): string {
    return <string>(<unknown>x) + ":" + <string>(<unknown>y);
  }
}
