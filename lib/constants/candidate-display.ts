/**
 * 画面表示用のドメイン用語。
 * Prisma / コード上の Candidate モデル名は変更しない。
 */
export const CANDIDATE_DISPLAY = {
  name: "求職者",
  listTitle: "求職者一覧",
  newTitle: "求職者 新規登録",
  registerFormTitle: "求職者登録",
  registerButton: "求職者を登録",
  assigned: "担当求職者",
  recentUpdated: "最近更新された求職者",
  emptyList: "求職者が登録されていません",
  emptyDashboard: "求職者がまだいません",
  countLabel: (count: number) => `${count} 件の求職者`,
  profileDescription: "求職者の詳細情報",
  notFound: "求職者が見つかりません",
  registerFailed:
    "求職者の登録に失敗しました。電話番号が重複している可能性があります。",
  updateFailed: "求職者の更新に失敗しました",
  selectRequired: "求職者を選択してください",
  logModalHint:
    "求職者を選んで手動記録します。求職者詳細と同じ内容が保存されます。",
  communicationsScope: "担当求職者の連絡を横断表示（最大200件）",
  snapshotStatusHint: "選択月の基準日時点の担当求職者ステータス",
  /** CallLead → Candidate */
  convertAction: "求職者登録",
  convertPending: "登録中…",
  convertDone: "求職者登録済",
  convertDoneLong: "求職者登録済み",
  convertFunnelCount: "求職者登録数",
  convertConfirm:
    "この架電リードを求職者として登録します。架電メモは求職者メモへ引き継がれます。よろしいですか？",
  convertAlready: "既に求職者登録済みです",
  convertStatusBlocked: "このステータスの架電リードは求職者登録できません",
  convertNoPhone: "電話番号が未設定のため求職者登録できません",
  convertDuplicatePhone: "同じ電話番号の求職者が既に存在します",
  convertExcluded: "重複・対象外の架電リードは求職者登録できません",
  convertNeedPhone: "電話番号を設定してから求職者登録してください",
  convertFailed: "求職者登録に失敗しました",
  convertLeadLocked: "求職者登録済みの架電リードは編集できません",
  convertLeadLockedEdit: "求職者登録済みのため編集できません。",
  convertActivity: "求職者登録",
} as const;
