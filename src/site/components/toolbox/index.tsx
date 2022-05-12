import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import "./index.css";
import { Room } from "../../state";
import { FaMousePointer, FaEdit, FaTimes, FaChalkboard } from "react-icons/fa";
import { GiBearFace } from "react-icons/gi";
import { BsEasel } from "react-icons/bs";
import { Globals } from "../../util";

/**
 * Maps from tool name to [icon, description for help].
 */
export const TOOLS = {
  Mouse: [FaMousePointer, "Interacts with the scene normally."],
  Edit: [
    FaEdit,
    "Triggers the edit interaction on a clicked object, if editable.",
  ],
  Delete: [FaTimes, "Deletes the clicked object."],
  Bear: [
    GiBearFace,
    "Places a bear at the clicked point. Must place on the ground.",
  ],
  Easel: [
    BsEasel,
    "Places an easel at the clicked point. Must place on the ground.",
  ],
  Whiteboard: [
    FaChalkboard,
    "Places a whiteboard at the clicked point. Must place on the ground.",
  ],
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
          title={key + ": " + value[1]}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent gaining focus.
            this.props.setTool(key as keyof typeof TOOLS);
            Globals().renderCanvas.focus();
          }}
        >
          {React.createElement(value[0])}
        </span>
      );
    }

    return (
      <div className="toolbox">
        <p className="toolboxTitle">Editing Tools</p>
        <div className="toolSelect">{buttons}</div>
      </div>
    );
  }
}
