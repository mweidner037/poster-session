import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { CanvasWrapper } from "./canvas_wrapper";
import { RightPanel } from "./right_panel";
import { Toolbox } from "./toolbox";
import "./react_main.css";
import { Player, Room } from "../state";

interface Props {
  scene: BABYLON.Scene;
  camera: BABYLON.UniversalCamera;
  room: Room;
  ourPlayer: Player;
}

interface State {}

export class ReactMain extends React.Component<Props, State> {
  render() {
    // TODO: only show toolbar in editor mode.
    return (
      <div className="reactMainDiv">
        <div className="toolboxRoot">
          <Toolbox scene={this.props.scene} room={this.props.room} />
        </div>
        <div className="canvasWrapper">
          <CanvasWrapper
            scene={this.props.scene}
            camera={this.props.camera}
            players={this.props.room.players}
            ourPlayer={this.props.ourPlayer}
          />
        </div>
        <div className="rightPanelRoot">
          <RightPanel
            players={this.props.room.players}
            ourPlayer={this.props.ourPlayer}
          />
        </div>
      </div>
    );
  }
}
