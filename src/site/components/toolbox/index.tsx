import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "./index.css";
import { Room } from "../../state";

export const TOOLS = {
  Mouse: "M",
  Bear: "B",
  Easel: "E",
  // Projector: "P",
  // Wall: "W",
  // Chair: "C",
  // Cube: "U",
} as const;

interface State {
  selected: keyof typeof TOOLS;
}

interface Props {
  scene: BABYLON.Scene;
  room: Room;
}

export class Toolbox extends React.Component<Props, State> {
  private removeListeners: (() => void) | null = null;

  constructor(props: Props) {
    super(props);

    this.state = { selected: "Mouse" };
  }

  componentDidMount() {
    const scene = this.props.scene;
    const observer = scene.onPointerObservable.add(this.onPointerObservable);
    this.removeListeners = () => {
      scene.onPointerObservable.remove(observer);
    };
  }

  componentWillUnmount() {
    this.removeListeners!();
  }

  // TODO: move to CanvasWrapper, which should take the toolbox state as a prop.
  private onPointerObservable = (e: BABYLON.PointerInfo) => {
    if (e.type == BABYLON.PointerEventTypes.POINTERDOWN) {
      if (e.pickInfo !== null && e.pickInfo.pickedMesh !== null) {
        // Place furniture.
        // TODO: only on ground, not on furniture
        if (e.pickInfo.distance < 5 && this.state.selected !== "Mouse") {
          // Determine rotation angle: face towards ray.
          const angle = Math.atan2(
            e.pickInfo.ray!.direction.x,
            e.pickInfo.ray!.direction.z
          );
          const rotation = new BABYLON.Vector3(0, angle, 0);
          // TODO: make tool do this
          switch (this.state.selected) {
            case "Bear":
              this.props.room.furnitures.addBoring(
                e.pickInfo.pickedPoint!,
                rotation,
                "black_bear.gltf"
              );
              break;
            case "Easel":
              this.props.room.furnitures.addBoring(
                e.pickInfo.pickedPoint!,
                rotation,
                "easel.gltf"
              );
              break;
          }
        }
      }
    }
  };

  componentDidUpdate() {
    // TODO: only change mouse cursor when it's over a valid location?
    this.props.scene.defaultCursor =
      this.state.selected === "Mouse" ? "default" : "pointer";
  }

  render() {
    const buttons: JSX.Element[] = [];
    for (const [key, value] of Object.entries(TOOLS)) {
      const selected = key === this.state.selected;
      buttons.push(
        <span
          className="toolSelectButton"
          key={key}
          style={{ borderStyle: selected ? "inset" : "outset" }}
          onMouseDown={() =>
            this.setState({ selected: key as keyof typeof TOOLS })
          }
        >
          {value}
        </span>
      );
    }

    return (
      <div className="toolbox">
        <h3>Editing Tools</h3>
        <div className="toolSelect">{buttons}</div>
      </div>
    );
  }
}
