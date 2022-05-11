import React from "react";
import { PICK_DISTANCE } from "../canvas_wrapper";

export class HelpOverlay extends React.Component {
  render() {
    return (
      <div className="helpOverlayDiv">
        <h1>Help</h1>
        <h2>Movement</h2>
        WASD (W = move forward, S = move backward, A = turn left, D = turn
        right).
        <br />
        Hold shift with A/D to strafe (move sideways). Caps lock also works.
        <h2>Audio</h2>
        You can hear those around you, with volume based on proximity. Once you
        allow audio in your browser's popup, you can speak as well. Players
        light up when speaking.
        <h2>Interaction</h2>
        Click nearby objects in the scene to interact with them.
        <br />
        If interacting is not working, you might be too far away (more than{" "}
        {PICK_DISTANCE} meters), or the object might not be interactable.
        <br />
        Sometimes interaction will pop up an overlay like this one; click on the
        scene outside the overlay to close it.
        <br />
        <b>Interactable objects:</b>
        <ul>
          <li>
            Easel: Holds a poster uploaded from an image. Click a blank poster
            to set its image. Click a filled poster to view it in focus.
          </li>
        </ul>
        <h2>Player Info</h2>
        Set your display name and color in the right-side panel.
        <br />
        You can also see a color-coded list of players.
        <h2>Camera</h2>
        Press C to toggle your camera perspective. By default, it is
        first-person.
        <h2>Editing</h2>
        The toolbox on the left lets you edit the scene.
        <ul>
          <li>M (Mouse): Interacts with the scene normally.</li>
          <li>
            E (Edit): Triggers the edit interaction on a clicked object, if
            editable.
          </li>
          <li>X (Delete): Deletes the clicked object.</li>
          <li>
            B (Bear): Places a bear at the clicked point. Must place on the
            ground.
          </li>
          <li>
            A (Easel): Places an easel at the clicked point. Must place on the
            ground.
          </li>
        </ul>
      </div>
    );
  }
}
