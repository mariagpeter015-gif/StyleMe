import { useState, useRef } from "react";
import { Sparkles, RefreshCw, MapPin, Loader2, X, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { WardrobeItem } from "./WardrobeTab";
import { findStoresForOccasion, NearbyStore } from "@/lib/stores";
import html2canvas from "html2canvas";

interface OutfitCombo {
  id: string;
  name: string;
  reasoning: string;
  top: WardrobeItem | null;
  bottom: WardrobeItem | null;
  outer: WardrobeItem | null;
}

function rgbToColorName(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return "neutral";
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (lightness > 220) return "white";
  if (lightness < 40) return "black";
  if (lightness > 180 && max - min < 30) return "light grey";
  if (lightness > 100 && max - min < 25) return "grey";
  if (r > g + 40 && r > b + 40) return r > 180 ? "red" : "dark red";
  if (b > r + 40 && b > g + 40) return b > 150 ? "blue" : "navy blue";
  if (g > r + 30 && g > b + 30) return "green";
  if (r > 180 && g > 180 && b < 100) return "yellow";
  if (r > 180 && g > 100 && b < 80) return "orange";
  if (r > 150 && b > 150 && g < 100) return "purple";
  if (r > 180 && g > 120 && b > 120 && r > g) return "pink";
  if (r > 120 && g > 80 && b < 80 && r > b + 40) return "brown";
  if (r > 150 && g > 140 && b > 100 && r > b) return "beige";
  if (b > r && b > g && lightness < 100) return "dark blue";
  if (r > 100 && g > 100 && b > 80 && max - min < 40) return "olive";
  return "neutral";
}

async function saveFeedback(occasion: string, combo: OutfitCombo, feedback: "good" | "bad") {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("outfit_feedback").insert({
      user_id: user?.id,
      occasion,
      outfit_combo: {
        top: combo.top ? { id: combo.top.id, category: combo.top.category, color: combo.top.dominantColor } : null,
        bottom: combo.bottom ? { id: combo.bottom.id, category: combo.bottom.category, color: combo.bottom.dominantColor } : null,
        outer: combo.outer ? { id: combo.outer.id, category: combo.outer.category, color: combo.outer.dominantColor } : null,
      },
      feedback,
    });
  } catch (err) {
    console.error("Failed to save feedback:", err);
  }
}

