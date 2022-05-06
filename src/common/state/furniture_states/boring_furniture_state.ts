import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../../util";
import { FurnitureState } from "../furniture_state";

export class BoringFurnitureState extends FurnitureState {
  constructor(
    initToken: collabs.InitToken,
    readonly position: MyVector3,
    readonly rotation: MyVector3,
    /** The mesh's filename within assets/furnitures. */
    readonly mesh: string
  ) {
    super(initToken, position, rotation);
  }
}
