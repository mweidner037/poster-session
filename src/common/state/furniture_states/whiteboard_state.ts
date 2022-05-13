import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../../util";
import { FurnitureState } from "../furniture_state";
import { SerialCMap } from "../serial_map";

export class WhiteboardState extends FurnitureState {
  static readonly WIDTH = 503;
  static readonly HEIGHT = 308;
  static readonly GRAN = 2;

  /**
   * Maps granular coordinate (x, y) to a variable holding the color name.
   */
  readonly pixels: SerialCMap<[x: number, y: number], string>;

  constructor(
    initToken: collabs.InitToken,
    readonly position: MyVector3,
    readonly rotation: MyVector3
  ) {
    super(initToken, position, rotation);

    this.pixels = this.addChild("pixels", collabs.Pre(SerialCMap)("both"));
  }
}
