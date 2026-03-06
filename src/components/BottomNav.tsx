import { Shirt, Upload, Sparkles, User } from "lucide-react";

type Tab = "wardrobe" | "upload" | "outfits" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "wardrobe", label: "Wardrobe", icon: Shirt },
  { id: "upload", label: "Upload", icon: Upload },
  { id: "outfits", label: "Outfits", icon: Sparkles },
  { id: "profile", label: "Profile", icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-nav-border bg-nav backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)] px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 pt-3 transition-colors ${
                isActive ? "text-primary" : "text-nav-inactive"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.6} />
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
