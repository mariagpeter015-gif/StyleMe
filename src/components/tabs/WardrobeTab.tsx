import { Plus } from "lucide-react";

const categories = ["All", "Tops", "Bottoms", "Shoes", "Accessories"];

const placeholderItems = [
  { id: 1, category: "Tops", color: "hsl(153, 44%, 90%)" },
  { id: 2, category: "Bottoms", color: "hsl(200, 15%, 90%)" },
  { id: 3, category: "Shoes", color: "hsl(30, 30%, 90%)" },
  { id: 4, category: "Tops", color: "hsl(280, 20%, 90%)" },
  { id: 5, category: "Accessories", color: "hsl(0, 20%, 90%)" },
  { id: 6, category: "Bottoms", color: "hsl(210, 25%, 88%)" },
];

const WardrobeTab = () => {
  return (
    <div className="animate-fade-in">
      {/* Category filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              i === 0
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {placeholderItems.map((item) => (
          <div
            key={item.id}
            className="aspect-square rounded-2xl border border-border flex items-center justify-center"
            style={{ backgroundColor: item.color }}
          >
            <span className="text-xs font-medium text-muted-foreground">{item.category}</span>
          </div>
        ))}

        {/* Add item button */}
        <button className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="h-8 w-8" />
          <span className="text-xs font-medium">Add Item</span>
        </button>
      </div>
    </div>
  );
};

export default WardrobeTab;
