import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  formatPdfOptionalYearMonth,
  formatPdfYearMonth,
  type ResumePdfData,
} from "@/lib/resumes/pdf/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    lineHeight: 1.45,
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 34,
    color: "#111111",
  },
  createdDate: {
    fontSize: 9,
    textAlign: "right",
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 12,
    marginBottom: 14,
    minHeight: 100,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
    paddingTop: 2,
  },
  furiganaBlock: {
    marginBottom: 8,
  },
  furigana: {
    fontSize: 8,
    color: "#555555",
    lineHeight: 1.5,
  },
  nameBlock: {
    marginBottom: 10,
    paddingBottom: 2,
  },
  fullName: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  metaBlock: {
    marginTop: 2,
  },
  metaRow: {
    marginBottom: 5,
  },
  metaRowLast: {
    marginBottom: 0,
  },
  meta: {
    fontSize: 9,
    lineHeight: 1.55,
  },
  photoBox: {
    width: 72,
    height: 96,
    borderWidth: 1,
    borderColor: "#666666",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  photo: {
    width: 72,
    height: 96,
    objectFit: "cover",
  },
  photoPlaceholder: {
    fontSize: 8,
    color: "#888888",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 3,
    marginBottom: 6,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  contactLabel: {
    width: 48,
    color: "#555555",
  },
  contactValue: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical: 4,
  },
  tableDate: {
    width: 72,
  },
  tableContent: {
    flex: 1,
  },
  tableNote: {
    fontSize: 8,
    color: "#555555",
    marginTop: 2,
  },
  dividerRow: {
    textAlign: "center",
    color: "#777777",
    fontSize: 8,
    paddingVertical: 4,
  },
  bodyText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  continuationPage: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    lineHeight: 1.5,
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 34,
    color: "#111111",
  },
  pageHeader: {
    fontSize: 8,
    color: "#777777",
    textAlign: "right",
    marginBottom: 12,
  },
  emptyText: {
    color: "#888888",
    paddingVertical: 4,
  },
});

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function HistoryTable({
  educationJson,
  workHistoryJson,
}: Pick<ResumePdfData, "educationJson" | "workHistoryJson">) {
  const hasEducation = educationJson.length > 0;
  const hasWork = workHistoryJson.length > 0;

  if (!hasEducation && !hasWork) {
    return <Text style={styles.emptyText}>未入力</Text>;
  }

  return (
    <View>
      {educationJson.map((row, index) => (
        <View key={`edu-${index}`} style={styles.tableRow}>
          <Text style={styles.tableDate}>
            {formatPdfYearMonth(row.year, row.month)}
          </Text>
          <Text style={styles.tableContent}>
            {row.school} {row.event}
          </Text>
        </View>
      ))}
      {hasEducation && hasWork && (
        <Text style={styles.dividerRow}>以降、職歴</Text>
      )}
      {workHistoryJson.map((row, index) => (
        <View key={`work-${index}`} style={styles.tableRow}>
          <Text style={styles.tableDate}>
            {formatPdfYearMonth(row.year, row.month)}
          </Text>
          <View style={styles.tableContent}>
            <Text>
              {row.company} {row.event}
            </Text>
            {row.description ? (
              <Text style={styles.tableNote}>{row.description}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function JisStandardA4Document({ data }: { data: ResumePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.createdDate}>作成日：{data.createdDateLabel}</Text>

        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.furiganaBlock}>
              <Text style={styles.furigana}>{data.furigana || "—"}</Text>
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.fullName}>{data.fullName}</Text>
            </View>
            <View style={styles.metaBlock}>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  生年月日：{data.birthDateLabel || "未設定"}
                </Text>
              </View>
              <View style={styles.metaRowLast}>
                <Text style={styles.meta}>
                  性別：{data.genderLabel || "未記入"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.photoBox}>
            {data.photoDataUri ? (
              <Image src={data.photoDataUri} style={styles.photo} />
            ) : (
              <Text style={styles.photoPlaceholder}>写真</Text>
            )}
          </View>
        </View>

        <SectionTitle>連絡先</SectionTitle>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>住所</Text>
          <Text style={styles.contactValue}>
            {data.postalCode ? `〒${data.postalCode} ` : ""}
            {data.address || "—"}
          </Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>電話</Text>
          <Text style={styles.contactValue}>{data.phone || "—"}</Text>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>メール</Text>
          <Text style={styles.contactValue}>{data.email || "—"}</Text>
        </View>

        <SectionTitle>学歴・職歴</SectionTitle>
        <HistoryTable
          educationJson={data.educationJson}
          workHistoryJson={data.workHistoryJson}
        />

        <SectionTitle>資格・免許</SectionTitle>
        {data.licensesJson.length === 0 ? (
          <Text style={styles.emptyText}>未入力</Text>
        ) : (
          data.licensesJson.map((row, index) => (
            <View key={`license-${index}`} style={styles.tableRow}>
              <Text style={styles.tableDate}>
                {formatPdfOptionalYearMonth(row.year, row.month)}
              </Text>
              <Text style={styles.tableContent}>{row.name}</Text>
            </View>
          ))
        )}

      </Page>

      <Page size="A4" style={styles.continuationPage}>
        <Text style={styles.pageHeader}>
          {data.fullName} — 自己PR・志望動機（2ページ目）
        </Text>

        <SectionTitle>自己PR</SectionTitle>
        <Text style={styles.bodyText} wrap>
          {data.selfPr || "—"}
        </Text>

        <SectionTitle>志望動機</SectionTitle>
        <Text style={styles.bodyText} wrap>
          {data.motivation || "—"}
        </Text>
      </Page>
    </Document>
  );
}
