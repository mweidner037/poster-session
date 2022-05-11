import React from "react";
import "./poster_viewer.css";

interface Props {
  imageURL: string;
  heightRatio: number;
}

export class PosterViewer extends React.Component<Props> {
  render() {
    return <img className="posterViewerImage" src={this.props.imageURL} />;
  }
}
