import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import React from "react";
import { EaselState } from "../../../common/state";
import { MyVector3 } from "../../../common/util";
import { Overlay } from "../../components";
import { PosterEditor } from "../../components/overlays/poster_editor";
import { PosterViewer } from "../../components/overlays/poster_viewer";
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
  private readonly posterMaterial: BABYLON.StandardMaterial;
  private imageURL: string | null = null;

  constructor(state: EaselState, private readonly scene: BABYLON.Scene) {
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

    // Use a MultiMaterial so we can apply the poster image to the front
    // face only:
    // https://doc.babylonjs.com/divingDeeper/materials/using/multiMaterials
    this.posterMaterial = new BABYLON.StandardMaterial("mat0", scene);
    const otherSidesMaterial = new BABYLON.StandardMaterial("mat1", scene);
    otherSidesMaterial.diffuseColor = BABYLON.Color3.White();
    const multiMat = new BABYLON.MultiMaterial("multi", scene);
    multiMat.subMaterials.push(this.posterMaterial);
    multiMat.subMaterials.push(otherSidesMaterial);
    this.posterMesh.material = multiMat;
    const verticesCount = this.posterMesh.getTotalVertices();
    new BABYLON.SubMesh(1, 0, verticesCount, 0, 6, this.posterMesh);
    new BABYLON.SubMesh(0, 0, verticesCount, 6, 6, this.posterMesh);
    new BABYLON.SubMesh(1, 0, verticesCount, 12, 24, this.posterMesh);

    this.updatePosterTransform();
    this.updatePosterImage();
    this.state.width.on("Set", () => this.updatePosterTransform());
    this.state.heightRatio.on("Set", () => this.updatePosterTransform());
    this.state.image.on("Set", () => this.updatePosterImage());

    // Setup easelMesh.
    Globals()
      .meshStore.getMesh("furnitures/easel.gltf")
      .then((meshTemplate) => {
        if (this.mesh.isDisposed()) return;
        const easelMesh = meshTemplate.clone(
          "easel",
          this.mesh
        )! as BABYLON.Mesh;
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
    const height = this.state.heightRatio.value * this.state.width.value;
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
    if (this.state.image.value !== null) {
      this.imageURL = URL.createObjectURL(
        new Blob([this.state.image.value], { type: "image/png" })
      );
      this.posterMaterial.diffuseTexture = new BABYLON.Texture(
        this.imageURL,
        this.scene
      );
    } else {
      this.imageURL = null;
      if (this.posterMaterial.diffuseTexture !== null) {
        this.posterMaterial.diffuseTexture.dispose();
        this.posterMaterial.diffuseTexture = null;
      }
    }
  }

  canEdit(): boolean {
    return true;
  }

  edit(setOverlay: (overlay: Overlay) => void): void {
    setOverlay(() => (
      <PosterEditor
        easel={this}
        startWidth={Math.round(100 * this.state.width.value)}
        setOverlay={setOverlay}
      />
    ));
  }

  canInteract(): boolean {
    return true;
  }

  interact(setOverlay: (overlay: Overlay) => void): void {
    if (this.state.image.value === null) {
      // First interaction sets the image.
      this.edit(setOverlay);
    } else {
      // Note the overlay doesn't reference this, so it won't change if
      // the image/size changes while someone is looking at it.
      // That seems like the desired behavior.
      setOverlay(() => (
        <PosterViewer
          imageURL={this.imageURL!}
          heightRatio={this.state.heightRatio.value}
        />
      ));
    }
  }

  readonly isGround = false;

  dispose(): void {
    this.mesh.dispose(false, true);
  }
}
