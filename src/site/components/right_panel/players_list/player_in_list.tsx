import React from "react";
import { Player } from "../../../state/player";
import "./player_in_list.css";

interface Props {
  player: Player;
}

export class PlayerInList extends React.Component<Props> {
  private removeListeners: (() => void) | null = null;

  componentDidMount() {
    // Force rerender when this.props.player changes.
    const removeDisplayNameListener = this.props.player.state.displayName.on(
      "Set",
      () => this.setState({})
    );
    const removeHueListener = this.props.player.state.hue.on("Set", () =>
      this.setState({})
    );
    this.removeListeners = () => {
      removeDisplayNameListener();
      removeHueListener();
    };
  }

  componentWillUnmount() {
    this.removeListeners!();
    this.removeListeners = null;
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
