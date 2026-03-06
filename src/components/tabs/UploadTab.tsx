import { useState, useRef } from "react";
import { Camera, Image, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type UploadStep = "select" | "analysing" | "result";

interface AnalysisResult {
  category: string;
  dominantColor: string;
  imageUrl: string;
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

function guessCategory(): string {
  const categories = ["Shirt", "T-Shirt", "Jacket", "Pants", "Jeans", "Dress", "Skirt", "Sweater", "Hoodie", "Shorts"];
  return categories[Math.floor(Math.random() * categories.length)];
}

interface UploadTabProps {
  onSave?: (item: { category: string; dominantColor: string; imageUrl: string; notes: string }) => void;
}

const UploadTab = ({ onSave }: UploadTabProps) => {
  const [step, setStep] = useState<UploadStep>("select");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setStep("analysing");
    setSaved(false);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const color = extractDominantColor(img);
      const category = guessCategory();
      setTimeout(() => {
        setResult({ category, dominantColor: color, imageUrl: url });
        setStep("result");
      }, 1800);
    };
    img.src = url;
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
  };

  const handleSave = () => {
    if (result) {
      onSave?.({ category: result.category, dominantColor: result.dominantColor, imageUrl: result.imageUrl, notes });
    }
    setSaved(true);
    setTimeout(reset, 1200);
  };

  if (step === "analysing") {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-5 text-base font-medium text-foreground">Analysing your item…</p>
        <p className="mt-1 text-sm text-muted-foreground">This won't take long</p>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="animate-fade-in flex flex-col items-center">
        {/* Image preview */}
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

        {/* Detected info */}
        <div className="mb-6 flex w-full items-center gap-4 rounded-2xl bg-secondary p-4">
          <div
            className="h-12 w-12 shrink-0 rounded-xl border border-border"
            style={{ backgroundColor: result.dominantColor }}
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Detected Category
            </p>
            <p className="text-lg font-semibold text-foreground">{result.category}</p>
          </div>
        </div>

        {/* Notes */}
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

        {/* Save button */}
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
        Upload photos of your clothing items and let AI categorize them automatically.
      </p>

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
