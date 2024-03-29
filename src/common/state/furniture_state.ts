import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util";

export class FurnitureState extends collabs.CObject {
  constructor(
    initToken: collabs.InitToken,
    readonly position: MyVector3,
    readonly rotation: MyVector3
  ) {
    super(initToken);
  }
}
