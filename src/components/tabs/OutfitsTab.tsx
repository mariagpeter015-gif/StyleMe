import { useState } from "react";
import { Sparkles, RefreshCw, MapPin } from "lucide-react";
import type { WardrobeItem } from "./WardrobeTab";

interface OutfitCombo {
  id: string;
  name: string;
  score: number;
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  shoes: WardrobeItem | null;
  stores: { name: string; distance: string }[];
}

const storePool = [
  { name: "Zara", distance: "0.8km" },
  { name: "H&M", distance: "1.2km" },
  { name: "Uniqlo", distance: "1.5km" },
  { name: "COS", distance: "2.1km" },
  { name: "Mango", distance: "0.6km" },
  { name: "& Other Stories", distance: "1.8km" },
];

const outfitNames = [
  "Casual Friday",
  "Weekend Brunch",
  "City Walk",
  "Office Chic",
  "Evening Out",
  "Sunday Errands",
  "Smart Casual",
  "Laid-Back Vibes",
];

const placeholderColors = [
  "hsl(153 44% 88%)",
  "hsl(210 25% 88%)",
  "hsl(30 30% 88%)",
  "hsl(280 20% 88%)",
  "hsl(0 20% 88%)",
  "hsl(45 40% 88%)",
];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateCombo(items: WardrobeItem[]): OutfitCombo {
  const tops = items.filter((i) => ["Shirt", "T-Shirt", "Sweater", "Hoodie"].includes(i.category));
  const bottoms = items.filter((i) => ["Pants", "Jeans", "Shorts", "Skirt"].includes(i.category));
  const shoes = items.filter((i) => i.category === "Shoes");

  return {
    id: crypto.randomUUID(),
    name: outfitNames[Math.floor(Math.random() * outfitNames.length)],
    score: Math.floor(Math.random() * 15) + 82,
    top: tops.length ? tops[Math.floor(Math.random() * tops.length)] : null,
    bottom: bottoms.length ? bottoms[Math.floor(Math.random() * bottoms.length)] : null,
    shoes: shoes.length ? shoes[Math.floor(Math.random() * shoes.length)] : null,
    stores: pickRandom(storePool, 3),
  };
}

function generatePlaceholderCombo(): OutfitCombo {
  const pick = () => placeholderColors[Math.floor(Math.random() * placeholderColors.length)];
  return {
    id: crypto.randomUUID(),
    name: outfitNames[Math.floor(Math.random() * outfitNames.length)],
    score: Math.floor(Math.random() * 15) + 82,
    top: { id: "p1", category: "Shirt", dominantColor: pick(), imageUrl: "" },
    bottom: { id: "p2", category: "Pants", dominantColor: pick(), imageUrl: "" },
    shoes: { id: "p3", category: "Shoes", dominantColor: pick(), imageUrl: "" },
    stores: pickRandom(storePool, 3),
  };
}

interface OutfitsTabProps {
  items?: WardrobeItem[];
}

function ItemSlot({ item, label }: { item: WardrobeItem | null; label: string }) {
  if (!item) {
    return (
      <div className="flex aspect-square flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
    );
  }
  if (item.imageUrl) {
    return (
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border">
        <img src={item.imageUrl} alt={item.category} className="aspect-square w-full object-cover" />
        <span className="absolute bottom-1 left-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
          {label}
        </span>
      </div>
    );
  }
  return (
    <div
      className="relative flex aspect-square flex-1 items-center justify-center rounded-xl border border-border"
      style={{ backgroundColor: item.dominantColor }}
    >
      <span className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

function OutfitCard({
  combo,
  onRegenerate,
  highlight,
}: {
  combo: OutfitCombo;
  onRegenerate: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-4 ${
        highlight ? "border-primary/30 shadow-md" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{combo.name}</h4>
        <span className="text-sm font-medium text-foreground">✨ {combo.score}% match</span>
      </div>

      {/* 3 items side by side */}
      <div className="mb-3 flex gap-2">
        <ItemSlot item={combo.top} label="Top" />
        <ItemSlot item={combo.bottom} label="Bottom" />
        <ItemSlot item={combo.shoes} label="Shoes" />
      </div>

      {/* Store pills */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {combo.stores.map((s) => (
          <span
            key={s.name}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
          >
            <MapPin className="h-3 w-3" />
            {s.name} • {s.distance}
          </span>
        ))}
      </div>

      <button
        onClick={onRegenerate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-transform active:scale-[0.97]"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Regenerate
      </button>
    </div>
  );
}

const OutfitsTab = ({ items = [] }: OutfitsTabProps) => {
  const hasItems = items.length > 0;
  const gen = () => (hasItems ? generateCombo(items) : generatePlaceholderCombo());

  const [todaysPick, setTodaysPick] = useState<OutfitCombo>(gen);
  const [combos, setCombos] = useState<OutfitCombo[]>([gen(), gen()]);

  const regenerateToday = () => setTodaysPick(gen());
  const regenerateAt = (idx: number) =>
    setCombos((prev) => prev.map((c, i) => (i === idx ? gen() : c)));

  return (
    <div className="animate-fade-in">
      {/* Today's Pick */}
      <div className="mb-6">
        <h3 className="mb-3 text-base font-semibold text-foreground">Today's Pick 🌤️</h3>
        <OutfitCard combo={todaysPick} onRegenerate={regenerateToday} highlight />
      </div>

      {/* More combinations */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        More Combinations
      </h3>

      <div className="flex flex-col gap-3">
        {combos.map((combo, idx) => (
          <OutfitCard key={combo.id} combo={combo} onRegenerate={() => regenerateAt(idx)} />
        ))}
      </div>

      <button
        onClick={() => setCombos((prev) => [...prev, gen()])}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
      >
        <Sparkles className="h-5 w-5" />
        Generate More
      </button>
    </div>
  );
};

export default OutfitsTab;
