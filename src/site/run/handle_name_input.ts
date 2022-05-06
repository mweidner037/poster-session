import { Player } from "../state/player";
import { Globals } from "../util/globals";

export function handleNameInput(ourPlayer: Player) {
  const nameInput = <HTMLInputElement>document.getElementById("nameInput");
  const nameInputForm = <HTMLFormElement>(
    document.getElementById("nameInputForm")
  );
  nameInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    ourPlayer.state.displayName.value = nameInput.value;
    Globals().renderCanvas.focus();
  });
  nameInput.addEventListener("blur", () => {
    ourPlayer.state.displayName.value = nameInput.value;
  });
  nameInput.addEventListener("focus", () => {
    nameInput.select();
  });
}
