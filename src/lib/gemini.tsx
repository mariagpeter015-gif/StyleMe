const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

// Classify a clothing item from an image URL
export async function classifyClothing(imageBase64: string) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: imageBase64
            }
          },
          {
            text: `Analyse this clothing item and respond ONLY with a JSON object in this exact format, nothing else:
{
  "type": "one of: Shirt, T-Shirt, Jacket, Pants, Jeans, Skirt, Dress, Sweater, Hoodie, Shorts, Saree, Shoes, Other",
  "color": "main color as a simple word e.g. red, blue, black",
  "style_tags": ["tag1", "tag2", "tag3"]
}`
          }
        ]
      }]
    })
  })

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, "").trim()
  return JSON.parse(clean)
}

// Generate outfit recommendation based on occasion and wardrobe
export async function getOutfitRecommendation(occasion: string, wardrobe: any[]) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a fashion stylist. The user wants to dress for: "${occasion}".
          
Here is their wardrobe as JSON:
${JSON.stringify(wardrobe)}

Pick the best outfit combination from their wardrobe and respond ONLY with a JSON object in this exact format, nothing else:
{
  "top_id": "id of the top item or null",
  "bottom_id": "id of the bottom item or null",
  "outer_id": "id of jacket/outerwear or null",
  "reasoning": "one sentence explaining why this outfit works",
  "vibe": "2-3 word vibe description e.g. Smart Casual"
}`
        }]
      }]
    })
  })

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, "").trim()
  return JSON.parse(clean)
}