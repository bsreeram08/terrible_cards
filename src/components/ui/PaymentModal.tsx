import { createSignal, Show } from "solid-js";
import { Modal } from "~/components/ui/Modal";
import { Button } from "~/components/ui/Button";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemName: string;
  price: string;
}

export function PaymentModal(props: PaymentModalProps) {
  const [processing, setProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handlePay = () => {
    setProcessing(true);
    setError(null);
    
    // Simulate API call
    setTimeout(() => {
      setProcessing(false);
      props.onSuccess();
      props.onClose();
    }, 2000);
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Secure Checkout"
    >
      <div class="space-y-6">
        <div class="flex justify-between items-center pb-4 border-b border-brand-secondary/10">
          <div class="space-y-1">
            <h4 class="font-bold text-brand-secondary">{props.itemName}</h4>
            <p class="text-xs text-brand-secondary/60">Premium Upgrade</p>
          </div>
          <span class="text-2xl font-black text-brand-primary">{props.price}</span>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-brand-secondary/60">Card Number</label>
            <div class="bg-brand-secondary/5 p-3 rounded-lg border border-brand-secondary/20 font-mono text-sm flex items-center gap-2">
              <span class="text-gray-400">💳</span>
              <span class="text-brand-secondary">4242 4242 4242 4242</span>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-brand-secondary/60">Expiry</label>
              <div class="bg-brand-secondary/5 p-3 rounded-lg border border-brand-secondary/20 font-mono text-sm text-brand-secondary">
                12 / 25
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-widest text-brand-secondary/60">CVC</label>
              <div class="bg-brand-secondary/5 p-3 rounded-lg border border-brand-secondary/20 font-mono text-sm text-brand-secondary">
                123
              </div>
            </div>
          </div>
        </div>

        <Show when={error()}>
          <div class="text-red-500 text-sm font-bold text-center">{error()}</div>
        </Show>

        <Button 
          class="w-full" 
          size="lg" 
          onClick={handlePay}
          disabled={processing()}
        >
          {processing() ? "Processing..." : `Pay ${props.price}`}
        </Button>
        
        <p class="text-[10px] text-center text-gray-400">
          This is a mock payment. No real money will be charged.
        </p>
      </div>
    </Modal>
  );
}
