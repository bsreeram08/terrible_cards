import { For, Show } from "solid-js";
import { Card } from "~/components/ui/Card";

interface ScoreBoardProps {
  scores: { [playerId: string]: number };
  playerUids: string[];
  currentUserId: string;
  hostId: string;
  playerNames: Record<string, string>;
  judgeId: string;
}

export function ScoreBoard(props: ScoreBoardProps) {
  return (
    <Card padding="sm" class="w-full flex flex-col gap-2 max-h-[40vh] overflow-hidden">
      <h3 class="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Scoreboard</h3>
      <div class="flex flex-col gap-1 overflow-y-auto pr-1">
        <For each={props.playerUids}>
          {(uid) => (
            <div 
              class={`
                flex justify-between items-center p-2 rounded-lg transition-colors border
                ${uid === props.currentUserId ? "bg-brand-primary/5 border-brand-primary/20" : "bg-transparent border-transparent hover:bg-gray-50"} 
                ${uid === props.judgeId ? "border-brand-secondary/30 bg-brand-secondary/5" : ""}
              `}
            >
              <div class="flex items-center gap-2 min-w-0">
                <Show when={uid === props.hostId}>
                  <div class="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" title="Host" />
                </Show>
                
                <div class="flex flex-col min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span class={`text-xs font-bold truncate ${uid === props.currentUserId ? "text-brand-primary" : "text-gray-700"}`}>
                      {uid === props.currentUserId ? "YOU" : (props.playerNames[uid] || `Player ${uid.slice(0, 4)}`)}
                    </span>
                    
                    <Show when={uid === props.judgeId}>
                      <span class="text-[9px] font-black bg-brand-secondary text-white px-1 py-0.5 rounded uppercase tracking-tighter leading-none">
                        JUDGE
                      </span>
                    </Show>
                  </div>
                </div>
              </div>
              
              <span class="text-sm font-black italic tabular-nums text-gray-900 ml-2">
                {props.scores[uid] || 0}
              </span>
            </div>
          )}
        </For>
      </div>
    </Card>
  );
}
