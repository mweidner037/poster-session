import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import React from "react";
import { Globals } from "../util";
import { ROTATION_SPEED, TRANSLATION_SPEED } from "../../common/consts";
import { Furniture, Player, Room } from "../state";
import { CAMERA_PERSPECTIVES } from "../scene/camera_perspectives";
import { TOOLS } from "./toolbox";
import { getMeshSource } from "../scene";
import { Overlay } from "./react_main";

export const PICK_DISTANCE = 8;

interface Props {
  /** Never changes. */
  scene: BABYLON.Scene;
  /** Never changes. */
  camera: BABYLON.UniversalCamera;
  /** Never changes. */
  room: Room;
  /** Never changes. */
  ourPlayer: Player;
  tool: keyof typeof TOOLS;
  overlay: Overlay;
  setOverlay: (overlay: Overlay) => void;
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
    const toRemove: (() => void)[] = [];
    toRemove.push(this.handlePlayerMovement());
    toRemove.push(this.handleCameraPerspective());
    toRemove.push(this.handleMouseInput());

    this.removeListeners = () => {
      canvasDiv.removeChild(Globals().renderCanvas);
      toRemove.forEach((value) => value());
    };
  }

  componentWillUnmount() {
    this.removeListeners!();
    this.removeListeners = null;
  }

  /**
   * @return function to remove listeners
   */
  private handlePlayerMovement(): () => void {
    // Render loop. Note we do our own movements here,
    // but only update the server in the logic loop.
    // This is okay because Player doesn't sync local changes.
    const scene = this.props.scene;
    const players = this.props.room.players;
    const ourPlayer = this.props.ourPlayer;

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
      // TODO: ignore caps lock on these?
      if (Globals().keyTracker.getIgnoreCase("w")) {
        ourPlayer.mesh.movePOV(0, 0, -deltaSec * TRANSLATION_SPEED);
      } else if (Globals().keyTracker.getIgnoreCase("s")) {
        ourPlayer.mesh.movePOV(0, 0, deltaSec * TRANSLATION_SPEED);
      }
      if (Globals().keyTracker.get("a") && !Globals().keyTracker.get("d")) {
        ourPlayer.mesh.rotatePOV(0, -deltaSec * ROTATION_SPEED, 0);
      } else if (
        Globals().keyTracker.get("d") &&
        !Globals().keyTracker.get("a")
      ) {
        ourPlayer.mesh.rotatePOV(0, deltaSec * ROTATION_SPEED, 0);
      } else if (
        Globals().keyTracker.get("A") &&
        !Globals().keyTracker.get("D")
      ) {
        ourPlayer.mesh.movePOV(deltaSec * TRANSLATION_SPEED, 0, 0);
      } else if (
        Globals().keyTracker.get("D") &&
        !Globals().keyTracker.get("A")
      ) {
        ourPlayer.mesh.movePOV(-deltaSec * TRANSLATION_SPEED, 0, 0);
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
  private handleCameraPerspective(): () => void {
    const scene = this.props.scene;

    let index = 0;
    const observer = scene.onKeyboardObservable.add((e) => {
      if (e.event.type === "keydown" && e.event.key.toLowerCase() === "c") {
        // Toggle camera perspective.
        index = (index + 1) % CAMERA_PERSPECTIVES.length;
        this.props.camera.position = CAMERA_PERSPECTIVES[index];
      }
    });

    return () => {
      scene.onKeyboardObservable.remove(observer);
    };
  }

  /**
   * @return function to remove listeners
   */
  private handleMouseInput(): () => void {
    const scene = this.props.scene;
    scene.constantlyUpdateMeshUnderPointer = true;

    const observer = scene.onPointerObservable.add((e) => {
      if (e.type == BABYLON.PointerEventTypes.POINTERDOWN) {
        // Clicking outside an overlay cancels it.
        if (this.props.overlay !== null) {
          this.props.setOverlay(null);
          return;
        }

        if (e.pickInfo === null || e.pickInfo.pickedMesh === null) return;
        if (e.pickInfo.distance > PICK_DISTANCE) return;
        const pickedObject = getMeshSource(e.pickInfo.pickedMesh);
        if (pickedObject === undefined) return;
        // Successfully picked an object. Do an action depending on its type and
        // the current tool.
        if (pickedObject instanceof Furniture) {
          switch (this.props.tool) {
            case "Mouse":
              // TODO: shift+mouse = edit mode.
              // TODO: also use this case when toolbox is hidden.
              if (pickedObject.canInteract())
                pickedObject.interact(this.props.setOverlay);
              break;
            case "Edit":
              if (pickedObject.canEdit())
                pickedObject.edit(this.props.setOverlay);
              break;
            case "Delete":
              this.props.room.furnitures.delete(pickedObject);
              break;
            case "Easel":
            case "Bear":
            case "Whiteboard":
              // Place furniture on top of this furniture if it is a ground.
              if (!pickedObject.isGround) return;
              // Determine rotation angle: face towards ray.
              const angle = Math.atan2(
                e.pickInfo.ray!.direction.x,
                e.pickInfo.ray!.direction.z
              );
              const rotation = new BABYLON.Vector3(0, angle, 0);
              switch (this.props.tool) {
                case "Easel":
                  this.props.room.furnitures.addEasel(
                    e.pickInfo.pickedPoint!,
                    rotation
                  );
                  break;
                case "Bear":
                  this.props.room.furnitures.addBoring(
                    e.pickInfo.pickedPoint!,
                    rotation,
                    false,
                    "black_bear.gltf"
                  );
                  break;
                case "Whiteboard":
                  this.props.room.furnitures.addWhiteboard(
                    e.pickInfo.pickedPoint!,
                    rotation
                  );
                  break;
              }
              break;
          }
        }
      } else if (e.type === BABYLON.PointerEventTypes.POINTERMOVE) {
        // Update the cursor based on what's under it.
        let cursor = "default";
        pick: {
          if (e.pickInfo === null || e.pickInfo.pickedMesh === null) break pick;
          if (e.pickInfo.distance > PICK_DISTANCE) break pick;
          const pickedObject = getMeshSource(e.pickInfo.pickedMesh);
          if (pickedObject === undefined) break pick;

          // Successfully picked an object. Set the cursor depending on its
          // type and the current tool.
          if (pickedObject instanceof Furniture) {
            switch (this.props.tool) {
              case "Mouse":
                if (pickedObject.canInteract()) cursor = "pointer";
                break;
              case "Edit":
                if (pickedObject.canEdit()) cursor = "pointer";
                break;
              case "Delete":
                cursor = "pointer";
                break;
              case "Easel":
              case "Bear":
              case "Whiteboard":
                // Can place furniture on top of this furniture if it is a ground.
                if (pickedObject.isGround) cursor = "pointer";
                break;
            }
          }
        }
        this.props.scene.defaultCursor = cursor;
      }
    });

    return () => {
      scene.onPointerObservable.remove(observer);
    };
  }

  render() {
    return <div ref={this.canvasDivRef}></div>;
  }
}
