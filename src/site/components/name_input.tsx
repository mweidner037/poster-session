import React from "react";
import { Player } from "../state/player";
import { Globals } from "../util";
import "./name_input.css";

interface Props {
  ourPlayer: Player;
}

export class NameInput extends React.Component<Props> {
  private inputRef: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);

    this.inputRef = React.createRef();
  }

  private setNameFromInput() {
    this.props.ourPlayer.state.displayName.value = this.inputRef.current!.value;
  }

  render() {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          this.setNameFromInput();
          Globals().renderCanvas.focus();
        }}
      >
        <label htmlFor="nameInput">Name</label>
        <br />
        <input
          ref={this.inputRef}
          type="text"
          className="nameInput"
          defaultValue={this.props.ourPlayer.state.displayName.value}
          onBlur={() => this.setNameFromInput()}
          onFocus={() => this.inputRef.current!.select()}
        />
      </form>
    );
  }
}
