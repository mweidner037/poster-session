import React from "react";
import { Player, PlayerSet } from "../../state";
import { ColorInput } from "./color_input";
import { NameInput } from "./name_input";
import { PlayersList } from "./players_list";
import "./index.css";
import { Overlay } from "../react_main";
import { HelpOverlay } from "../overlays/help";

interface Props {
  players: PlayerSet;
  ourPlayer: Player;
  setOverlay: (overlay: Overlay) => void;
  returnToStart: () => void;
  resetAndRefresh: () => void;
}

export class RightPanel extends React.Component<Props> {
  render() {
    return (
      <>
        <div className="rightTopDiv">
          <NameInput ourPlayer={this.props.ourPlayer} />
          <ColorInput ourPlayer={this.props.ourPlayer} />
          <p>Help</p>
          <p className="helpText">
            WASD to move.
            <br />
            Click to interact.
            <br />
            <button
              className="helpText"
              onClick={() =>
                this.props.setOverlay(() => (
                  <HelpOverlay
                    returnToStart={this.props.returnToStart}
                    resetAndRefresh={this.props.resetAndRefresh}
                  />
                ))
              }
            >
              More help...
            </button>
          </p>
          <p>Players</p>
        </div>
        <div className="playersListDiv">
          <PlayersList
            players={this.props.players}
            ourPlayer={this.props.ourPlayer}
          />
        </div>
      </>
    );
  }
}
