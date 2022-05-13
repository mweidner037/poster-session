import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import React from "react";
import { WhiteboardState } from "../../../common/state";
import { MyVector3 } from "../../../common/util";
import { Overlay } from "../../components";
import { WhiteboardViewer } from "../../components/overlays/whiteboard_viewer";
import { setMeshSource } from "../../scene";
import { Globals } from "../../util";
import { Furniture } from "../furniture";

const BOARD_MESH_WIDTH = 1.45433;
const BOARD_MESH_POSITION = new BABYLON.Vector3(0, 1.314835, -0.0108);
const UPDATE_INTERVAL = 500;

/**
 * Whiteboard that you can draw on collaboratively.
 */
export class Whiteboard extends Furniture<WhiteboardState> {
  private readonly mesh: BABYLON.AbstractMesh;
  private readonly canvas: HTMLCanvasElement;
  private readonly texture: BABYLON.DynamicTexture;
  private updatePending = false;

  constructor(state: WhiteboardState, scene: BABYLON.Scene) {
    super(state);

    // Mesh.
    this.mesh = new BABYLON.AbstractMesh("mesh", scene);
    MyVector3.syncTo(this.state.position, this.mesh.position);
    MyVector3.syncTo(this.state.rotation, this.mesh.rotation);
    setMeshSource(this.mesh, this);

    // Canvas to draw on, used for the 3D whiteboard and the viewer overlay.
    this.canvas = document.createElement("canvas");
    this.canvas.width = WhiteboardState.GRAN * WhiteboardState.WIDTH;
    this.canvas.height = WhiteboardState.GRAN * WhiteboardState.HEIGHT;
    this.canvas.style.backgroundColor = "white";
    const ctx = this.canvas.getContext("2d")!;
    setTimeout(() => {
      // Draw initial state.
      // Have to do this async for some reason.
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      for (const [[x, y], color] of this.state.pixels) {
        console.log([[x, y], color]);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, WhiteboardState.GRAN, WhiteboardState.GRAN);
      }
      this.texture.update();
    });
    this.state.pixels.on("Set", (event) => {
      ctx.fillStyle = this.state.pixels.get(event.key)!;
      ctx.fillRect(
        event.key[0],
        event.key[1],
        WhiteboardState.GRAN,
        WhiteboardState.GRAN
      );
      this.scheduleUpdate();
    });
    this.state.pixels.on("Delete", (event) => {
      ctx.fillStyle = "white";
      ctx.fillRect(
        event.key[0],
        event.key[1],
        WhiteboardState.GRAN,
        WhiteboardState.GRAN
      );
      this.scheduleUpdate();
    });

    // Drawing mesh (for actually drawing on).
    const drawingMesh = BABYLON.MeshBuilder.CreatePlane(
      "whiteboard",
      {
        height:
          (BOARD_MESH_WIDTH * WhiteboardState.HEIGHT) / WhiteboardState.WIDTH,
        width: BOARD_MESH_WIDTH,
      },
      scene
    );
    drawingMesh.parent = this.mesh;
    drawingMesh.position = BOARD_MESH_POSITION;
    setMeshSource(drawingMesh, this);
    const drawingMeshMaterial = new BABYLON.StandardMaterial("boardMat", scene);
    this.texture = new BABYLON.DynamicTexture(
      "boardTexture",
      this.canvas,
      scene,
      false
    );
    drawingMeshMaterial.emissiveTexture = this.texture;
    drawingMesh.material = drawingMeshMaterial;

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
      });
  }

  private scheduleUpdate() {
    if (this.updatePending) return;
    this.updatePending = true;
    setTimeout(() => {
      this.texture.update();
      this.updatePending = false;
    }, UPDATE_INTERVAL);
  }

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
    setOverlay(() => (
      <WhiteboardViewer canvas={this.canvas} whiteboardState={this.state} />
    ));
  }

  readonly isGround = false;

  dispose(): void {
    this.mesh.dispose(false, true);
  }
}
