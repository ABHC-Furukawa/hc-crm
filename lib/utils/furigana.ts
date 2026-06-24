import type Kuroshiro from "kuroshiro";

let converter: Kuroshiro | null = null;

export async function convertNameToKatakana(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (!converter) {
    const KuroshiroClass = (await import("kuroshiro")).default;
    const KuromojiAnalyzer = (await import("kuroshiro-analyzer-kuromoji")).default;
    converter = new KuroshiroClass();
    await converter.init(new KuromojiAnalyzer());
  }

  return converter.convert(trimmed, { to: "katakana", mode: "normal" });
}

export async function buildFuriganaFromNames(
  lastName: string,
  firstName: string
): Promise<string> {
  const parts = await Promise.all([
    convertNameToKatakana(lastName),
    convertNameToKatakana(firstName),
  ]);
  return parts.filter(Boolean).join(" ").trim();
}
