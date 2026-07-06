import { renderToBuffer } from "@react-pdf/renderer";
import type { ResumeDetail } from "@/lib/resumes/queries";
import { buildResumePdfData } from "@/lib/resumes/pdf/build-pdf-data";
import { registerResumePdfFonts } from "@/lib/resumes/pdf/register-fonts";
import { JisStandardA4Document } from "@/lib/resumes/pdf/templates/jis-standard-a4";

export async function generateResumePdfBuffer(
  resume: ResumeDetail
): Promise<Buffer> {
  registerResumePdfFonts();
  const data = await buildResumePdfData(resume);
  return renderToBuffer(<JisStandardA4Document data={data} />);
}
