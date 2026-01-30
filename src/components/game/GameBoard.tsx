import { Show, createEffect, onMount, For, createSignal, createMemo, onCleanup } from "solid-js";
import { useGameState } from "~/lib/game/state";
import { useAppAuth } from "~/lib/firebase/auth";
import { Card, CardData } from "./Card";
import { PlayArea } from "./PlayArea";
import { Button } from "~/components/ui/Button";
import { ScoreBoard } from "./ScoreBoard";
import { triggerConfetti, triggerWinnerCelebration } from "~/lib/animations/particles";
import { HostControls } from "./HostControls";
import { claimCardsAction, submitCardsAction, selectWinnerAction, nextRoundAction, setNextRoundTransitionAction } from "~/lib/game/actions";
import { WhiteCard } from "~/types/game";
import { getUserDisplayName } from "~/lib/firebase/users";

interface GameBoardProps {
  gameId: string;
}

export default function GameBoard(props: GameBoardProps) {
  const authState = useAppAuth();
  const currentUserId = () => authState.data?.uid || "";
  const { game, round, hand, loading, error, isHost, isJudge } = useGameState(props.gameId, currentUserId);
  
  const [selectedCards, setSelectedCards] = createSignal<WhiteCard[]>([]);
  const [claimInProgress, setClaimInProgress] = createSignal(false);
  const [playerNames, setPlayerNames] = createSignal<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = createSignal(90);
  const [submitting, setSubmitting] = createSignal(false);
  const [revealedSubmissions, setRevealedSubmissions] = createSignal<Record<string, boolean>>({});
  const [nextRoundCountdown, setNextRoundCountdown] = createSignal<number | null>(null);
  const [isMobile, setIsMobile] = createSignal(false);
  
  // Use a signal for the ref to react when the element is mounted/unmounted
  const [handContainer, setHandContainer] = createSignal<HTMLDivElement>();

  onMount(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    onCleanup(() => window.removeEventListener("resize", check));
  });

  const requiredPick = () => round()?.blackCard?.pick || 1;
  const isCardSelected = (cardId: string) => selectedCards().some(c => c.id === cardId);
  
  const toggleReveal = (playerId: string) => {
    setRevealedSubmissions(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };
  
  const isRevealed = (playerId: string) => !!revealedSubmissions()[playerId];

  const submissions = createMemo(() => {
    const subs = round()?.submissions || {};
    const items = Object.entries(subs).map(([pid, data]) => ({ playerId: pid, ...data }));
    return items.sort((a, b) => {
      const hashA = a.playerId + (game()?.currentRound || 0);
      const hashB = b.playerId + (game()?.currentRound || 0);
      return hashA.localeCompare(hashB);
    });
  });

  const handleTimeout = async () => {
    const roundData = round();
    const gameData = game();
    if (!roundData || !gameData || roundData.status === "complete") return;

    if (roundData.status === "submitting") {
      const userHasNotSubmitted = !roundData.submissions[currentUserId()] && !isJudge();
      if (userHasNotSubmitted) {
        let timeoutSubmissionCards = [...selectedCards()];
        
        if (timeoutSubmissionCards.length < requiredPick()) {
          const availableCardsInHand = hand()?.cards || [];
          const numberOfCardsToAutoPick = requiredPick() - timeoutSubmissionCards.length;
          const autoPickedCards = availableCardsInHand
            .filter(handCard => !timeoutSubmissionCards.some(selected => selected.id === handCard.id))
            .slice(0, numberOfCardsToAutoPick);
          timeoutSubmissionCards = [...timeoutSubmissionCards, ...autoPickedCards];
        }

        if (timeoutSubmissionCards.length === requiredPick()) {
          setSubmitting(true);
          try {
            await submitCardsAction(props.gameId, `round_${gameData.currentRound}`, currentUserId(), timeoutSubmissionCards);
          } catch (e) {
            console.error("Timeout auto-submit failed:", e);
          } finally {
            setSubmitting(false);
          }
        }
      }
    } else if (roundData.status === "judging" && currentUserId() === roundData.judgeId) {
      const allSubmissions = submissions();
      if (allSubmissions.length > 0) {
        try {
          const firstSubmissionPlayerId = allSubmissions[0].playerId;
          await selectWinnerAction(props.gameId, `round_${gameData.currentRound}`, firstSubmissionPlayerId, true);
        } catch (e) {
          console.error("Timeout judge selection failed:", e);
        }
      }
    }

    if (currentUserId() === gameData.hostId) {
      try {
        if (roundData.status === "submitting") {
          const { hostAutoSubmitForPlayers } = await import("~/lib/game/actions");
          await hostAutoSubmitForPlayers(props.gameId, `round_${gameData.currentRound}`);
        } else if (roundData.status === "judging") {
          const { hostAutoJudge } = await import("~/lib/game/actions");
          await hostAutoJudge(props.gameId, `round_${gameData.currentRound}`);
        }
      } catch (e) {
        console.error("Host auto-action failed:", e);
      }
    }
  };

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
    const roundData = round();
    const gameData = game();
    if (!roundData || !gameData) return;
    
    const isActivePhase = roundData.status === "submitting" || roundData.status === "judging";
    if (!isActivePhase) return;
    
    const timeoutSecs = roundData.status === "submitting" ? 120 : 60;
    const startTime = roundData.startedAt?.toMillis?.() || Date.now();
    
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeoutSecs - elapsed);
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        handleTimeout();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    onCleanup(() => clearInterval(interval));
  });

  createEffect(async () => {
    const userId = currentUserId();
    const pending = game()?.pendingDeals?.[userId];
    
    if (pending && pending.length > 0 && userId && !claimInProgress()) {
      setClaimInProgress(true);
      try {
        const { getHydratedDeck } = await import("~/lib/game/deck");
        const { whiteCards } = await getHydratedDeck(game()?.settings.deckId);
        const cardsToClaim = pending.map(id => whiteCards.find((c: any) => c.id === id)).filter(Boolean) as any[];
        if (cardsToClaim.length > 0) {
          await claimCardsAction(props.gameId, userId, cardsToClaim);
        }
      } catch (e) {
        console.error("Failed to claim cards:", e);
      } finally {
        setClaimInProgress(false);
      }
    }
  });

  createEffect(() => {
    const roundData = round();
    if (roundData?.status === "complete" && roundData.winnerId === currentUserId()) {
      triggerConfetti();
    }
  });

  createEffect(() => {
    const winner = winnerId();
    if (game()?.status === "finished" && winner && winner === currentUserId()) {
      triggerWinnerCelebration();
    }
  });

  createEffect(() => {
    const container = handContainer();
    const roundNum = game()?.currentRound;
    const cards = hand()?.cards || [];
    
    // Only animate if we have a container, a round, and cards
    if (container && roundNum && cards.length > 0) {
      setRevealedSubmissions({});
      setSelectedCards([]);
      
      // Small delay to ensure children are rendered and layout is calculated
      setTimeout(async () => {
        const cardEls = Array.from(container.querySelectorAll('.hand-card')) as HTMLElement[];
        if (cardEls.length > 0) {
          try {
            const { dealCards } = await import("~/lib/animations/cardAnimations");
            dealCards(cardEls);
          } catch (e) {
            console.error("Failed to play deal animation:", e);
          }
        }
      }, 50);
    }
  });

  const handleCardSelect = async (card: WhiteCard) => {
    if (currentUserId() === round()?.judgeId || round()?.status !== "submitting" || submitting()) return;
    
    const current = selectedCards();
    const isAlreadySelected = current.some(c => c.id === card.id);
    
    if (isAlreadySelected) {
      setSelectedCards(current.filter(c => c.id !== card.id));
      return;
    }
    
    if (current.length < requiredPick()) {
      setSelectedCards([...current, card]);
    }
  };

  const handleSubmitCards = async () => {
    const cards = selectedCards();
    if (cards.length !== requiredPick() || submitting()) return;
    
    setSubmitting(true);
    try {
      await submitCardsAction(props.gameId, `round_${game()?.currentRound}`, currentUserId(), cards);
      setSelectedCards([]);
      triggerConfetti();
    } catch (e) {
      console.error("Failed to submit cards:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWinnerSelect = async (playerId: string) => {
    if (currentUserId() !== round()?.judgeId || round()?.status !== "judging") return;
    await selectWinnerAction(props.gameId, `round_${game()?.currentRound}`, playerId);
    triggerWinnerCelebration();
  };

  const handleNextRound = async () => {
    const { getHydratedDeck } = await import("~/lib/game/deck");
    const deck = await getHydratedDeck(game()?.settings.deckId);
    await nextRoundAction(props.gameId, deck);
  };

  createEffect(() => {
    const nextAt = game()?.nextRoundAt;
    const isRoundComplete = round()?.status === "complete";
    const isRoundEnd = game()?.status === "round_end";
    
    if (isRoundComplete || isRoundEnd) {
      if (nextAt) {
        const interval = setInterval(() => {
          const now = Date.now();
          const remaining = Math.ceil((nextAt - now) / 1000);
          if (remaining <= 0) {
            setNextRoundCountdown(null);
            clearInterval(interval);
            if (isHost()) {
              handleNextRound();
            }
          } else {
            setNextRoundCountdown(remaining);
          }
        }, 100);
        onCleanup(() => clearInterval(interval));
      } else if (isHost()) {
        const transitionAt = Date.now() + 5000;
        setNextRoundTransitionAction(props.gameId, transitionAt);
      }
    } else {
      setNextRoundCountdown(null);
    }
  });

  const winnerId = createMemo(() => {
    const scores = game()?.scores || {};
    const winningScore = game()?.settings.winningScore || 7;
    const entries = Object.entries(scores).filter(([pid, _]) => !!pid && pid !== "undefined");
    
    if (entries.length === 0) return undefined;

    const targetWinner = entries.find(([_, score]) => score >= winningScore)?.[0];
    if (targetWinner) return targetWinner;

    if (game()?.status === "finished") {
      return entries.sort((a, b) => b[1] - a[1])[0][0];
    }

    return undefined;
  });

  const sortedScores = createMemo(() => {
    const scores = game()?.scores || {};
    return Object.entries(scores)
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);
  });

  const handlePlayAgain = () => {
    window.location.href = "/create";
  };

  const winnerName = createMemo(() => {
    const id = winnerId();
    if (!id || id === "undefined") return "NO ONE";
    const name = playerNames()[id];
    if (name) return id === currentUserId() ? `YOU (${name})` : name;
    return `Player ${id.slice(0, 8)}`;
  });

  return (
    <div 
      class={`h-screen w-full flex flex-col transition-colors duration-1000 overflow-hidden ${
        currentUserId() === round()?.judgeId ? "bg-brand-primary/5" : "bg-bg-light"
      }`}
    >
      <Show when={!loading()} fallback={<div class="flex-1 flex items-center justify-center font-black uppercase">Loading Game...</div>}>
        
        <header class="h-16 shrink-0 p-4 flex justify-between items-center border-b border-gray-100 bg-white z-20">
          <div class="font-black italic text-brand-primary uppercase text-lg tracking-tighter">Terrible Cards</div>
          <Show when={currentUserId() === round()?.judgeId}>
            <div class="px-6 py-1.5 bg-brand-primary text-white font-black rounded-full uppercase text-xs tracking-widest shadow-lg animate-pulse" id="judge-banner">
              YOU ARE THE JUDGE
            </div>
          </Show>
          <div class="flex items-center gap-4">
            <Show when={isHost() || currentUserId() === round()?.judgeId}>
              <div class="flex items-center gap-2">
                <Show when={round()?.status === "complete"}>
                   <Button size="sm" onClick={handleNextRound} class="text-[10px] px-2 py-1 bg-green-500 hover:bg-green-600 text-white font-black">
                     NEXT ROUND
                   </Button>
                </Show>
                <Show when={isHost()}>
                  <HostControls gameId={props.gameId} />
                </Show>
              </div>
            </Show>
            <div class="text-xs font-bold uppercase tracking-widest opacity-50 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Round {game()?.currentRound}
            </div>
          </div>
        </header>

        <div class="flex-1 flex min-h-0 overflow-hidden relative">
          <aside class="w-64 border-r border-gray-100 bg-white/50 p-4 hidden lg:flex flex-col min-h-0 overflow-hidden">
             <ScoreBoard 
                scores={game()?.scores || {}} 
                playerUids={game()?.playerUids || []}
                currentUserId={currentUserId()}
                hostId={game()?.hostId || ""}
                playerNames={playerNames()}
                judgeId={round()?.judgeId || ""}
              />
          </aside>

          <main 
            class={`flex-1 flex flex-col items-center justify-between p-4 overflow-hidden min-h-0 relative transition-colors duration-1000 ${
              currentUserId() === round()?.judgeId && round()?.status === "submitting" ? "bg-brand-primary/5" : ""
            }`}
          >
            
            <Show when={game()?.status !== "finished"} fallback={
              <div class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6 w-full max-w-xl animate-in fade-in zoom-in duration-500 overflow-hidden">
                <div class="space-y-2">
                  <h1 class="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter text-brand-primary animate-pulse">
                    Game Over!
                  </h1>
                   <p class="text-lg lg:text-xl font-bold">
                    <span class="text-gray-500 uppercase text-[10px] tracking-widest block mb-1">Grand Winner</span>
                    <span class="text-brand-primary italic text-3xl">
                      <Show when={winnerId()} fallback="NO ONE">
                        {(id) => {
                          const winner = id();
                          if (winner === "undefined" || !winner) return "NO ONE";
                          const name = playerNames()[winner] || `Player ${winner.slice(0, 8)}`;
                          return winner === currentUserId() ? `YOU (${name})` : name;
                        }}
                      </Show>
                    </span>
                  </p>
                </div>

                <div class="w-full bg-white rounded-3xl border-4 border-gray-50 p-4 shadow-2xl overflow-y-auto max-h-[40vh]">
                  <h2 class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Final Hall of Shame</h2>
                  <div class="space-y-2">
                    <For each={sortedScores()}>
                      {(entry, index) => (
                        <div class={`flex justify-between items-center p-2 rounded-xl transition-all ${
                          index() === 0 ? "bg-brand-primary text-white shadow-xl" : 
                          entry.playerId === currentUserId() ? "bg-gray-100 border-2 border-gray-200" : "bg-white border border-gray-100"
                        }`}>
                          <div class="flex items-center gap-2">
                            <span class={`text-lg font-black ${index() === 0 ? "text-white" : "text-gray-300"}`}>
                              {index() === 0 ? "👑" : `#${index() + 1}`}
                            </span>
                            <span class={`text-sm font-bold ${index() === 0 ? "text-white" : entry.playerId === currentUserId() ? "text-brand-primary" : "text-gray-600"}`}>
                              {entry.playerId === currentUserId() ? "YOU" : (playerNames()[entry.playerId] || `Player ${entry.playerId.slice(0, 6)}`)}
                            </span>
                          </div>
                          <span class={`text-xl font-black italic ${index() === 0 ? "text-white" : "text-brand-secondary"}`}>{entry.score}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <div class="flex gap-4 pt-2">
                  <Button size="lg" variant="primary" onClick={handlePlayAgain} class="px-8 py-3 text-sm">
                    Play Again
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => window.location.href = "/"} class="px-8 py-3 text-sm">
                    Home
                  </Button>
                </div>
              </div>
            }>

              <div class="w-full flex-1 flex flex-col items-center justify-start gap-4 min-h-0">
                <section class="perspective-1000 flex flex-col items-center gap-2 z-10 select-none shrink-0">
                  <Show when={(round()?.status === "submitting" || round()?.status === "judging")}>
                    <div class="flex flex-col items-center gap-0">
                      <div class={`text-3xl font-black tabular-nums tracking-tighter ${timeLeft() < 15 ? 'text-brand-primary animate-pulse' : 'text-brand-secondary'}`}>
                        {Math.floor(timeLeft() / 60)}:{(timeLeft() % 60).toString().padStart(2, '0')}
                      </div>
                      <div class="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400">Time Remaining</div>
                    </div>
                  </Show>
                  <Show when={round()?.blackCard}>
                    {(blackCard) => (
                      <div class="relative group h-48 lg:h-64">
                        <div class="absolute -inset-4 bg-brand-primary/5 rounded-[40px] blur-2xl transition-all duration-500" />
                        <Card type="black" card={blackCard()} class="!w-44 !h-60 lg:!w-48 lg:!h-64 relative shadow-2xl border-4 border-black/20" disableFlip={true} />
                      </div>
                    )}
                  </Show>
                </section>

                <PlayArea id="game-play-area" class="flex-1 w-full max-w-5xl rounded-[40px] border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/20 backdrop-blur-sm min-h-[300px] overflow-hidden">
                  <Show when={round()?.status === "submitting"}>
                    <div class="w-full h-full flex items-center justify-center overflow-hidden">
                      <Show when={currentUserId() === round()?.judgeId} fallback={
                        <div class="flex flex-col items-center gap-2 text-center p-4">
                          <div class="relative">
                            <div class="text-6xl font-black text-gray-200 relative">
                              {Object.keys(round()?.submissions || {}).length} / {game()?.playerUids.length! - 1}
                            </div>
                          </div>
                          <div class="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Submissions Collected</div>
                        </div>
                      }>
                        <div class="p-6 lg:p-10 text-center space-y-4 bg-white/60 backdrop-blur-xl rounded-[40px] border-2 border-white shadow-xl animate-in zoom-in fade-in duration-700 max-w-md w-full mx-4">
                          <div class="w-16 h-16 bg-brand-primary rounded-full mx-auto flex items-center justify-center shadow-lg animate-bounce">
                             <span class="text-white text-4xl font-black italic">!</span>
                          </div>
                          <div class="space-y-1">
                            <div class="text-2xl lg:text-3xl font-black uppercase italic text-brand-secondary tracking-tighter">You are the Judge</div>
                            <p class="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px]">Waiting for submissions...</p>
                          </div>
                        </div>
                      </Show>
                    </div>
                  </Show>

                  <Show when={round()?.status === "judging"}>
                    <div class="flex flex-col items-center gap-4 w-full h-full p-4 lg:p-6 overflow-hidden">
                      <div class="text-center space-y-0 shrink-0">
                        <h3 class="text-xl font-black uppercase italic text-brand-secondary tracking-tighter">Judging Phase</h3>
                        <Show when={currentUserId() === round()?.judgeId} fallback={<p class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">The judge is deciding...</p>}>
                          <p class="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] animate-pulse">Click to reveal, then pick the winner!</p>
                        </Show>
                      </div>
                      
                      <div class="flex-1 w-full flex flex-wrap justify-center content-center gap-6 lg:gap-8 overflow-y-auto px-4 py-4 no-scrollbar">
                        <For each={submissions()}>
                          {(sub) => (
                            <div class="flex flex-col items-center gap-3 group transition-transform shrink-0">
                              <div 
                                class={`transition-all duration-500 ${currentUserId() === round()?.judgeId && !isRevealed(sub.playerId) ? "cursor-pointer hover:scale-105 active:scale-95" : ""}`}
                                onClick={() => {
                                  if (currentUserId() === round()?.judgeId && !isRevealed(sub.playerId)) {
                                    toggleReveal(sub.playerId);
                                  }
                                }}
                              >
                                <div class="flex gap-2 relative">
                                  <Show when={isRevealed(sub.playerId) || currentUserId() !== round()?.judgeId}>
                                     <For each={sub.cards}>
                                      {(card) => (
                                        <Card 
                                          type="white" 
                                          card={card} 
                                          class="!w-32 !h-44 lg:!w-36 lg:!h-48 text-xs shadow-xl"
                                          isFlipped={currentUserId() === round()?.judgeId ? !isRevealed(sub.playerId) : false}
                                          disableFlip={true}
                                        />
                                      )}
                                    </For>
                                  </Show>
                                  <Show when={!isRevealed(sub.playerId) && currentUserId() === round()?.judgeId}>
                                     <div class="w-32 h-44 lg:w-36 lg:h-48 bg-brand-secondary rounded-2xl flex items-center justify-center shadow-xl border-4 border-white transform transition-all duration-300 hover:rotate-3 group-hover:bg-brand-primary group-hover:scale-105">
                                        <span class="text-white font-black text-5xl italic">?</span>
                                     </div>
                                  </Show>
                                </div>
                              </div>
                              <Show when={isRevealed(sub.playerId) && currentUserId() === round()?.judgeId}>
                                <Button 
                                  size="sm" 
                                  variant="primary" 
                                  onClick={() => handleWinnerSelect(sub.playerId)}
                                  class="px-6 py-2 rounded-xl font-black uppercase tracking-tighter text-xs shadow-lg transform hover:scale-110 active:scale-90 border-2 border-white/20"
                                >
                                  Pick Winner
                                </Button>
                              </Show>
                            </div>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={round()?.status === "complete"}>
                      <div class="flex flex-col items-center justify-center h-full gap-6 animate-in zoom-in fade-in duration-500 p-4 lg:p-6">
                        <div class="text-center space-y-1 shrink-0">
                          <h2 class="text-3xl lg:text-4xl font-black uppercase text-brand-primary italic tracking-tighter animate-bounce">Winner Revealed!</h2>
                          <Show when={nextRoundCountdown() !== null} fallback={
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                              Winner: {(() => {
                                const wId = round()?.winnerId;
                                if (!wId || wId === "undefined" || wId === "NONE") return "TIE / NONE";
                                return wId === currentUserId() ? "YOU!" : (playerNames()[wId] || `Player ${wId.slice(0, 8)}`);
                              })()}
                            </p>
                          }>
                             <div class="text-3xl lg:text-4xl font-black text-brand-secondary bg-white px-6 py-2 rounded-2xl shadow-xl border-2 border-brand-secondary/20 relative group">
                               Next round in {nextRoundCountdown()}
                               <Show when={isHost() || currentUserId() === round()?.judgeId}>
                                  <button onClick={handleNextRound} class="absolute -top-3 -right-3 bg-brand-primary text-white text-[8px] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">SKIP</button>
                               </Show>
                             </div>
                          </Show>
                        </div>
                        <div class="flex gap-4 lg:gap-6 relative shrink min-h-0">
                          <div class="absolute -inset-20 bg-brand-primary/5 rounded-[100px] blur-[80px]" />
                          <For each={round()?.winningCards || []}>
                            {(card) => <Card type="white" card={card} class="!w-36 !h-48 lg:!w-40 !h-56 relative shadow-2xl border-4 border-brand-primary/10" disableFlip={true} />}
                          </For>
                        </div>
                        <Show when={(isHost() || currentUserId() === round()?.judgeId) && nextRoundCountdown() === null}>
                           <div class="flex flex-col items-center gap-4">
                             <Button onClick={handleNextRound} class="shrink-0 px-12 py-3 rounded-2xl shadow-xl hover:scale-110 active:scale-90 transition-all font-black uppercase tracking-tighter bg-brand-primary text-white border-4 border-white/20">
                               {isHost() ? "START NEXT ROUND" : "FORCE NEXT ROUND"}
                             </Button>
                             <p class="text-[10px] font-bold text-brand-secondary/40 uppercase tracking-widest">
                               The next round will start automatically in a few seconds
                             </p>
                           </div>
                        </Show>
                      </div>
                  </Show>
                </PlayArea>
              </div>

              <section class="w-full shrink-0 h-40 lg:h-52 relative select-none mt-2">

                <Show when={currentUserId() !== round()?.judgeId && round()?.status === "submitting" && !round()?.submissions[currentUserId()]}>
                  <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute bottom-0 inset-x-0 h-full bg-gradient-to-t from-bg-light/80 via-bg-light/20 to-transparent pointer-events-none" />
                    
                    <div class="absolute bottom-2 right-4 pointer-events-auto hidden xl:block group">
                      <div class="relative w-12 h-16 transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                        <div class="absolute inset-0 bg-brand-secondary rounded-lg border border-gray-700 transform translate-x-1 translate-y-1 shadow-md" />
                        <div class="absolute inset-0 bg-brand-secondary rounded-lg border border-gray-700 flex flex-col items-center justify-center shadow-md">
                          <span class="text-white/20 font-black text-[10px] uppercase rotate-45">Deck</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-col items-center justify-end h-full pb-2 w-full pointer-events-auto overflow-hidden">
                      <div class="flex flex-col items-center gap-1 mb-1 shrink-0">
                        <div class={`px-3 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest transition-all duration-300 ${selectedCards().length === requiredPick() ? 'bg-brand-primary text-white scale-105' : 'bg-brand-secondary text-white/50 animate-bounce'}`}>
                          {selectedCards().length === requiredPick() ? 'Ready!' : `Pick ${requiredPick()} (${selectedCards().length}/${requiredPick()})`}
                        </div>

                        <Show when={selectedCards().length === requiredPick()}>
                          <Button 
                            size="sm" 
                            variant="primary" 
                            onClick={handleSubmitCards}
                            disabled={submitting()}
                            class="shadow-xl px-4 py-1 text-xs rounded-lg border border-white/20 hover:scale-110 active:scale-95 transition-all"
                          >
                            {submitting() ? "..." : "CONFIRM SELECTION"}
                          </Button>
                        </Show>
                      </div>
                      
                      <div 
                        ref={setHandContainer}
                        class="flex justify-start md:justify-center items-end h-28 lg:h-36 px-4 md:px-10 max-w-full overflow-x-auto no-scrollbar snap-x snap-mandatory"
                        style={isMobile() ? { "padding-left": "calc(50% - 60px)", "padding-right": "calc(50% - 60px)" } : {}}
                      >
                        <For each={hand()?.cards || []}>
                          {(card, index) => {
                            const isSelected = createMemo(() => 
                              selectedCards().some(c => c.id === card.id)
                            );
                            
                            const total = () => hand()?.cards.length || 1;
                            const rotation = () => (index() - (total() - 1) / 2) * (isMobile() ? 0 : 2);
                            const translateY = () => isMobile() ? 0 : Math.abs(index() - (total() - 1) / 2) * 3;
                            
                            return (
                              <div 
                                class="hand-card transition-all duration-500 hover:-translate-y-8 cursor-pointer first:ml-0 origin-bottom group shrink-0 snap-center"
                                classList={{
                                  "mx-2": isMobile(),
                                  "-ml-16 md:-ml-12 lg:-ml-16": !isMobile()
                                }}
                                style={{ 
                                  transform: `rotate(${rotation()}deg) translateY(${translateY()}px) ${isSelected() ? 'translateY(-30px) rotate(0deg) scale(1.05)' : ''}`,
                                  "z-index": isSelected() ? 200 : index() + 10 
                                }}
                              >
                                <Card 
                                  type="white" 
                                  card={card} 
                                  class={`!w-28 !h-40 md:!w-24 md:!h-32 lg:!w-32 lg:!h-44 shadow-xl transition-all duration-300 ${isSelected() ? 'ring-2 ring-brand-primary ring-offset-2 bg-brand-primary/5' : 'group-hover:ring-1 group-hover:brand-primary/30'}`}
                                  disableFlip={true}
                                  isSelected={isSelected()}
                                  onClick={() => handleCardSelect(card)}
                                />
                                <Show when={isSelected()}>
                                   <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-md border border-white">
                                      {selectedCards().findIndex(c => c.id === card.id) + 1}
                                   </div>
                                </Show>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  </div>
                </Show>

                <Show when={round()?.submissions[currentUserId()] && round()?.status === "submitting"}>
                  <div class="flex flex-col items-center justify-center h-full gap-2 bg-white/50 backdrop-blur-sm rounded-t-3xl border-t-2 border-brand-primary/20 animate-in slide-in-from-bottom duration-500">
                    <div class="w-10 h-10 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                       <span class="text-xl font-black italic">✓</span>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-black uppercase italic text-brand-primary tracking-tighter">Submitted!</div>
                      <p class="text-brand-secondary/50 font-bold uppercase tracking-[0.2em] text-[8px]">Waiting for others...</p>
                    </div>
                  </div>
                </Show>

                <Show when={round()?.status === "judging" && currentUserId() !== round()?.judgeId}>
                   <div class="flex flex-col items-center justify-center h-full gap-2 bg-white/50 backdrop-blur-sm rounded-t-3xl border-t-2 border-brand-secondary/20 animate-in slide-in-from-bottom duration-500">
                    <div class="w-10 h-10 bg-brand-secondary text-white rounded-full flex items-center justify-center shadow-lg">
                       <span class="text-xl font-black italic">?</span>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-black uppercase italic text-brand-secondary tracking-tighter">Judging...</div>
                      <p class="text-brand-secondary/50 font-bold uppercase tracking-[0.2em] text-[8px]">The judge is picking</p>
                    </div>
                  </div>
                </Show>
              </section>

            </Show>
          </main>
        </div>

      </Show>
    </div>
  );
}
