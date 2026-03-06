import { ChevronRight, Settings, Heart, Bell, HelpCircle } from "lucide-react";

const menuItems = [
  { icon: Heart, label: "Favorites" },
  { icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Settings" },
  { icon: HelpCircle, label: "Help & Support" },
];

const ProfileTab = () => {
  return (
    <div className="animate-fade-in">
      {/* Avatar & Info */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
          S
        </div>
        <h2 className="text-lg font-semibold text-foreground">Style User</h2>
        <p className="text-sm text-muted-foreground">12 items · 3 outfits</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { value: "12", label: "Items" },
          { value: "3", label: "Outfits" },
          { value: "5", label: "Favorites" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-secondary p-4 text-center">
            <div className="text-xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {menuItems.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted ${
              i < menuItems.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;
