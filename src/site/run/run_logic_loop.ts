import { MyVector3 } from "../../common/util/babylon_types";
import { PlayerAudio } from "../calling";
import { HIGHLIGHT_THRESHOLD, Player } from "../state/player";
import { PlayerSet } from "../state/player_set";

export function runLogicLoop(
  ourPlayer: Player,
  players: PlayerSet,
  ourAudioStream: MediaStream
) {
  const ourPlayerAudio = new PlayerAudio(ourAudioStream, undefined, true);

  setInterval(() => {
    // Send actual position/rotation to the server.
    if (
      !ourPlayer.state.position.value.equalsBabylon(ourPlayer.mesh.position)
    ) {
      ourPlayer.state.position.value = MyVector3.from(ourPlayer.mesh.position);
    }
    if (
      !ourPlayer.state.rotation.value.equalsBabylon(ourPlayer.mesh.rotation)
    ) {
      ourPlayer.state.rotation.value = MyVector3.from(ourPlayer.mesh.rotation);
    }

    // Big tick.
    for (const player of players.values()) {
      if (player !== ourPlayer) player.bigTick(ourPlayer);
    }

    // Display local user audio level.
    const level = ourPlayerAudio.getLevel();
    ourPlayer.setHighlighted(level > HIGHLIGHT_THRESHOLD);
  }, 100);
}
