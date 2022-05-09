import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import React from "react";
import { Globals } from "../util";
import { ROTATION_SPEED, TRANSLATION_SPEED } from "../../common/consts";
import { Player, PlayerSet } from "../state";
import { CAMERA_PERSPECTIVES } from "../scene/camera_perspectives";

interface Props {
  /** Never changes. */
  scene: BABYLON.Scene;
  /** Never changes. */
  camera: BABYLON.UniversalCamera;
  /** Never changes. */
  players: PlayerSet;
  /** Never changes. */
  ourPlayer: Player;
}

/**
 * React component for the Canvas.
 *
 * Wraps the scene Canvas (id renderCanvas) and handles user input on it.
 * It must have the Canvas as its only child:
 * <CanvasWrapper [props]>{Globals().renderCanvas}</CanvasWrapper>
 *
 * It is a wrapper instead of creating
 * the Canvas itself only because we want to create the Canvas before
 * the React tree, so that we can create the scene and pass it to
 * React components. However, it still follows the spirit of a proper
 * Canvas React component in that it manages the Canvas's GUI behavior
 * (although not the objects in the scene, which are managed directly
 * by the site/state classes, since they are OOP instead of declarative HTML).
 */
export class CanvasWrapper extends React.Component<Props> {
  private removeListeners: (() => void) | null = null;
  private canvasDivRef: React.RefObject<HTMLDivElement>;

  constructor(props: Props) {
    super(props);

    this.canvasDivRef = React.createRef();
  }

  componentDidMount() {
    // Wrap the real Canvas.
    const canvasDiv = this.canvasDivRef.current!;
    canvasDiv.appendChild(Globals().renderCanvas);

    // Add input listeners.
    const removePlayerMovement = this.handlePlayerMovement(
      this.props.scene,
      this.props.players,
      this.props.ourPlayer
    );
    const removeCameraPerspectives = this.handleCameraPerspective(
      this.props.scene,
      this.props.camera
    );

    this.removeListeners = () => {
      canvasDiv.removeChild(Globals().renderCanvas);
      removePlayerMovement();
      removeCameraPerspectives();
    };
  }

  componentWillUnmount() {
    this.removeListeners!();
  }

  /**
   * @return function to remove listeners
   */
  private handlePlayerMovement(
    scene: BABYLON.Scene,
    players: PlayerSet,
    ourPlayer: Player
  ): () => void {
    // Render loop. Note we do our own movements here,
    // but only update the server in the logic loop.
    // This is okay because Player doesn't sync local changes.
    let lastTime = -1;
    const observer = scene.onBeforeRenderObservable.add(() => {
      if (lastTime === -1) {
        lastTime = Date.now();
        return;
      }

      const newTime = Date.now();
      const deltaSec = (newTime - lastTime) / 1000;
      lastTime = newTime;

      // Move our player directly (w/o telling the server right away).
      if (Globals().keyTracker.getIgnoreCase("w")) {
        ourPlayer.mesh.movePOV(0, 0, -deltaSec * TRANSLATION_SPEED);
      } else if (Globals().keyTracker.getIgnoreCase("s")) {
        ourPlayer.mesh.movePOV(0, 0, deltaSec * TRANSLATION_SPEED);
      }

      if (
        Globals().keyTracker.getIgnoreCase("a") &&
        !Globals().keyTracker.getIgnoreCase("d")
      ) {
        ourPlayer.mesh.rotatePOV(0, -deltaSec * ROTATION_SPEED, 0);
      } else if (
        Globals().keyTracker.getIgnoreCase("d") &&
        !Globals().keyTracker.getIgnoreCase("a")
      ) {
        ourPlayer.mesh.rotatePOV(0, deltaSec * ROTATION_SPEED, 0);
      }

      // Move other players.
      for (const player of players.values()) {
        if (player !== ourPlayer) player.littleTick(deltaSec);
      }
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
    };
  }

  /**
   * @return function to remove listeners
   */
  private handleCameraPerspective(
    scene: BABYLON.Scene,
    camera: BABYLON.UniversalCamera
  ): () => void {
    let index = 0;
    const observer = scene.onKeyboardObservable.add((e) => {
      if (e.event.type === "keydown" && e.event.key.toLowerCase() === "c") {
        // Toggle camera perspective.
        index = (index + 1) % CAMERA_PERSPECTIVES.length;
        camera.position = CAMERA_PERSPECTIVES[index];
      }
    });

    return () => {
      scene.onKeyboardObservable.remove(observer);
    };
  }

  render() {
    return <div ref={this.canvasDivRef}></div>;
  }
}
