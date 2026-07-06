/**
 * Resume feature — PDF generation smoke test
 *
 *   npm run verify:resume-pdf
 */
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());

import { generateResumePdfBuffer } from "../lib/resumes/pdf/generate-resume-pdf.tsx";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildResumeFixture(label, overrides = {}) {
  const now = new Date();
  return {
    id: "00000000-0000-4000-a000-000000000099",
    tenantId: "a0000000-0000-4000-a000-000000000001",
    candidateId: null,
    createdById: null,
    updatedById: null,
    documentType: "RIREKISHO",
    templateType: "JIS_STANDARD_A4",
    status: "DRAFT",
    fullName: `検証用 ${label}`,
    furigana: "けんしょうよう",
    birthDate: new Date("1990-04-01"),
    gender: "UNSPECIFIED",
    postalCode: "100-0001",
    address: "東京都千代田区テスト1-2-3",
    phone: "+819012345678",
    email: "verify@example.com",
    educationJson: [],
    workHistoryJson: [],
    licensesJson: [],
    selfPr: null,
    motivation: null,
    photoUrl: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    candidate: null,
    createdBy: null,
    updatedBy: null,
    exportLogs: [],
    ...overrides,
  };
}

async function expectPdf(label, resume) {
  const buffer = await generateResumePdfBuffer(resume);
  assert(Buffer.isBuffer(buffer), `${label}: buffer expected`);
  assert(buffer.length > 1200, `${label}: PDF too small (${buffer.length} bytes)`);
  assert(
    buffer.subarray(0, 4).toString() === "%PDF",
    `${label}: invalid PDF header`
  );
  console.log(`${label}: OK (${buffer.length} bytes)`);
}

async function main() {
  await expectPdf("empty", buildResumeFixture("空データ"));

  await expectPdf(
    "minimal",
    buildResumeFixture("最小", {
      educationJson: [{ year: 2010, month: 4, school: "テスト大学", event: "入学" }],
      licensesJson: [{ year: 2015, month: 3, name: "普通自動車免許" }],
    })
  );

  const longText = "日本語の長文テスト。".repeat(400);
  await expectPdf(
    "long-text",
    buildResumeFixture("長文", {
      selfPr: longText,
      motivation: longText,
      educationJson: Array.from({ length: 12 }, (_, index) => ({
        year: 2000 + index,
        month: 4,
        school: `テスト学校 ${index + 1}`,
        event: index % 2 === 0 ? "入学" : "卒業",
      })),
      workHistoryJson: Array.from({ length: 8 }, (_, index) => ({
        year: 2010 + index,
        month: 4,
        company: `テスト株式会社 ${index + 1}`,
        event: index % 2 === 0 ? "入社" : "退社",
        description: "担当業務の詳細テキスト".repeat(3),
      })),
    })
  );

  console.log("PASS: resume PDF smoke tests");
}

main().catch((error) => {
  console.error("FAIL:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
