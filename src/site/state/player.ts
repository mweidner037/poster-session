import { PlayerState } from "../../common/state";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import {
  ROTATION_FOLLOW_SPEED,
  TRANSLATION_FOLLOW_SPEED,
} from "../../common/consts";
import { calcVolumes } from "../calling/calc_volumes";
import { PeerJSConnection } from "../calling";

const NAME_WIDTH = 2;
const NAME_HEIGHT = 0.3;
const NAME_POSITION = new BABYLON.Vector3(0, 1.5, 0);
const TEXTURE_HEIGHT = 60; // In pixels
const TEXTURE_WIDTH = Math.ceil((TEXTURE_HEIGHT * NAME_WIDTH) / NAME_HEIGHT); // Preserve aspect ratio
const MAX_FONT_SIZE = Math.floor(TEXTURE_HEIGHT * (4 / 3) * 0.8); // Texture height in pt, scaled by 0.8 for margin

const HIGHLIGHT_COLOR = BABYLON.Color3.Green();
export const HIGHLIGHT_THRESHOLD = 70;

export class Player {
  readonly mesh: BABYLON.AbstractMesh;
  private readonly displayMeshMaterial: BABYLON.StandardMaterial;
  private readonly namePlane: BABYLON.Mesh;
  private readonly namePlaneDT: BABYLON.DynamicTexture;
  audioConn: PeerJSConnection | null = null;

  constructor(
    readonly state: PlayerState,
    private readonly displayMesh: BABYLON.Mesh,
    private readonly highlightLayer: BABYLON.HighlightLayer,
    scene: BABYLON.Scene
  ) {
    this.mesh = new BABYLON.AbstractMesh("mesh");

    // Setup displayMesh.
    displayMesh.parent = this.mesh;
    this.displayMeshMaterial = new BABYLON.StandardMaterial("bear_mat", scene);
    displayMesh.material = this.displayMeshMaterial;

    // Setup namePlane and the DynamicTexture for writing on it.
    this.namePlane = BABYLON.MeshBuilder.CreatePlane(
      "plane",
      { width: NAME_WIDTH, height: NAME_HEIGHT },
      scene
    );
    this.namePlane.parent = this.mesh;
    this.namePlane.position = NAME_POSITION;
    this.namePlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    this.namePlaneDT = new BABYLON.DynamicTexture(
      "planeDT",
      {
        width: TEXTURE_WIDTH,
        height: TEXTURE_HEIGHT,
      },
      scene,
      false
    );

    const namePlaneMaterial = new BABYLON.StandardMaterial("plane_mat", scene);
    namePlaneMaterial.ambientColor = new BABYLON.Color3(1, 1, 1);
    namePlaneMaterial.diffuseTexture = this.namePlaneDT;
    namePlaneMaterial.diffuseTexture.hasAlpha = true;
    this.namePlane.material = namePlaneMaterial;

    // Display initial values.
    this.state.position.value.syncTo(this.mesh.position);
    this.state.rotation.value.syncTo(this.mesh.rotation);
    this.onHueSet();
    // this.onDisplayNameSet(); // Called by onHueSet.

    // Sync state to values, except those set during ticks.
    this.state.hue.on("Set", () => this.onHueSet());
    this.state.displayName.on("Set", () => this.onDisplayNameSet());
  }

  private onHueSet() {
    BABYLON.Color3.HSVtoRGBToRef(
      this.state.hue.value,
      1,
      0.5,
      this.displayMeshMaterial.diffuseColor
    );
    this.onDisplayNameSet();
  }

  private onDisplayNameSet() {
    // See https://doc.babylonjs.com/divingDeeper/materials/using/dynamicTexture#fit-text-into-an-area
    const ctx = this.namePlaneDT.getContext();
    ctx.font = MAX_FONT_SIZE + "px Arial";
    const textWidth = ctx.measureText(this.state.displayName.value).width;
    const ratio = Math.min(1, TEXTURE_WIDTH / textWidth);
    const fontSize = Math.floor(ratio * MAX_FONT_SIZE);
    // Center x.
    const x = TEXTURE_WIDTH > textWidth ? (TEXTURE_WIDTH - textWidth) / 2 : 0;
    ctx.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    this.namePlaneDT.drawText(
      this.state.displayName.value,
      x,
      null,
      fontSize + "px Arial",
      `hsl(${this.state.hue.value}, 100%, 50%)`,
      "transparent"
    );
  }

  /**
   * Only called on non-player entities.
   */
  littleTick(deltaSec: number): void {
    // Move this.mesh towards the intended state at
    // a bounded speed.
    this.state.position.value.moveToThis(
      this.mesh.position,
      TRANSLATION_FOLLOW_SPEED,
      deltaSec
    );
    this.state.rotation.value.moveToThis(
      this.mesh.rotation,
      ROTATION_FOLLOW_SPEED,
      deltaSec
    );
  }

  /**
   * Only called on non-player entities.
   */
  bigTick(ourPlayer: Player): void {
    // Update volume levels by distance and angle.
    if (this.audioConn !== null) {
      this.audioConn.audio.setVolume(
        ...calcVolumes(
          this.mesh.position,
          this.mesh.rotation,
          ourPlayer.mesh.position,
          ourPlayer.mesh.rotation
        )
      );
      // TODO: also do highlights for ourPlayer.
      this.setHighlighted(
        this.audioConn.audio.getLevel() > HIGHLIGHT_THRESHOLD
      );
    }
  }

  private isHighlighted = false;
  setHighlighted(highlight: boolean) {
    if (highlight !== this.isHighlighted) {
      if (highlight) {
        this.highlightLayer.addMesh(this.displayMesh, HIGHLIGHT_COLOR);
      } else {
        this.highlightLayer.removeMesh(this.displayMesh);
      }
      this.isHighlighted = highlight;
    }
  }
}
