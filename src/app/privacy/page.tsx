import type { Metadata } from "next";
import CushionLayout from "@/components/Cushion/CushionLayout";
import { APP_NAME, SITE_URL } from "@/constants";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${APP_NAME}`,
  description:
    "CalcNoteのプライバシーポリシー（個人情報の取り扱い方針、利用規約等）についてご案内します。親サイト（HITtools）の専用ページにてご確認いただけます。",
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
  openGraph: {
    title: `プライバシーポリシー | ${APP_NAME}`,
    description:
      "CalcNoteのプライバシーポリシー（個人情報の取り扱い方針、利用規約等）についてご案内します。親サイト（HITtools）の専用ページにてご確認いただけます。",
    url: `${SITE_URL}/privacy`,
    siteName: APP_NAME,
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <CushionLayout
      type="privacy"
      title="プライバシーポリシー"
      badge="Privacy Policy"
      targetUrl="https://www.hit-tool.com/privacy"
      buttonLabel="プライバシーポリシーを確認する"
      targetName="プライバシーポリシー"
    />
  );
}
