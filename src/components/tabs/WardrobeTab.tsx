import { useState } from "react";
import { Plus, Shirt } from "lucide-react";

export interface WardrobeItem {
  id: string;
  category: string;
  dominantColor: string;
  imageUrl: string;
  notes?: string;
}

const categories = ["All", "Tops", "Bottoms", "Outerwear", "Dresses"];

const categoryMap: Record<string, string[]> = {
  Tops: ["Shirt", "T-Shirt", "Sweater", "Hoodie"],
  Bottoms: ["Pants", "Jeans", "Skirt", "Shorts"],
  Outerwear: ["Jacket"],
  Dresses: ["Dress", "Saree"],
};

interface WardrobeTabProps {
  items?: WardrobeItem[];
  onNavigateToUpload?: () => void;
  loading?: boolean;
}

const WardrobeTab = ({ items = [], onNavigateToUpload, loading = false }: WardrobeTabProps) => {
  const [activeFilter, setActiveFilter] = useState("All");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading your wardrobe...</p>
      </div>
    );
  }

  const filtered = activeFilter === "All"
    ? items
    : items.filter((item) => categoryMap[activeFilter]?.includes(item.category));

  if (items.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
          <Shirt className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Your wardrobe is empty</h2>
        <p className="mb-8 max-w-[240px] text-center text-sm text-muted-foreground">
          Upload your first item to start building your digital closet!
        </p>
        <button
          onClick={onNavigateToUpload}
          className="rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
        >
          Upload First Item
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card"
          >
            <img
              src={item.imageUrl}
              alt={item.category}
              className="aspect-square w-full object-cover"
            />
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div
                className="h-4 w-4 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: item.dominantColor }}
              />
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {item.category}
              </span>
            </div>
          </div>
        ))}

        <button
          onClick={onNavigateToUpload}
          className="flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-7 w-7" />
          <span className="text-xs font-medium">Add Item</span>
        </button>
      </div>

      {filtered.length === 0 && items.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No items in this category yet.
        </p>
      )}
    </div>
  );
};

export default WardrobeTab;