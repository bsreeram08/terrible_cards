import { clientOnly } from "@solidjs/start";
import { useParams } from "@solidjs/router";

const GameBoard = clientOnly(() => import("~/components/game/GameBoard"));

export default function GamePlayPage() {
  const params = useParams();
  return <GameBoard gameId={params.gameId as string} />;
}
