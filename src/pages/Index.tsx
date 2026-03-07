import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import WardrobeTab from "@/components/tabs/WardrobeTab";
import UploadTab from "@/components/tabs/UploadTab";
import OutfitsTab from "@/components/tabs/OutfitsTab";
import ProfileTab from "@/components/tabs/ProfileTab";
import type { WardrobeItem } from "@/components/tabs/WardrobeTab";
import { supabase } from "@/integrations/supabase/client";

type Tab = "wardrobe" | "upload" | "outfits" | "profile";

const tabTitles: Record<Tab, string> = {
  wardrobe: "My Wardrobe",
  upload: "Upload",
  outfits: "Outfits",
  profile: "Profile",
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("wardrobe");
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClothes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("clothes_table")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clothes:", error);
        setLoading(false);
        return;
      }

      const items: WardrobeItem[] = data.map((item: any) => ({
        id: item.id,
        category: item.type,
        dominantColor: item.color,
        imageUrl: item.image_url,
      }));

      setWardrobeItems(items);
      setLoading(false);
    };

    fetchClothes();
  }, []);

  const handleItemSaved = (item: { category: string; dominantColor: string; imageUrl: string; notes: string }) => {
    setWardrobeItems((prev) => [
      { id: crypto.randomUUID(), ...item },
      ...prev,
    ]);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <h1 className="text-2xl font-bold text-foreground">{tabTitles[activeTab]}</h1>
      </header>

      <main className="flex-1 px-5 pb-24">
        {activeTab === "wardrobe" && (
          <WardrobeTab
            items={wardrobeItems}
            loading={loading}
            onNavigateToUpload={() => setActiveTab("upload")}
          />
        )}
        {activeTab === "upload" && <UploadTab onSave={handleItemSaved} />}
        {activeTab === "outfits" && <OutfitsTab items={wardrobeItems} />}
        {activeTab === "profile" && <ProfileTab itemCount={wardrobeItems.length} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;