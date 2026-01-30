import { createSignal, createMemo, onMount, onCleanup, createEffect, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { isServer } from "solid-js/web";
import { useGameState } from "~/lib/game/state";
import { useAppAuth } from "~/lib/firebase/auth";
import { Button } from "~/components/ui/Button";
import { Card } from "~/components/ui/Card";
import { getInviteCodeForGame } from "~/lib/game/lobby";
import { getUserDisplayName } from "~/lib/firebase/users";

export default function GameLobby() {
  const params = useParams();
  const authState = useAppAuth();
  const currentUserId = () => authState.data?.uid || "";
  
  const { game, loading, error, isHost } = useGameState(() => params.gameId, currentUserId);
  const [inviteCode, setInviteCode] = createSignal<string | null>(null);
  const [playerNames, setPlayerNames] = createSignal<Record<string, string>>({});

  onMount(async () => {
    if (params.gameId) {
      const code = await getInviteCodeForGame(params.gameId);
      setInviteCode(code);
    }
  });

  createEffect(() => {
    const playerUids = game()?.playerUids || [];
    playerUids.forEach(async (uid) => {
      if (!playerNames()[uid]) {
        const name = await getUserDisplayName(uid);
        setPlayerNames(prev => ({ ...prev, [uid]: name }));
      }
    });
  });

  createEffect(() => {
    if (isServer) return;
    
    const gameStatus = game()?.status;
    const userId = currentUserId();
    const host = isHost();
    
    if ((gameStatus === "playing" || gameStatus === "judging") && !host && userId && params.gameId) {
      window.location.href = `/game/${params.gameId}/play`;
    }
  });

  onMount(() => {
    if (isServer) return;
    
    const handleBeforeUnload = async () => {
      const userId = currentUserId();
      const gameId = params.gameId;
      if (userId && gameId && game()?.status === "waiting" && !isHost()) {
        const { leaveGameAction } = await import("~/lib/game/actions");
        try {
          await leaveGameAction(gameId, userId);
        } catch (e) {
          console.error("Failed to leave game:", e);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    onCleanup(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });
  });

  const players = createMemo(() => game()?.playerUids || []);

  const handleStartGame = async () => {
    const { startGameAction, bootstrapPlayerHands } = await import("~/lib/game/actions");
    const { getHydratedDeck } = await import("~/lib/game/deck");
    
    if (!params.gameId) return;

    try {
      const deckId = game()?.settings.deckId || "default";
      const deck = await getHydratedDeck(deckId);
      await bootstrapPlayerHands(params.gameId, players());
      await startGameAction(params.gameId, deck);
      window.location.href = `/game/${params.gameId}/play`;
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  const handleKickPlayer = async (playerIdToKick: string) => {
    const { kickPlayerAction } = await import("~/lib/game/actions");
    const userId = currentUserId();
    const gameId = params.gameId;
    
    if (!userId || !gameId) return;
    
    try {
      await kickPlayerAction(gameId, userId, playerIdToKick);
    } catch (err) {
      console.error("Failed to kick player:", err);
    }
  };

  const handleLeaveGame = async () => {
    const { leaveGameAction } = await import("~/lib/game/actions");
    const userId = currentUserId();
    const gameId = params.gameId;
    
    if (!userId || !gameId) return;
    
    try {
      await leaveGameAction(gameId, userId);
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to leave game:", err);
    }
  };

  return (
    <div class="p-8 max-w-4xl mx-auto space-y-12">
      <Show when={!loading()} fallback={<div class="text-center p-20 font-black uppercase animate-pulse">Loading Lobby...</div>}>
        <Show when={!error()} fallback={<div class="text-red-500 font-bold p-10 bg-red-50 rounded-xl">{error()?.message}</div>}>
          
          <div class="flex flex-col md:flex-row justify-between items-start gap-8">
            <div class="space-y-4 flex-1">
              <div class="space-y-1">
                <h1 class="text-5xl font-black uppercase tracking-tighter italic text-brand-primary">Lobby</h1>
                <p class="text-gray-500 font-bold uppercase tracking-widest text-xs">Waiting for players to join</p>
              </div>

              <div class="p-6 bg-brand-secondary text-white rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <div class="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-1">Invite Code</div>
                  <div class="text-4xl font-black tracking-widest">{inviteCode() || "......"}</div>
                </div>
                <Button 
                  variant="ghost" 
                  class="text-white hover:bg-white/10" 
                  onClick={() => navigator.clipboard.writeText(inviteCode() || "")}
                >
                  COPY
                </Button>
              </div>

              <Show when={!isHost()}>
                <Button variant="ghost" class="text-red-500" onClick={handleLeaveGame}>
                  Leave Game
                </Button>
              </Show>
            </div>

            <Card class="w-full md:w-80 space-y-6">
              <h3 class="text-sm font-black uppercase tracking-widest opacity-50">Players ({players().length}/10)</h3>
              <div class="space-y-3">
                <For each={players()}>
                  {(uid) => (
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div class="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
                        {uid === game()?.hostId ? "★" : "P"}
                      </div>
                      <div class="flex-1 font-bold text-sm truncate">
                        {uid === currentUserId() ? `YOU (${playerNames()[uid] || "..."})` : (playerNames()[uid] || "Loading...")}
                      </div>
                      <Show when={isHost() && uid !== currentUserId()}>
                        <button 
                          class="text-red-400 hover:text-red-600 text-xs font-bold uppercase"
                          onClick={() => handleKickPlayer(uid)}
                        >
                          Kick
                        </button>
                      </Show>
                    </div>
                  )}
                </For>
              </div>

              <Show when={isHost()}>
                <div class="pt-4 border-t border-gray-100">
                  <Button 
                    class="w-full" 
                    variant="primary" 
                    size="lg" 
                    disabled={players().length < 1}
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                  <p class="text-[10px] text-center mt-3 text-gray-400 font-bold uppercase tracking-widest">
                    {players().length < 1 ? "Need players to join" : "Ready to play!"}
                  </p>
                </div>
              </Show>
            </Card>
          </div>

        </Show>
      </Show>
    </div>
  );
}
