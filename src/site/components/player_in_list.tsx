import React from "react";
import { Player } from "../state/player";
import "./player_in_list.css";

interface Props {
  player: Player;
}

export class PlayerInList extends React.Component<Props> {
  private removeCollabListeners: (() => void) | null = null;

  componentDidMount() {
    // Force rerender when this.props.player changes.
    const removeDisplayNameListener = this.props.player.state.displayName.on(
      "Set",
      () => this.setState({})
    );
    const removeHueListener = this.props.player.state.hue.on("Set", () =>
      this.setState({})
    );
    this.removeCollabListeners = () => {
      removeDisplayNameListener();
      removeHueListener();
    };
  }

  componentWillUnmount() {
    if (this.removeCollabListeners !== null) {
      this.removeCollabListeners();
      this.removeCollabListeners = null;
    }
  }

  render() {
    const color = `hsl(${this.props.player.state.hue.value}, 100%, 50%)`;
    return (
      <li className="playerInList" style={{ color }}>
        {this.props.player.state.displayName.value}
      </li>
    );
  }
}
