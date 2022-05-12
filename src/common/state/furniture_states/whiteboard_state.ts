import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../../util";
import { FurnitureState } from "../furniture_state";
import { SerialCMap } from "../serial_map";

export class WhiteboardState extends FurnitureState {
  // TODO: find out what these are for the furniture.
  static readonly WIDTH = 500;
  static readonly HEIGHT = 300;

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
