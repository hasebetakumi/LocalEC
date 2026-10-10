/** マイページのリンク（文面は先方から受け取って差し替える） */
export const LEGAL_DOCS = [
  { key: 'terms', title: '利用規約' },
  { key: 'privacy', title: 'プライバシーポリシー' },
  { key: 'tokushoho', title: '特定商取引法に基づく表記' },
  { key: 'contact', title: 'お問い合わせ' },
] as const;

export type LegalDocKey = (typeof LEGAL_DOCS)[number]['key'];

export function legalTitle(key: string | undefined): string | null {
  return LEGAL_DOCS.find((d) => d.key === key)?.title ?? null;
}
