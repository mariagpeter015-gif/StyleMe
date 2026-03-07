import { useState } from "react";
import { Sparkles, RefreshCw, MapPin, Loader2 } from "lucide-react";
import type { WardrobeItem } from "./WardrobeTab";

interface OutfitCombo {
  id: string;
  name: string;
  reasoning: string;
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  outer: WardrobeItem | null;
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

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function getGroqOutfit(occasion: string, items: WardrobeItem[]): Promise<OutfitCombo> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const wardrobeText = items.map(i => `id:${i.id} type:${i.category} color:${i.dominantColor}`).join("\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a fashion stylist. Respond ONLY with valid JSON, no extra text."
        },
        {
          role: "user",
          content: `Occasion: "${occasion}"
          
Wardrobe:
${wardrobeText}

Pick the best outfit. Respond ONLY with this JSON:
{
  "name": "outfit vibe name (2-3 words)",
  "reasoning": "one sentence why this works",
  "top_id": "item id or null",
  "bottom_id": "item id or null",
  "outer_id": "item id or null"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  const data = await response.json();
  console.log("Groq response:", JSON.stringify(data));
  const text = data.choices[0].message.content;
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  const findItem = (id: string | null) => {
    if (!id || id === "null") return null;
    return items.find(i => i.id === id) ?? null;
  };

  return {
    id: crypto.randomUUID(),
    name: parsed.name,
    reasoning: parsed.reasoning,
    top: findItem(parsed.top_id),
    bottom: findItem(parsed.bottom_id),
    outer: findItem(parsed.outer_id),
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
  loading,
}: {
  combo: OutfitCombo;
  onRegenerate: () => void;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div className={`rounded-2xl border bg-card p-4 ${highlight ? "border-primary/30 shadow-md" : "border-border"}`}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-foreground">{combo.name}</h4>
        <span className="text-xs text-muted-foreground">AI Pick ✨</span>
      </div>

      {combo.reasoning && (
        <p className="mb-3 text-xs text-muted-foreground italic">"{combo.reasoning}"</p>
      )}

      <div className="mb-3 flex gap-2">
        <ItemSlot item={combo.top} label="Top" />
        <ItemSlot item={combo.bottom} label="Bottom" />
        <ItemSlot item={combo.outer} label="Outer" />
      </div>

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
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-transform active:scale-[0.97] disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {loading ? "Generating..." : "Regenerate"}
      </button>
    </div>
  );
}

const OutfitsTab = ({ items = [] }: OutfitsTabProps) => {
  const [occasion, setOccasion] = useState("");
  const [outfit, setOutfit] = useState<OutfitCombo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOutfit = async () => {
    if (!occasion.trim()) {
      setError("Please enter an occasion first.");
      return;
    }
    if (items.length === 0) {
      setError("Please upload some clothes first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getGroqOutfit(occasion, items);
      setOutfit(result);
    } catch (err) {
      console.error(err);
      setError("Failed to generate outfit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h3 className="mb-3 text-base font-semibold text-foreground">What's the occasion?</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="e.g. job interview, beach day, date night..."
            className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && generateOutfit()}
          />
          <button
            onClick={generateOutfit}
            disabled={loading}
            className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Styling your outfit...</p>
        </div>
      )}

      {outfit && !loading && (
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">Your Outfit 🌤️</h3>
          <OutfitCard combo={outfit} onRegenerate={generateOutfit} loading={loading} highlight />
        </div>
      )}

      {!outfit && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-12 w-12 text-primary/40 mb-4" />
          <p className="text-sm text-muted-foreground">Enter an occasion above and let AI style you!</p>
        </div>
      )}
    </div>
  );
};

export default OutfitsTab;