import { clientOnly } from "@solidjs/start";

const GameLobby = clientOnly(() => import("~/components/game/GameLobby"));

export default function GameLobbyPage() {
  return <GameLobby />;
}
