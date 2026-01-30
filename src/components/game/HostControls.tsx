import { createSignal } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Modal } from "~/components/ui/Modal";
import { endGameAction } from "~/lib/game/actions";

interface HostControlsProps {
  gameId: string;
}

export function HostControls(props: HostControlsProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const handleEndGame = async () => {
    if (!confirm("Are you sure you want to end the game for everyone?")) return;
    setLoading(true);
    try {
      await endGameAction(props.gameId);
      setIsOpen(false);
    } catch (e) {
      console.error("Failed to end game:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
        Host Controls
      </Button>

      <Modal
        isOpen={isOpen()}
        onClose={() => setIsOpen(false)}
        title="Host Controls"
      >
        <div class="space-y-4">
          <p class="text-sm text-gray-500">
            Manage the game state. These actions affect all players.
          </p>
          
          <div class="flex flex-col gap-3">
            <Button 
              variant="danger" 
              onClick={handleEndGame} 
              disabled={loading()}
            >
              {loading() ? "Ending..." : "End Game Immediately"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
