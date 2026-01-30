const firstParts = [
  "Clever", "Swift", "Mighty", "Brave", "Wise", "Calm", "Bold", 
  "Bright", "Noble", "Royal", "Mystic", "Cosmic", "Vibrant", "Joyful",
  "Daring", "Witty", "Nimble", "Radiant", "Serene", "Fierce"
];

const secondParts = [
  "Peacock", "Tiger", "Lotus", "Elephant", "Cobra", "Mango", "Banyan",
  "Jasmine", "Monsoon", "Mountain", "River", "Spice", "Flame", "Warrior",
  "Dancer", "Poet", "Scholar", "Voyager", "Sage", "Dreamer"
];

export function generateRandomName(): string {
  const firstPart = firstParts[Math.floor(Math.random() * firstParts.length)];
  const secondPart = secondParts[Math.floor(Math.random() * secondParts.length)];
  const randomNum = Math.floor(Math.random() * 999) + 1;
  
  return `${firstPart}${secondPart}${randomNum}`;
}
