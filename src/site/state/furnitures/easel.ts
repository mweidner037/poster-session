import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { EaselState } from "../../../common/state";
import { MyVector3 } from "../../../common/util";
import { setMeshSource } from "../../scene";
import { Globals } from "../../util";
import { Furniture } from "../furniture";

const POSTER_DEPTH = 0.005;
const POSTER_BOTTOM = MyVector3.new(0, 0.61892, 0.17432);
/** 13 degree tilt backwards from vertical. */
const POSTER_ANGLE = (13 * Math.PI) / 180;
// const POSTER_TOP_REST = MyVector3.new(0, 1.3327, 0.34289, );

/**
 * Easel that you can add a poster to.
 */
export class Easel extends Furniture<EaselState> {
  private readonly mesh: BABYLON.AbstractMesh;
  private readonly posterMesh: BABYLON.Mesh;

  constructor(state: EaselState, scene: BABYLON.Scene) {
    super(state);

    // Mesh.
    this.mesh = new BABYLON.AbstractMesh("mesh");
    MyVector3.syncTo(this.state.position, this.mesh.position);
    MyVector3.syncTo(this.state.rotation, this.mesh.rotation);
    setMeshSource(this.mesh, this);

    // Poster mesh.
    this.posterMesh = BABYLON.MeshBuilder.CreateBox(
      "poster",
      {
        // height and width are scaled later to match the actual poster size.
        height: 1,
        width: 1,
        depth: POSTER_DEPTH,
      },
      scene
    );
    this.posterMesh.parent = this.mesh;
    // TODO: use exact line; change to 15 degrees when shorter than the easel's
    // top.
    this.posterMesh.rotation.x = POSTER_ANGLE;
    setMeshSource(this.posterMesh, this);
    this.updatePosterTransform();
    this.updatePosterImage();
    this.state.width.on("Set", () => this.updatePosterTransform());
    this.state.image.on("Set", () => this.updatePosterImage());

    Globals()
      .meshStore.getMesh("furnitures/easel.gltf", 1)
      .then((meshTemplate) => {
        if (this.mesh.isDisposed()) return;
        // Setup easelMesh.
        const easelMesh = <BABYLON.Mesh>(
          meshTemplate.clone("player", this.mesh)!
        );
        easelMesh.setEnabled(true);
        setMeshSource(easelMesh, this);
      });
  }

  /**
   * Updates posterMesh's transform so it is the right size and configuration,
   * according to this.state.
   */
  private updatePosterTransform() {
    this.posterMesh.scaling.x = this.state.width.value;
    const height = this.getPosterHeight();
    this.posterMesh.scaling.y = height;
    // The poster is a rectangle with the origin at its center, in local
    // coordinates. We need to transform it so that its bottom back center is
    // at POSTER_BOTTOM.
    this.posterMesh.position.y =
      POSTER_DEPTH * Math.sin(POSTER_ANGLE) +
      POSTER_BOTTOM.y +
      (height / 2) * Math.cos(POSTER_ANGLE);
    this.posterMesh.position.z =
      -POSTER_DEPTH + POSTER_BOTTOM.z + (height / 2) * Math.sin(POSTER_ANGLE);
  }

  /**
   * Update posterMesh's texture so it displays the state's image.
   */
  private updatePosterImage() {
    // TODO
  }

  private getPosterHeight(): number {
    if (this.state.image === null) return this.state.width.value;
    // TODO
    return 1;
  }

  canEdit(): boolean {
    // TODO: remove
    console.log("canEdit", this.state.position);
    return false;
  }

  edit(): void {
    throw new Error("Cannot edit");
  }

  canInteract(): boolean {
    // TODO: remove
    console.log("canInteract", this.state.position);
    return false;
  }

  interact(): void {
    throw new Error("Cannot interact");
  }

  readonly isGround = false;

  dispose(): void {
    this.mesh.dispose(false, true);
  }
}
