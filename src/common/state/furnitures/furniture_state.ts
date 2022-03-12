import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../../util/babylon_types";

export class FurnitureState extends collabs.CObject {
  constructor(
    initToken: collabs.InitToken,
    readonly position: MyVector3,
    readonly rotation: MyVector3,
    readonly type: string
  ) {
    super(initToken);
  }
}
