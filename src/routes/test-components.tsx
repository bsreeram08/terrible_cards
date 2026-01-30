import { createSignal } from "solid-js";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Card } from "~/components/ui/Card";
import { Modal } from "~/components/ui/Modal";

export default function TestComponents() {
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [inputValue, setInputValue] = createSignal("");

  return (
    <div class="p-8 max-w-4xl mx-auto space-y-12">
      <section>
        <h2 class="text-2xl font-black mb-6 uppercase tracking-tight">Buttons</h2>
        <div class="flex flex-wrap gap-4 items-center">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-black mb-6 uppercase tracking-tight">Inputs</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Input 
            label="Name" 
            placeholder="Enter your name" 
            value={inputValue()}
            onInput={(e) => setInputValue(e.currentTarget.value)}
          />
          <Input 
            label="Room Code" 
            placeholder="ABCD" 
            error="This room code is invalid" 
          />
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-black mb-6 uppercase tracking-tight">Cards</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card padding="sm">Small Padding Card</Card>
          <Card padding="md">Medium Padding Card (Default)</Card>
          <Card padding="lg">Large Padding Card</Card>
        </div>
      </section>

      <section>
        <h2 class="text-2xl font-black mb-6 uppercase tracking-tight">Modals</h2>
        <Button onClick={() => setIsModalOpen(true)}>Open Test Modal</Button>
        <Modal 
          isOpen={isModalOpen()} 
          onClose={() => setIsModalOpen(false)}
          title="Testing Modal"
        >
          <p class="text-gray-600 mb-6">
            This is a reusable modal component using SolidJS Portals. 
            It supports Esc to close and backdrop clicking.
          </p>
          <div class="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</Button>
          </div>
        </Modal>
      </section>
    </div>
  );
}
