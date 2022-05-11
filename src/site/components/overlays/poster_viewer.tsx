import React from "react";
import "./poster_viewer.css";

interface Props {
  imageURL: string;
  heightRatio: number;
}

export class PosterViewer extends React.Component<Props> {
  render() {
    // For some reason, need to wrap it an extra div to prevent a scrollbar
    // from appearing, even though the image is supposed to take up exactly
    // the available space.
    return (
      <div>
        <img className="posterViewerImage" src={this.props.imageURL} />
      </div>
    );
  }
}
