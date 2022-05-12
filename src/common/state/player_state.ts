import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util";
import { SerialCVariable } from "./serial_variable";

export class PlayerState extends collabs.CObject {
  readonly position: SerialCVariable<MyVector3>;
  readonly rotation: SerialCVariable<MyVector3>;
  readonly displayName: SerialCVariable<string>;
  /** A number in [0, 360]. */
  readonly hue: SerialCVariable<number>;
  /**
   * Indicates whether this player has successfully connected to the PeerJS
   * calling server, hence can be called.
   *
   * For now, this only goes from false to true.
   */
  readonly callReady: SerialCVariable<boolean>;

  constructor(
    initToken: collabs.InitToken,
    initialPosition: MyVector3,
    initialRotation: MyVector3,
    readonly peerID: string,
    initialDisplayName: string,
    initialHue: number
  ) {
    super(initToken);

    this.position = this.addChild(
      "p",
      collabs.Pre(SerialCVariable)(initialPosition, "local")
    );
    this.rotation = this.addChild(
      "r",
      collabs.Pre(SerialCVariable)(initialRotation, "local")
    );
    this.displayName = this.addChild(
      "displayName",
      collabs.Pre(SerialCVariable)(initialDisplayName, "local")
    );
    this.hue = this.addChild(
      "hue",
      collabs.Pre(SerialCVariable)(initialHue, "local")
    );
    this.callReady = this.addChild(
      "callReady",
      collabs.Pre(SerialCVariable)(false, "local")
    );
  }
}
