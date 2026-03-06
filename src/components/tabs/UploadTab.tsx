import { Camera, Image, Upload } from "lucide-react";

const UploadTab = () => {
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
        <button className="flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97]">
          <Camera className="h-5 w-5" />
          Take a Photo
        </button>
        <button className="flex items-center justify-center gap-3 rounded-2xl bg-secondary px-6 py-4 font-semibold text-secondary-foreground transition-transform active:scale-[0.97]">
          <Image className="h-5 w-5" />
          Choose from Gallery
        </button>
      </div>
    </div>
  );
};

export default UploadTab;
