import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../../util";
import { FurnitureState } from "../furniture_state";
import { SerialCVariable } from "../serial_variable";

export class EaselState extends FurnitureState {
  readonly image: SerialCVariable<Uint8Array | null>;
  /** Width in Babylon units (meters). */
  readonly width: SerialCVariable<number>;
  /** Height over width. */
  readonly heightRatio: SerialCVariable<number>;

  constructor(
    initToken: collabs.InitToken,
    readonly position: MyVector3,
    readonly rotation: MyVector3
  ) {
    super(initToken, position, rotation);

    this.image = super.addChild(
      "image",
      collabs.Pre(SerialCVariable)(null, "remote")
    );
    this.width = super.addChild(
      "width",
      collabs.Pre(SerialCVariable)(1, "remote")
    );
    this.heightRatio = super.addChild(
      "heightRatio",
      collabs.Pre(SerialCVariable)(1, "remote")
    );
  }
}
