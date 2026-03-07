import { useState, useRef } from "react";
import { Camera, Image, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type UploadStep = "select" | "uploading" | "result";

interface AnalysisResult {
  category: string;
  dominantColor: string;
  imageUrl: string;
  publicUrl: string;
  style_tags: string[];
}

function extractDominantColor(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  r = Math.round(r / count);
  g = Math.round(g / count);
  b = Math.round(b / count);
  return `rgb(${r}, ${g}, ${b})`;
}

interface UploadTabProps {
  onSave?: (item: { category: string; dominantColor: string; imageUrl: string; notes: string }) => void;
}

const UploadTab = ({ onSave }: UploadTabProps) => {
  const [step, setStep] = useState<UploadStep>("select");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setStep("uploading");
    setSaved(false);
    setError(null);

    try {
      const color = await new Promise<string>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(extractDominantColor(img));
        img.src = localUrl;
      });

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? "anonymous";
      const fileName = `${userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("clothing_images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("clothing_images")
        .getPublicUrl(fileName);

      setResult({
        category: "",
        dominantColor: color,
        imageUrl: localUrl,
        publicUrl,
        style_tags: [],
      });
      setStep("result");

    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setStep("select");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStep("select");
    setResult(null);
    setNotes("");
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!result) return;
    if (!result.category) {
      setError("Please select a category first.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await (supabase as any).from("clothes_table").insert({
        user_id: user?.id,
        image_url: result.publicUrl,
        type: result.category,
        color: result.dominantColor,
        style_tags: result.style_tags,
      });

      console.log("Insert error:", insertError);

      onSave?.({
        category: result.category,
        dominantColor: result.dominantColor,
        imageUrl: result.publicUrl,
        notes,
      });

      setSaved(true);
      setTimeout(reset, 1200);

    } catch (err) {
      console.error(err);
      setError("Failed to save. Please try again.");
    }
  };

  if (step === "uploading") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-5 text-base font-medium text-foreground">Uploading your item…</p>
        <p className="mt-1 text-sm text-muted-foreground">This won't take long</p>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="animate-fade-in flex flex-col items-center">
        <div className="relative mb-6 w-full overflow-hidden rounded-2xl border border-border">
          <img
            src={result.imageUrl}
            alt="Uploaded item"
            className="aspect-square w-full object-cover"
          />
          <button
            onClick={reset}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 flex w-full items-center gap-4 rounded-2xl bg-secondary p-4">
          <div
            className="h-12 w-12 shrink-0 rounded-xl border border-border"
            style={{ backgroundColor: result.dominantColor }}
          />
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Select Category
            </p>
            <select
              value={result.category}
              onChange={(e) => setResult({ ...result, category: e.target.value })}
              className="text-base font-semibold text-foreground bg-transparent border-b border-border outline-none w-full"
            >
              <option value="">Select category...</option>
              <option value="Shirt">Shirt</option>
              <option value="T-Shirt">T-Shirt</option>
              <option value="Jacket">Jacket</option>
              <option value="Pants">Pants</option>
              <option value="Jeans">Jeans</option>
              <option value="Skirt">Skirt</option>
              <option value="Dress">Dress</option>
              <option value="Sweater">Sweater</option>
              <option value="Hoodie">Hoodie</option>
              <option value="Shorts">Shorts</option>
              <option value="Saree">Saree</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="mb-6 w-full">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Notes <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bought at Zara, great for summer"
            className="rounded-xl resize-none"
            rows={3}
          />
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-500">{error}</p>
        )}

        <Button
          onClick={handleSave}
          disabled={saved}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {saved ? "✓ Added!" : "Add to Wardrobe"}
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-16">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <Upload className="h-10 w-10 text-primary" />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-foreground">Add to your wardrobe</h2>
      <p className="mb-10 max-w-xs text-center text-sm text-muted-foreground">
        Upload photos of your clothing items to your digital wardrobe.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-500">{error}</p>
      )}

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
        >
          <Camera className="h-5 w-5" />
          Take a Photo
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 rounded-2xl bg-secondary px-6 py-4 font-semibold text-secondary-foreground transition-transform active:scale-[0.97]"
        >
          <Image className="h-5 w-5" />
          Choose from Gallery
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
};

export default UploadTab;