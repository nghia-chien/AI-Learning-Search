/**
 * Free translation service using Google Translate's gtx endpoint.
 * Requires no API key, works with fast response times.
 */

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto'
): Promise<string> {
  if (!text || !text.trim()) return '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);

    if (response.ok) {
      const data: any = await response.json();
      // The response structure is: [[["translated_text", "original_text", null, null, 1]], null, "language"]
      if (data && Array.isArray(data[0])) {
        const translatedParts = data[0]
          .filter((item: any) => item && item[0])
          .map((item: any) => item[0]);
        return translatedParts.join('').trim();
      }
    } else {
      console.warn(`[Translator] Google Translate API returned status: ${response.status}`);
    }
  } catch (err) {
    console.error(`[Translator] Failed to translate:`, err);
  }

  return text; // Return original text as fallback
}