async function getGroqOutfit(occasion: string, items: WardrobeItem[]): Promise<OutfitCombo> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  let profileText = "";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await (supabase as any).from("profiles").select("*").eq("user_id", user?.id).single();
    if (profile) profileText = `User profile: skin tone: ${profile.skin_tone}, style: ${profile.style_preference}, personality: ${profile.personality}, body type: ${profile.body_type}`;
  } catch { profileText = ""; }

  let feedbackText = "";
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: feedbacks } = await (supabase as any).from("outfit_feedback").select("*").eq("user_id", user?.id).order("created_at", { ascending: false }).limit(5);
    if (feedbacks && feedbacks.length > 0) {
      feedbackText = "Previous outfit feedback:\n" + feedbacks.map((f: any) =>
        `- ${f.feedback === "good" ? "Liked" : "Disliked"}: ${JSON.stringify(f.outfit_combo)} for ${f.occasion}`
      ).join("\n");
    }
  } catch { feedbackText = ""; }

  const tops = items.filter(i => ["Shirt", "T-Shirt", "Sweater", "Hoodie"].includes(i.category));
  const bottoms = items.filter(i => ["Pants", "Jeans", "Skirt", "Shorts"].includes(i.category));
  const outers = items.filter(i => i.category === "Jacket");
  const others = items.filter(i => ["Dress", "Saree"].includes(i.category));

  const wardrobeText = [
    tops.length > 0 ? "TOPS:\n" + tops.map(i => `id:${i.id} type:${i.category} color:${rgbToColorName(i.dominantColor)}`).join("\n") : null,
    bottoms.length > 0 ? "BOTTOMS:\n" + bottoms.map(i => `id:${i.id} type:${i.category} color:${rgbToColorName(i.dominantColor)}`).join("\n") : null,
    outers.length > 0 ? "OUTERWEAR:\n" + outers.map(i => `id:${i.id} type:${i.category} color:${rgbToColorName(i.dominantColor)}`).join("\n") : null,
    others.length > 0 ? "OTHERS:\n" + others.map(i => `id:${i.id} type:${i.category} color:${rgbToColorName(i.dominantColor)}`).join("\n") : null,
  ].filter(Boolean).join("\n\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a fashion stylist. Respond ONLY with a raw JSON object. No markdown, no code blocks, no explanation, no extra text before or after. Just the JSON object itself. ONLY use item IDs that exist in the wardrobe. Never invent IDs." },
        { role: "user", content: `Occasion: "${occasion}"\n${profileText}\n${feedbackText}\n\nWardrobe:\n${wardrobeText}\n\nRules:\n- Match formality to occasion.\n- Only use IDs from above. null if category missing.\n- outer_id only if OUTERWEAR items exist.\n- Pick a DIFFERENT combination every time. Vary your choices.\n- Random seed: ${Math.random()}\n\nRespond ONLY with:\n{\n  "name": "vibe name",\n  "reasoning": "one sentence",\n  "top_id": "id or null",\n  "bottom_id": "id or null",\n  "outer_id": "id or null"\n}` },
      ],
      temperature: 1.2,
      max_tokens: 300,
    }),
  });

  if (response.status === 429) {
    throw new Error("Too many requests — please wait 30 seconds and try again.");
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    console.error("Groq bad response:", JSON.stringify(data));
    throw new Error("AI returned an empty response. Please try again.");
  }

  const text = data.choices[0].message.content;
  console.log("Raw Groq text:", text);
  const clean = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/^[\s\S]*?({)/m, "$1")
    .replace(/(})[\s\S]*$/m, "$1")
    .trim();
  const parsed = JSON.parse(clean);
  const findItem = (id: string | null) => (!id || id === "null") ? null : items.find(i => i.id === id) ?? null;
  return { id: crypto.randomUUID(), name: parsed.name, reasoning: parsed.reasoning, top: findItem(parsed.top_id), bottom: findItem(parsed.bottom_id), outer: findItem(parsed.outer_id) };
}

async function getGroqPairing(anchorItem: WardrobeItem, items: WardrobeItem[]): Promise<OutfitCombo> {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const otherItems = items.filter(i => i.id !== anchorItem.id);
  const wardrobeText = otherItems.map(i => `id:${i.id} type:${i.category} color:${rgbToColorName(i.dominantColor)}`).join("\n");
  const anchorRole = ["Shirt", "T-Shirt", "Sweater", "Hoodie"].includes(anchorItem.category) ? "top"
    : ["Pants", "Jeans", "Skirt", "Shorts"].includes(anchorItem.category) ? "bottom"
    : anchorItem.category === "Jacket" ? "outer" : "top";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a fashion stylist. Respond ONLY with a raw JSON object. No markdown, no code blocks, no explanation, no extra text before or after. Just the JSON object itself. ONLY use item IDs from the provided wardrobe list." },
        { role: "user", content: `The user selected this item and wants to know what pairs with it:\nSELECTED: id:${anchorItem.id} type:${anchorItem.category} color:${rgbToColorName(anchorItem.dominantColor)}\nThis is the ${anchorRole}.\n\nOther wardrobe items:\n${wardrobeText || "None available."}\n\nBuild an outfit around the selected item. Lock it in the ${anchorRole} slot. Pick best matches for other slots from the list above only. null if nothing suitable.\n- Pick a DIFFERENT combination every time.\n- Random seed: ${Math.random()}\n\nRespond ONLY with:\n{\n  "name": "vibe name",\n  "reasoning": "why these items work together",\n  "top_id": "${anchorRole === "top" ? anchorItem.id : "id or null"}",\n  "bottom_id": "${anchorRole === "bottom" ? anchorItem.id : "id or null"}",\n  "outer_id": "${anchorRole === "outer" ? anchorItem.id : "null"}"\n}` },
      ],
      temperature: 1.2,
      max_tokens: 300,
    }),
  });

  if (response.status === 429) {
    throw new Error("Too many requests — please wait 30 seconds and try again.");
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    console.error("Groq bad response:", JSON.stringify(data));
    throw new Error("AI returned an empty response. Please try again.");
  }

  const text = data.choices[0].message.content;
  console.log("Raw Groq pairing text:", text);
  const clean = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/^[\s\S]*?({)/m, "$1")
    .replace(/(})[\s\S]*$/m, "$1")
    .trim();
  const parsed = JSON.parse(clean);
  const findItem = (id: string | null) => (!id || id === "null") ? null : items.find(i => i.id === id) ?? null;
  return { id: crypto.randomUUID(), name: parsed.name, reasoning: parsed.reasoning, top: findItem(parsed.top_id), bottom: findItem(parsed.bottom_id), outer: findItem(parsed.outer_id) };
}

