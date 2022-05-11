import React from "react";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { CanvasWrapper } from "./canvas_wrapper";
import { RightPanel } from "./right_panel";
import { Toolbox, TOOLS } from "./toolbox";
import "./react_main.css";
import { Player, Room } from "../state";
import { Globals } from "../util";

/**
 * Interact overlay, represented as a callback that returns the
 * overlay (e.g., () => <PosterViewOverlay easel={easel} />),
 * or null if there is no current overlay.
 */
export type Overlay = (() => JSX.Element) | null;

interface Props {
  scene: BABYLON.Scene;
  camera: BABYLON.UniversalCamera;
  room: Room;
  ourPlayer: Player;
  returnToStart: () => void;
  resetAndRefresh: () => void;
}

interface State {
  /** Toolbox tool. */
  tool: keyof typeof TOOLS;
  overlay: Overlay;
}

export class ReactMain extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      tool: Globals().localStorage.getTool() ?? "Mouse",
      overlay: null,
    };
  }

  private setOverlay = (overlay: Overlay) => {
    this.setState({ overlay });
  };

  render() {
    const overlayDiv =
      this.state.overlay === null ? null : (
        <div className="overlayDiv">{this.state.overlay()}</div>
      );
    // TODO: only show toolbar in editor mode.
    return (
      <div className="reactMainDiv">
        <div className="toolboxRoot">
          <Toolbox
            scene={this.props.scene}
            room={this.props.room}
            tool={this.state.tool}
            setTool={(tool) => {
              this.setState({ tool });
              Globals().localStorage.setTool(tool);
            }}
          />
        </div>
        <div className="canvasWrapper">
          <CanvasWrapper
            scene={this.props.scene}
            camera={this.props.camera}
            room={this.props.room}
            ourPlayer={this.props.ourPlayer}
            tool={this.state.tool}
            overlay={this.state.overlay}
            setOverlay={this.setOverlay}
          />
          {overlayDiv}
        </div>
        <div className="rightPanelRoot">
          <RightPanel
            players={this.props.room.players}
            ourPlayer={this.props.ourPlayer}
            setOverlay={this.setOverlay}
            returnToStart={this.props.returnToStart}
            resetAndRefresh={this.props.resetAndRefresh}
          />
        </div>
      </div>
    );
  }
}
