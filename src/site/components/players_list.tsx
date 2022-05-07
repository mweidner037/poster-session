import React from "react";
import { Player } from "../state/player";
import { PlayerSet } from "../state/player_set";
import { PlayerInList } from "./player_in_list";
import "./players_list.css";

interface Props {
  players: PlayerSet;
  ourPlayer: Player;
}

export class PlayersList extends React.Component<Props> {
  private removeCollabListeners: (() => void) | null = null;

  componentDidMount() {
    // Force rerender when this.props.players changes.
    this.removeCollabListeners = this.props.players.on("NameSetChange", () => {
      this.setState({});
    });
  }

  componentWillUnmount() {
    if (this.removeCollabListeners !== null) {
      this.removeCollabListeners();
      this.removeCollabListeners = null;
    }
  }

  render() {
    // Sort players by displayName, but with us first.
    const sortedPlayers = [...this.props.players];
    sortedPlayers.sort((a, b) => {
      if (a === this.props.ourPlayer) return -1;
      else if (b === this.props.ourPlayer) return 1;
      else if (a.state.displayName.value > b.state.displayName.value) return 1;
      else if (a.state.displayName.value < b.state.displayName.value) return -1;
      else return 0;
    });
    // Display players in a UL.
    return (
      <ul className="playersList">
        {sortedPlayers.map((player) => (
          <PlayerInList player={player} key={player.state.peerID} />
        ))}
      </ul>
    );
  }
}
