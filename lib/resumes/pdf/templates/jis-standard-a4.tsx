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
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 10,
    marginBottom: 14,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  furigana: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 4,
  },
  fullName: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
  },
  meta: {
    fontSize: 9,
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
            <Text style={styles.furigana}>{data.furigana || "—"}</Text>
            <Text style={styles.fullName}>{data.fullName}</Text>
            <Text style={styles.meta}>
              {data.birthDateLabel || "生年月日未設定"}
              {data.genderLabel ? ` / ${data.genderLabel}` : ""}
            </Text>
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
