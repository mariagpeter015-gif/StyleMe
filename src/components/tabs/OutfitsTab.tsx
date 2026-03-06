import { Sparkles, RefreshCw } from "lucide-react";

const outfits = [
  { id: 1, name: "Casual Friday", items: 3, color1: "hsl(153, 44%, 90%)", color2: "hsl(210, 25%, 88%)", color3: "hsl(30, 30%, 90%)" },
  { id: 2, name: "Weekend Brunch", items: 4, color1: "hsl(280, 20%, 90%)", color2: "hsl(0, 20%, 90%)", color3: "hsl(200, 15%, 90%)" },
];

const OutfitsTab = () => {
  return (
    <div className="animate-fade-in">
      {/* Generate button */}
      <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97]">
        <Sparkles className="h-5 w-5" />
        Generate New Outfit
      </button>

      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Saved Outfits
      </h3>

      <div className="flex flex-col gap-3">
        {outfits.map((outfit) => (
          <div key={outfit.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-foreground">{outfit.name}</h4>
              <span className="text-xs text-muted-foreground">{outfit.items} items</span>
            </div>
            <div className="flex gap-2">
              {[outfit.color1, outfit.color2, outfit.color3].map((c, i) => (
                <div
                  key={i}
                  className="h-16 flex-1 rounded-xl border border-border"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-transform active:scale-[0.97]">
        <RefreshCw className="h-4 w-4" />
        Load More
      </button>
    </div>
  );
};

export default OutfitsTab;
