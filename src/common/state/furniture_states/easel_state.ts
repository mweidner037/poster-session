import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../../util";
import { FurnitureState } from "../furniture_state";
import { SerialCRegister } from "../serial_register";

export class EaselState extends FurnitureState {
  readonly image: SerialCRegister<Uint8Array | null>;
  /** Width in Babylon units (meters). */
  readonly width: SerialCRegister<number>;
  /** Height over width. */
  readonly heightRatio: SerialCRegister<number>;

  constructor(
    initToken: collabs.InitToken,
    readonly position: MyVector3,
    readonly rotation: MyVector3
  ) {
    super(initToken, position, rotation);

    this.image = super.addChild(
      "image",
      collabs.Pre(SerialCRegister)(null, "remote")
    );
    this.width = super.addChild(
      "width",
      collabs.Pre(SerialCRegister)(1, "remote")
    );
    this.heightRatio = super.addChild(
      "heightRatio",
      collabs.Pre(SerialCRegister)(1, "remote")
    );
  }
}
