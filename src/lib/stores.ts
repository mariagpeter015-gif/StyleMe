const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

export interface NearbyStore {
  name: string;
  address: string;
  rating: number;
  distance: string;
  vibeTag: string;
}

// Use Groq to turn occasion into a vibe keyword
async function getKeywordForOccasion(occasion: string): Promise<string> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a fashion assistant. Reply with ONLY a single short phrase, nothing else.",
          },
          {
            role: "user",
            content: `What vibe of clothing store suits a "${occasion}" occasion? 
Reply with ONE short label like: formal wear, streetwear, casual, sportswear, ethnic wear, party wear.`,
          },
        ],
        max_tokens: 10,
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch {
    // Fallback if Groq fails
    return "clothing";
  }
}

// Get user's GPS coordinates from the browser (free, no API key)
function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => reject(new Error("Location permission denied — please allow location access and try again"))
    );
  });
}

// Calculate human-readable distance between two coordinates
function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

// Query OpenStreetMap for nearby clothing stores (completely free, no key)
async function fetchNearbyStores(
  lat: number,
  lng: number
): Promise<{ name: string; address: string; lat: number; lon: number }[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["shop"="clothes"](around:5000,${lat},${lng});
      node["shop"="boutique"](around:5000,${lat},${lng});
      node["shop"="fashion"](around:5000,${lat},${lng});
    );
    out 15;
  `;

  const response = await fetch(
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
  );

  if (!response.ok) throw new Error("Could not reach OpenStreetMap");

  const data = await response.json();

  return (data.elements ?? [])
    .filter((el: any) => el.tags?.name) // only named stores
    .map((el: any) => ({
      name: el.tags.name,
      address:
        [el.tags["addr:street"], el.tags["addr:housenumber"]]
          .filter(Boolean)
          .join(" ") || "Nearby",
      lat: el.lat,
      lon: el.lon,
    }));
}

// Main export — call this from OutfitsTab
export async function findStoresForOccasion(
  occasion: string
): Promise<NearbyStore[]> {
  // Run location fetch and keyword generation in parallel
  const [location, vibeTag] = await Promise.all([
    getUserLocation(),
    getKeywordForOccasion(occasion),
  ]);

  const { lat, lng } = location;

  const rawStores = await fetchNearbyStores(lat, lng);

  if (rawStores.length === 0) {
    throw new Error("No clothing stores found within 5km");
  }

  // Map to NearbyStore, sort by distance, return top 6
  return rawStores
    .map((store) => ({
      name: store.name,
      address: store.address,
      rating: 4.0, // OSM doesn't have ratings
      distance: calcDistance(lat, lng, store.lat, store.lon),
      vibeTag,
    }))
    .sort((a, b) => {
      // Sort by numeric distance value
      const parseD = (d: string) =>
        d.endsWith("km") ? parseFloat(d) * 1000 : parseInt(d);
      return parseD(a.distance) - parseD(b.distance);
    })
    .slice(0, 6);
}