interface OutfitsTabProps {
  items?: WardrobeItem[];
  pairingItem?: WardrobeItem | null;
  onClearPairing?: () => void;
}

function ItemSlot({ item, label, highlighted }: { item: WardrobeItem | null; label: string; highlighted?: boolean }) {
  if (!item) {
    return (
      <div className="flex aspect-square flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/50">
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
    );
  }
  if (item.imageUrl) {
    return (
      <div className={`relative flex-1 overflow-hidden rounded-xl border ${highlighted ? "border-primary ring-2 ring-primary/40" : "border-border"}`}>
        <img src={item.imageUrl} alt={item.category} className="aspect-square w-full object-cover" crossOrigin="anonymous" />
        <span className="absolute bottom-1 left-1 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
          {highlighted ? "⭐ " : ""}{label}
        </span>
      </div>
    );
  }
  return (
    <div className={`relative flex aspect-square flex-1 items-center justify-center rounded-xl border ${highlighted ? "border-primary ring-2 ring-primary/40" : "border-border"}`} style={{ backgroundColor: item.dominantColor }}>
      <span className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">{label}</span>
    </div>
  );
}

function OutfitCard({ combo, occasion, anchorItemId, onRegenerate, highlight, loading, cooldown, nearbyStores, storesLoading, storesError }: {
  combo: OutfitCombo; occasion: string; anchorItemId?: string | null;
  onRegenerate: () => void; highlight?: boolean; loading?: boolean; cooldown?: boolean;
  nearbyStores?: NearbyStore[]; storesLoading?: boolean; storesError?: string | null;
}) {
  const [feedbackGiven, setFeedbackGiven] = useState<"good" | "bad" | null>(null);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFeedback = async (type: "good" | "bad") => {
    setFeedbackGiven(type);
    await saveFeedback(occasion, combo, type);
    if (type === "bad") setTimeout(() => onRegenerate(), 800);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "my-outfit.png", { type: "image/png" });

        // Native share sheet on mobile
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `My outfit: ${combo.name}`,
            text: `Check out this outfit! "${combo.reasoning}" — what do you think? 👗`,
            files: [file],
          });
        } else {
          // Fallback: download on desktop
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `outfit-${combo.name.replace(/\s+/g, "-")}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setSharing(false);
      }, "image/png");
    } catch (err) {
      console.error("Share failed:", err);
      setSharing(false);
    }
  };

  return (
    <div className={`rounded-2xl border bg-card p-4 ${highlight ? "border-primary/30 shadow-md" : "border-border"}`}>

      {/* Visible UI card — no "rate my fit" text here */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-semibold text-foreground">{combo.name}</h4>
          <span className="text-xs text-muted-foreground">AI Pick ✨</span>
        </div>
        {combo.reasoning && (
          <p className="mb-3 text-xs text-muted-foreground italic">"{combo.reasoning}"</p>
        )}
        <div className="mb-3 flex gap-2">
          <ItemSlot item={combo.top} label="Top" highlighted={!!anchorItemId && combo.top?.id === anchorItemId} />
          <ItemSlot item={combo.bottom} label="Bottom" highlighted={!!anchorItemId && combo.bottom?.id === anchorItemId} />
          <ItemSlot item={combo.outer} label="Outer" highlighted={!!anchorItemId && combo.outer?.id === anchorItemId} />
        </div>
      </div>

      {/* Hidden share card — only captured by html2canvas, not visible in UI */}
      <div
        ref={cardRef}
        style={{ position: "fixed", top: "-9999px", left: "-9999px", width: "400px", backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px" }}
      >
        {/* Rate my fit header */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "20px", fontWeight: "bold", color: "#111", margin: 0 }}>hey, rate my fit! 👀</p>
          <p style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
            {combo.name}{occasion ? ` · ${occasion}` : ""}
          </p>
        </div>

        {/* Outfit images */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {[
            { item: combo.top, label: "Top" },
            { item: combo.bottom, label: "Bottom" },
            { item: combo.outer, label: "Outer" },
          ].map(({ item, label }) => (
            <div key={label} style={{ flex: 1, aspectRatio: "1", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb", position: "relative", backgroundColor: item?.dominantColor ?? "#f3f4f6" }}>
              {item?.imageUrl ? (
                <img src={item.imageUrl} alt={label} crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
              <span style={{ position: "absolute", bottom: "4px", left: "4px", backgroundColor: "rgba(255,255,255,0.85)", borderRadius: "6px", padding: "2px 6px", fontSize: "10px", fontWeight: 600 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "10px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#2D6A4F", fontWeight: 600, margin: 0 }}>
            Try StyleMe today — because good style shouldn't take time!
          </p>
        </div>
      </div>

      {/* Feedback buttons — outside share card */}
      <div className="mt-3 mb-3 flex gap-2">
        <button onClick={() => handleFeedback("good")} disabled={!!feedbackGiven}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${feedbackGiven === "good" ? "bg-green-500 text-white" : feedbackGiven === "bad" ? "bg-secondary text-muted-foreground opacity-50" : "bg-secondary text-secondary-foreground hover:bg-green-100 hover:text-green-700"}`}>
          👍 {feedbackGiven === "good" ? "Loved it!" : "Like"}
        </button>
        <button onClick={() => handleFeedback("bad")} disabled={!!feedbackGiven}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${feedbackGiven === "bad" ? "bg-red-500 text-white" : feedbackGiven === "good" ? "bg-secondary text-muted-foreground opacity-50" : "bg-secondary text-secondary-foreground hover:bg-red-100 hover:text-red-700"}`}>
          👎 {feedbackGiven === "bad" ? "Regenerating..." : "Dislike"}
        </button>
      </div>

      {/* Share button */}
      <button onClick={handleShare} disabled={sharing}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 py-2.5 text-sm font-medium text-primary mb-3 transition-transform active:scale-[0.97] disabled:opacity-50">
        {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        {sharing ? "Preparing..." : "Share this outfit"}
      </button>

      {/* Nearby stores */}
      {(nearbyStores ?? []).length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">🏪 Nearby stores for this vibe</p>
          <div className="flex flex-wrap gap-1.5">
            {(nearbyStores ?? []).map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                <MapPin className="h-3 w-3" />{s.name} • {s.distance} • ★{s.rating}
              </span>
            ))}
          </div>
        </div>
      )}

      {storesLoading && <p className="text-[11px] text-muted-foreground mb-3">Finding stores near you...</p>}
      {storesError && <p className="text-[11px] text-red-400 mb-3">{storesError}</p>}

      {/* Regenerate button */}
      <button onClick={onRegenerate} disabled={loading || cooldown}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground transition-transform active:scale-[0.97] disabled:opacity-50">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {loading ? "Generating..." : cooldown ? "Wait 15s..." : "Regenerate"}
      </button>
    </div>
  );
}

const OutfitsTab = ({ items = [], pairingItem, onClearPairing }: OutfitsTabProps) => {
  const [occasion, setOccasion] = useState("");
  const [outfit, setOutfit] = useState<OutfitCombo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [activePairingItem, setActivePairingItem] = useState<WardrobeItem | null>(pairingItem ?? null);
  const [cooldown, setCooldown] = useState(false);

  if (pairingItem && pairingItem.id !== activePairingItem?.id) {
    setActivePairingItem(pairingItem);
    setOutfit(null);
    setError(null);
  }

  const runGenerate = async (fn: () => Promise<OutfitCombo>, storeQuery: string) => {
    setLoading(true); setStoresLoading(true); setError(null); setStoresError(null);
    const [outfitResult, storesResult] = await Promise.allSettled([fn(), findStoresForOccasion(storeQuery)]);
    if (outfitResult.status === "fulfilled") setOutfit(outfitResult.value);
    else { console.error(outfitResult.reason); setError("Failed to generate. Please try again."); }
    if (storesResult.status === "fulfilled") setNearbyStores(storesResult.value);
    else setStoresError(storesResult.reason?.message ?? "Could not find nearby stores");
    setLoading(false); setStoresLoading(false);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 15000);
  };

  const generateOutfit = () => {
    if (!occasion.trim()) { setError("Please enter an occasion first."); return; }
    if (items.length === 0) { setError("Please upload some clothes first."); return; }
    runGenerate(() => getGroqOutfit(occasion, items), occasion);
  };

  const generatePairing = () => {
    if (!activePairingItem) return;
    if (items.length < 2) { setError("Add more items to your wardrobe for pairing suggestions."); return; }
    runGenerate(() => getGroqPairing(activePairingItem, items), `${activePairingItem.category} outfit`);
  };

  const exitPairing = () => {
    setActivePairingItem(null);
    setOutfit(null);
    setError(null);
    onClearPairing?.();
  };

  const isPairing = !!activePairingItem;

  return (
    <div className="animate-fade-in">

      {isPairing ? (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <img src={activePairingItem.imageUrl} alt={activePairingItem.category} className="h-12 w-12 rounded-xl object-cover border-2 border-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">Pairing: {activePairingItem.category}</p>
                <p className="text-xs text-muted-foreground">AI builds an outfit around this item ⭐</p>
              </div>
            </div>
            <button onClick={exitPairing} className="rounded-full bg-secondary p-1.5">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <button onClick={generatePairing} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {loading ? "Finding pairs..." : "Find What Goes With This"}
          </button>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">What's the occasion?</h3>
          <div className="flex gap-2">
            <input type="text" value={occasion} onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g. job interview, beach day, date night..."
              className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === "Enter" && generateOutfit()} />
            <button onClick={generateOutfit} disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">{isPairing ? "Finding perfect pairs..." : "Styling your outfit..."}</p>
        </div>
      )}

      {outfit && !loading && (
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-foreground">{isPairing ? "Pairs Well With 👗" : "Your Outfit 🌤️"}</h3>
          <OutfitCard
            combo={outfit}
            occasion={isPairing ? `${activePairingItem?.category} pairing` : occasion}
            anchorItemId={isPairing ? activePairingItem?.id : null}
            onRegenerate={isPairing ? generatePairing : generateOutfit}
            loading={loading} highlight cooldown={cooldown}
            nearbyStores={nearbyStores}
            storesLoading={storesLoading}
            storesError={storesError}
          />
        </div>
      )}

      {!outfit && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-12 w-12 text-primary/40 mb-4" />
          <p className="text-sm text-muted-foreground">
            {isPairing ? `Tap the button above to find pairs for your ${activePairingItem?.category}!` : "Enter an occasion above and let AI style you!"}
          </p>
          {!isPairing && <p className="mt-2 text-xs text-muted-foreground">Or tap any item in Wardrobe to get pairing suggestions ✨</p>}
        </div>
      )}
    </div>
  );
};

export default OutfitsTab;