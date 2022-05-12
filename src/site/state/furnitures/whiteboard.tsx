import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import React from "react";
import { WhiteboardState } from "../../../common/state";
import { MyVector3 } from "../../../common/util";
import { Overlay } from "../../components";
import { WhiteboardViewer } from "../../components/overlays/whiteboard_viewer";
import { setMeshSource } from "../../scene";
import { Globals } from "../../util";
import { Furniture } from "../furniture";

/**
 * Whiteboard that you can draw on collaboratively.
 */
export class Whiteboard extends Furniture<WhiteboardState> {
  private readonly mesh: BABYLON.AbstractMesh;
  // private readonly drawingMaterial: BABYLON.StandardMaterial;

  constructor(state: WhiteboardState, private readonly scene: BABYLON.Scene) {
    super(state);

    // Mesh.
    this.mesh = new BABYLON.AbstractMesh("mesh");
    MyVector3.syncTo(this.state.position, this.mesh.position);
    MyVector3.syncTo(this.state.rotation, this.mesh.rotation);
    setMeshSource(this.mesh, this);

    // Drawing mesh (for actually drawing on).
    // TODO: create as plane, positioned just in front of the board model.
    // this.posterMesh = BABYLON.MeshBuilder.CreateBox(
    //   "poster",
    //   {
    //     // height and width are scaled later to match the actual poster size.
    //     height: 1,
    //     width: 1,
    //     depth: POSTER_DEPTH,
    //   },
    //   scene
    // );
    // this.posterMesh.parent = this.mesh;
    // setMeshSource(this.posterMesh, this);

    // Setup whiteboard model.
    Globals()
      .meshStore.getMesh("furnitures/whiteboard.obj")
      .then((meshTemplate) => {
        if (this.mesh.isDisposed()) return;
        const whiteboardMesh = (meshTemplate as BABYLON.TransformNode).clone(
          "whiteboard",
          this.mesh
        )! as BABYLON.Mesh;
        whiteboardMesh.setEnabled(true);
        setMeshSource(whiteboardMesh, this);
      });
  }
  //
  // /**
  //  * Update posterMesh's texture so it displays the state's image.
  //  */
  // private updatePosterImage() {
  //   if (this.state.image.value !== null) {
  //     this.imageURL = URL.createObjectURL(
  //       new Blob([this.state.image.value], { type: "image/png" })
  //     );
  //     this.posterMaterial.diffuseTexture = new BABYLON.Texture(
  //       this.imageURL,
  //       this.scene
  //     );
  //   } else {
  //     this.imageURL = null;
  //     if (this.posterMaterial.diffuseTexture !== null) {
  //       this.posterMaterial.diffuseTexture.dispose();
  //       this.posterMaterial.diffuseTexture = null;
  //     }
  //   }
  // }

  canEdit(): boolean {
    return false;
  }

  edit(): void {
    throw new Error("Cannot edit");
  }

  canInteract(): boolean {
    return true;
  }

  interact(setOverlay: (overlay: Overlay) => void): void {
    setOverlay(() => <WhiteboardViewer whiteboardState={this.state} />);
  }

  readonly isGround = false;

  dispose(): void {
    this.mesh.dispose(false, true);
  }
}
