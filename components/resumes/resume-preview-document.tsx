import type { ResumeGender } from "@prisma/client";
import type { ResumeDetail } from "@/lib/resumes/queries";
import type { ResumeJsonFields } from "@/lib/resumes/types";
import { RESUME_GENDER_LABELS } from "@/lib/resumes/constants";
import { formatDate } from "@/lib/utils";

function formatYearMonth(year: number, month: number) {
  return `${year}年${month}月`;
}

function formatOptionalYearMonth(year?: number | null, month?: number | null) {
  if (year == null) return "—";
  if (month == null) return `${year}年`;
  return formatYearMonth(year, month);
}

export function ResumePreviewDocument({
  resume,
  jsonFields,
  photoDisplayUrl,
}: {
  resume: ResumeDetail;
  jsonFields: ResumeJsonFields;
  photoDisplayUrl: string | null;
}) {
  const today = formatDate(new Date());
  const genderLabel = resume.gender
    ? RESUME_GENDER_LABELS[resume.gender as ResumeGender]
    : "—";

  return (
    <div className="mx-auto max-w-[210mm] rounded-lg border bg-white p-8 text-[11px] leading-relaxed text-black shadow-sm print:border-0 print:shadow-none">
      <div className="mb-6 text-right text-sm">作成日：{today}</div>

      <div className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-sm text-gray-600">{resume.furigana || "—"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-wide">{resume.fullName}</h1>
          <p className="mt-2 text-sm">
            {resume.birthDate ? `${formatDate(resume.birthDate)} 生` : "生年月日未設定"}
            {" / "}
            {genderLabel}
          </p>
        </div>
        <div className="flex h-36 w-28 shrink-0 items-center justify-center border border-gray-400 bg-gray-50 text-xs text-gray-500">
          {photoDisplayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoDisplayUrl}
              alt="証明写真"
              className="h-full w-full object-cover"
            />
          ) : (
            "写真"
          )}
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-gray-800 pb-1 text-sm font-bold">
          連絡先
        </h2>
        <dl className="grid grid-cols-[5rem_1fr] gap-y-1">
          <dt className="text-gray-600">住所</dt>
          <dd>
            {resume.postalCode && <span className="mr-2">〒{resume.postalCode}</span>}
            {resume.address || "—"}
          </dd>
          <dt className="text-gray-600">電話</dt>
          <dd>{resume.phone || "—"}</dd>
          <dt className="text-gray-600">メール</dt>
          <dd>{resume.email || "—"}</dd>
        </dl>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-gray-800 pb-1 text-sm font-bold">
          学歴・職歴
        </h2>
        <table className="w-full border-collapse text-left">
          <tbody>
            {jsonFields.educationJson.map((row, index) => (
              <tr key={`edu-${index}`} className="border-b border-gray-200">
                <td className="w-28 py-1.5">{formatYearMonth(row.year, row.month)}</td>
                <td className="py-1.5">
                  {row.school} {row.event}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} className="py-1 text-center text-gray-500">
                以降、職歴
              </td>
            </tr>
            {jsonFields.workHistoryJson.map((row, index) => (
              <tr key={`work-${index}`} className="border-b border-gray-200">
                <td className="w-28 py-1.5">{formatYearMonth(row.year, row.month)}</td>
                <td className="py-1.5">
                  <div>
                    {row.company} {row.event}
                  </div>
                  {row.description && (
                    <div className="mt-0.5 text-gray-600">{row.description}</div>
                  )}
                </td>
              </tr>
            ))}
            {jsonFields.educationJson.length === 0 &&
              jsonFields.workHistoryJson.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-2 text-gray-500">
                    未入力
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-gray-800 pb-1 text-sm font-bold">
          資格・免許
        </h2>
        <table className="w-full border-collapse">
          <tbody>
            {jsonFields.licensesJson.map((row, index) => (
              <tr key={`license-${index}`} className="border-b border-gray-200">
                <td className="w-28 py-1.5">
                  {formatOptionalYearMonth(row.year, row.month)}
                </td>
                <td className="py-1.5">{row.name}</td>
              </tr>
            ))}
            {jsonFields.licensesJson.length === 0 && (
              <tr>
                <td colSpan={2} className="py-2 text-gray-500">
                  未入力
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 border-b border-gray-800 pb-1 text-sm font-bold">
          自己PR
        </h2>
        <p className="whitespace-pre-wrap">{resume.selfPr || "—"}</p>
      </section>

      <section>
        <h2 className="mb-2 border-b border-gray-800 pb-1 text-sm font-bold">
          志望動機
        </h2>
        <p className="whitespace-pre-wrap">{resume.motivation || "—"}</p>
      </section>
    </div>
  );
}
