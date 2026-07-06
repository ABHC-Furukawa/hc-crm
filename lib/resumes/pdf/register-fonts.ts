import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerResumePdfFonts(): void {
  if (registered) return;

  const regular = path.join(
    process.cwd(),
    "public/fonts/NotoSansJP-Regular.otf"
  );
  const bold = path.join(process.cwd(), "public/fonts/NotoSansJP-Bold.otf");

  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });

  registered = true;
}
