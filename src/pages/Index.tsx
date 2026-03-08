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
  const [pairingItem, setPairingItem] = useState<WardrobeItem | null>(null);

  // Fetch clothes
  const fetchClothes = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("clothes_table")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching clothes:", error);
      setLoading(false);
      return;
    }

    const items: WardrobeItem[] =
      data?.map((item: any) => ({
        id: item.id,
        category: item.type,
        dominantColor: item.color,
        imageUrl: item.image_url,
      })) || [];

    setWardrobeItems(items);
    setLoading(false);
  };

  // Load wardrobe when page opens
  useEffect(() => {
    fetchClothes();
  }, []);

  // When item uploaded
  const handleItemSaved = () => {
    fetchClothes();
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    try {
      console.log("Deleting item:", id);

      const { data, error } = await supabase
        .from("clothes_table")
        .delete()
        .eq("id", id)
        .select();

      if (error) {
        console.error("Delete failed:", error);
        return;
      }

      console.log("Deleted:", data);

      // Instant UI update
      setWardrobeItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Unexpected delete error:", err);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <h1 className="text-2xl font-bold text-foreground">
          {tabTitles[activeTab]}
        </h1>
      </header>

      <main className="flex-1 px-5 pb-24">

        {activeTab === "wardrobe" && (
          <WardrobeTab
            items={wardrobeItems}
            loading={loading}
            onNavigateToUpload={() => setActiveTab("upload")}
            onDeleteItem={handleDeleteItem}
            onPairItem={(item) => {
              setPairingItem(item);
              setActiveTab("outfits");
            }}
          />
        )}

        {activeTab === "upload" && (
          <UploadTab onSave={handleItemSaved} />
        )}

        {activeTab === "outfits" && (
          <OutfitsTab
            items={wardrobeItems}
            pairingItem={pairingItem}
            onClearPairing={() => setPairingItem(null)}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab itemCount={wardrobeItems.length} />
        )}

      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

    </div>
  );
};

export default Index;