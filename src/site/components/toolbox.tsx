import React from "react";
import "./toolbox.css";

export const TOOLS = {
  Mouse: "M",
  Bear: "B",
  Easel: "E",
  // Projector: "P",
  // Wall: "W",
  // Chair: "C",
  // Cube: "U",
} as const;

export interface ToolboxState {
  selected: keyof typeof TOOLS;
}

interface Props {
  onChange: (state: ToolboxState) => void;
}

export class Toolbox extends React.Component<Props, ToolboxState> {
  constructor(props: Props) {
    super(props);

    this.state = { selected: "Mouse" };
    this.props.onChange(this.state);
  }

  componentDidUpdate() {
    this.props.onChange(this.state);
  }

  render() {
    const buttons: JSX.Element[] = [];
    for (const [key, value] of Object.entries(TOOLS)) {
      const selected = key === this.state.selected;
      buttons.push(
        <span
          className="toolSelectButton"
          key={key}
          style={{ borderStyle: selected ? "inset" : "outset" }}
          onMouseDown={() =>
            this.setState({ selected: key as keyof typeof TOOLS })
          }
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
