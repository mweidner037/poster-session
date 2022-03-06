import { Mesh } from "@babylonjs/core/Meshes/mesh"; // Okay on server because type only
import * as collabs from "@collabs/collabs";
import { MyVector3 } from "../util/babylon_types";
import { MyVector3Serializer } from "../util/serialization";
import { SerialCRegister } from "./serial_register";

export class Entity extends collabs.CObject {
  readonly position: SerialCRegister<MyVector3>;
  readonly rotation: SerialCRegister<MyVector3>;

  // Local mesh, set by setMash sometime after creation if we are a client.
  mesh!: Mesh;

  constructor(
    initToken: collabs.InitToken,
    initialPosition: MyVector3,
    initialRotation: MyVector3 = new MyVector3(0, 0, 0)
  ) {
    super(initToken);

    this.position = this.addChild(
      "p",
      collabs.Pre(SerialCRegister)(
        initialPosition,
        "local",
        MyVector3Serializer.instance
      )
    );
    this.rotation = this.addChild(
      "r",
      collabs.Pre(SerialCRegister)(
        initialRotation,
        "local",
        MyVector3Serializer.instance
      )
    );

    this.position.on("Set", (e) => {
      if (this.mesh && !e.meta.isLocalEcho) this.setMeshPosition();
    });
    this.rotation.on("Set", (e) => {
      if (this.mesh && !e.meta.isLocalEcho) this.setMeshRotation();
    });
  }

  setMesh(mesh: Mesh) {
    this.mesh = mesh;
    this.setMeshPosition();
    this.setMeshRotation();
  }

  private setMeshPosition() {
    const newPos = this.position.value;
    this.mesh.position.x = newPos.x;
    this.mesh.position.y = newPos.y;
    this.mesh.position.z = newPos.z;
  }

  private setMeshRotation() {
    const newRot = this.rotation.value;
    this.mesh.rotation.x = newRot.x;
    this.mesh.rotation.y = newRot.y;
    this.mesh.rotation.z = newRot.z;
  }
}
