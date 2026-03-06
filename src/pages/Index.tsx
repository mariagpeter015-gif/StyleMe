import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import WardrobeTab from "@/components/tabs/WardrobeTab";
import UploadTab from "@/components/tabs/UploadTab";
import OutfitsTab from "@/components/tabs/OutfitsTab";
import ProfileTab from "@/components/tabs/ProfileTab";

type Tab = "wardrobe" | "upload" | "outfits" | "profile";

const tabTitles: Record<Tab, string> = {
  wardrobe: "My Wardrobe",
  upload: "Upload",
  outfits: "Outfits",
  profile: "Profile",
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("wardrobe");

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-5 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
        <h1 className="text-2xl font-bold text-foreground">{tabTitles[activeTab]}</h1>
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-24">
        {activeTab === "wardrobe" && <WardrobeTab />}
        {activeTab === "upload" && <UploadTab />}
        {activeTab === "outfits" && <OutfitsTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
