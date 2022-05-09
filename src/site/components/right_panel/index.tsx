import React from "react";
import { Player, PlayerSet } from "../../state";
import { ColorInput } from "./color_input";
import { NameInput } from "./name_input";
import { PlayersList } from "./players_list";
import "./index.css";

interface Props {
  players: PlayerSet;
  ourPlayer: Player;
}

export class RightPanel extends React.Component<Props> {
  render() {
    return (
      <>
        <div className="rightTopDiv">
          <NameInput ourPlayer={this.props.ourPlayer} />
          <ColorInput ourPlayer={this.props.ourPlayer} />
          <p>Controls</p>
          <p className="controlsText">
            WASD to move.
            <br />C to change camera.
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
