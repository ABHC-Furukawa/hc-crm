export const INTERVIEW_PREP_CHECKLIST_ITEMS = [
  { key: "checklistInterviewAt", label: "面接日時確認" },
  { key: "checklistUrl", label: "URL確認" },
  { key: "checklistResume", label: "履歴書確認" },
  { key: "checklistAttire", label: "服装説明" },
  { key: "checklistBelongings", label: "持ち物説明" },
  { key: "checklistSms", label: "SMS送付確認" },
] as const;

export type InterviewPrepChecklistKey =
  (typeof INTERVIEW_PREP_CHECKLIST_ITEMS)[number]["key"];

export const INTERVIEW_RESULT_OUTCOME_LABELS = {
  PASSED: "合格",
  ON_HOLD: "保留",
  FAILED: "不合格",
  DECLINED: "辞退",
} as const;

export type InterviewResultOutcomeKey = keyof typeof INTERVIEW_RESULT_OUTCOME_LABELS;

export const DEFAULT_INTERVIEW_PREP_QUESTIONS = [
  {
    sortOrder: 1,
    title: "志望理由",
    guidance:
      "事前にご提出いただいた履歴書（前職：製造職、転職理由：ワークライフバランスの改善など）の内容と矛盾がないよう、お伝えしましょう。",
  },
  {
    sortOrder: 2,
    title: "いつから働けるか？",
    guidance:
      "〇〇さんの「実際に働き始められるタイミング」をそのままお伝えして大丈夫です。",
  },
  {
    sortOrder: 3,
    title: "長期・短期どちらで働きたいか？",
    guidance:
      "👉 必ず「長期で働きたい」とお答えください。\n派遣会社側は「長く安定して働いてくれる方」を採用したいため、「短期」と答えてしまうと合格率が大幅に下がってしまいます。",
  },
  {
    sortOrder: 4,
    title: "前職の退職理由",
    guidance:
      "面接では、ネガティブな理由はマイナス印象になってしまいます。\n\nNG例： 「人間関係、上司のパワハラ、いじめ、重労働でキツすぎた、解雇された、給料が悪かった」などは絶対に言わないようにしましょう。\n\n対策： 前向きで話しやすい「言い換え表現」を一緒に準備しますので、ご安心ください！",
  },
  {
    sortOrder: 5,
    title: "健康状態について",
    guidance:
      "基本的には「健康状態に何も問題はありません」とお答えください。\n\n腰痛、ヘルニア、糖尿病などの持病がないか、現在通院や服薬をしていないかを確認されます。業務に支障がない範囲であれば、元気に問題ないと伝えることが大切です。",
  },
  {
    sortOrder: 6,
    title: "ハードワーク（体力仕事）は大丈夫か？",
    guidance:
      "製造・派遣のお仕事では、体力を求められる場面もあります。ここは「体力には自信があります！しっかり頑張ります！」と意欲を見せていきましょう。",
  },
  {
    sortOrder: 7,
    title: "転職回数が多い理由（※該当する場合）",
    guidance:
      "もし転職回数が多い場合は、「これまでは〇〇な理由（※一貫した軸や、やむを得ない事情など）がありましたが、今後は御社で長く腰を据えて働きたいと考えています」という、今後の定着意欲をアピールします。ここも一緒に回答を組み立てましょう。",
  },
] as const;

/** ④ 環境・身だしなみの準備 */
export const DEFAULT_INTERVIEW_PREP_TEMPLATE_BODY = `📌 1. 環境・身だしなみの準備
オンライン面接は、第一印象と事前の環境準備がとても重要です。

📅 事前チェック
日時の再確認： 確定している日時で問題なく参加できるか、今一度ご確認ください（万が一都合が悪くなった場合はすぐにご連絡ください）。

URLの確認： 面接用のURLは、基本的にSMS（ショートメッセージ）に届きます。届いているか必ず事前にご確認ください。

当日の入室： 面接開始の5〜10分前にはURLをクリックし、待機室でお待ちください。時間になると面接官が入室を許可します。

🏠 面接を受ける環境
場所： 必ずご自宅の静かな部屋で受けてください。

雑音対策： テレビの音、同居されている方の話し声、掃除機の音などの雑音が入らないよう、静かな環境を確保してください。

カメラの固定： スマホやPCは手で持たず、必ず机などに固定して受けてください。

背景： カメラに映る背景に、散らかった部屋や私物が映り込まないよう、できるだけ壁を背にするなど整理をお願いします。

👔 身だしなみ（第一印象が肝心です！）
服装： スーツが理想です。お持ちでない場合は、黒や白の無地のシャツなど、清潔感のある服を着用してください。

髪型・髪色： 寝癖はしっかり直し、髪色は必ず「黒」でお願いします。現在カラーをされている方は、薬局等で売っている「黒染めスプレー（黒彩など）」で面接の時だけ黒くしてください。

髭（ひげ）： 必ず前日の夜、または当日の朝にきれいに剃ってください。

アクセサリー： ピアスやネックレスなどは必ずすべて外してください（ピアスの外し忘れが多いのでご注意ください）。
`;

/** ⑥ 面接当日の心得・お約束 */
export const DEFAULT_INTERVIEW_PREP_DAY_OF_BODY = `📌 3. 面接当日の心得・お約束
目線と態度： 面接中は画面をキョロキョロ見渡さず、しっかりカメラ（面接官）に視線を向けてください。

お返事： 聞かれた質問に対しては、「ハキハキと元気よく」答えるだけで印象がガラリと良くなります！

面接終了後： 面接が終わりましたら、手応えや感想をすぐにLINEで教えてください！
`;

const DAY_OF_MARKER = "📌 3. 面接当日の心得・お約束";

/** 旧テンプレ（④+⑥一体）を分割する */
export function splitInterviewPrepTemplate(body: string): {
  prepBody: string;
  dayOfBody: string;
} {
  const idx = body.indexOf(DAY_OF_MARKER);
  if (idx === -1) {
    return {
      prepBody: body.trim() || DEFAULT_INTERVIEW_PREP_TEMPLATE_BODY,
      dayOfBody: DEFAULT_INTERVIEW_PREP_DAY_OF_BODY,
    };
  }
  return {
    prepBody: body.slice(0, idx).trim() || DEFAULT_INTERVIEW_PREP_TEMPLATE_BODY,
    dayOfBody: body.slice(idx).trim() || DEFAULT_INTERVIEW_PREP_DAY_OF_BODY,
  };
}
