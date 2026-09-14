import type { Metadata } from "next";
import CushionLayout from "@/components/Cushion/CushionLayout";
import { APP_NAME, SITE_URL } from "@/constants";

export const metadata: Metadata = {
  title: `運営者情報 | ${APP_NAME}`,
  description:
    "CalcNoteの開発・運営元（HITtools）に関する運営者情報をご案内します。親サイトの専用ページにてご確認いただけます。",
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: `運営者情報 | ${APP_NAME}`,
    description:
      "CalcNoteの開発・運営元（HITtools）に関する運営者情報をご案内します。親サイトの専用ページにてご確認いただけます。",
    url: `${SITE_URL}/about`,
    siteName: APP_NAME,
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <CushionLayout
      type="about"
      title="運営者情報"
      badge="About Us"
      targetUrl="https://www.hit-tool.com/about"
      buttonLabel="運営者情報を確認する"
      targetName="運営者情報"
    />
  );
}
