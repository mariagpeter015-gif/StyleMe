import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import WardrobeTab from "@/components/tabs/WardrobeTab";
import UploadTab from "@/components/tabs/UploadTab";
import OutfitsTab from "@/components/tabs/OutfitsTab";
import ProfileTab from "@/components/tabs/ProfileTab";
import type { WardrobeItem } from "@/components/tabs/WardrobeTab";

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
          <WardrobeTab items={wardrobeItems} onNavigateToUpload={() => setActiveTab("upload")} />
        )}
        {activeTab === "upload" && <UploadTab onSave={handleItemSaved} />}
        {activeTab === "outfits" && <OutfitsTab items={wardrobeItems} />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
