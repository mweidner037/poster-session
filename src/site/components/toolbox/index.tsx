import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "./index.css";
import { Room } from "../../state";

export const TOOLS = {
  Mouse: "M",
  Edit: "E",
  Delete: "X",
  Bear: "B",
  Easel: "A",
  // Projector: "P",
  // Wall: "W",
  // Chair: "C",
  // Cube: "U",
} as const;

interface Props {
  scene: BABYLON.Scene;
  room: Room;
  tool: keyof typeof TOOLS;
  setTool: (tool: keyof typeof TOOLS) => void;
}

export class Toolbox extends React.Component<Props> {
  render() {
    const buttons: JSX.Element[] = [];
    for (const [key, value] of Object.entries(TOOLS)) {
      const selected = key === this.props.tool;
      buttons.push(
        <span
          className="toolSelectButton"
          key={key}
          style={{ borderStyle: selected ? "inset" : "outset" }}
          onMouseDown={() => this.props.setTool(key as keyof typeof TOOLS)}
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
