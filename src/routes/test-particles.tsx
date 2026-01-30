import { Button } from "~/components/ui/Button";
import { triggerConfetti, triggerWinnerCelebration } from "~/lib/animations/particles";

export default function TestParticles() {
  return (
    <div class="p-8 max-w-4xl mx-auto space-y-12 flex flex-col items-center justify-center min-h-screen">
      <section class="text-center space-y-8">
        <h2 class="text-3xl font-black uppercase tracking-tighter">Particle Effects Test</h2>
        
        <div class="flex flex-wrap justify-center gap-6">
          <Button size="lg" onClick={triggerConfetti}>
            🎉 Single Burst
          </Button>
          <Button variant="secondary" size="lg" onClick={triggerWinnerCelebration}>
            🏆 Winner Celebration
          </Button>
        </div>

        <div class="max-w-md mx-auto p-6 bg-brand-secondary text-white rounded-2xl shadow-xl">
          <p class="opacity-80 leading-relaxed">
            Using <strong>canvas-confetti</strong> for lightweight, high-performance particle effects. 
            "Single Burst" is for card plays, "Winner Celebration" is for round winners.
          </p>
        </div>
      </section>
    </div>
  );
}
