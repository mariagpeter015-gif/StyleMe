import { useEffect, useState } from "react";
import { ChevronRight, Settings, Heart, Bell, HelpCircle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: Heart, label: "Favorites" },
  { icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Settings" },
  { icon: HelpCircle, label: "Help & Support" },
];

interface ProfileTabProps {
  itemCount?: number;
}

const ProfileTab = ({ itemCount = 0 }: ProfileTabProps) => {
  const [email, setEmail] = useState("");
  const [outfitCount, setOutfitCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? "");

      const { count } = await (supabase as any)
        .from("outfits")
        .select("*", { count: "exact", head: true });
      setOutfitCount(count ?? 0);
    };
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const initials = email ? email[0].toUpperCase() : "S";

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
          {initials}
        </div>
        <h2 className="text-lg font-semibold text-foreground">{email || "Style User"}</h2>
        <p className="text-sm text-muted-foreground">{itemCount} items · {outfitCount} outfits</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { value: String(itemCount), label: "Items" },
          { value: String(outfitCount), label: "Outfits" },
          { value: "0", label: "Favorites" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-secondary p-4 text-center">
            <div className="text-xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
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

      <button
        onClick={handleSignOut}
        className="flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl border border-border bg-card text-left transition-colors hover:bg-muted"
      >
        <LogOut className="h-5 w-5 text-destructive" />
        <span className="flex-1 text-sm font-medium text-destructive">Sign Out</span>
      </button>
    </div>
  );
};

export default ProfileTab;
