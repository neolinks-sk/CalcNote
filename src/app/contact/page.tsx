import type { Metadata } from "next";
import CushionLayout from "@/components/Cushion/CushionLayout";
import { APP_NAME, SITE_URL } from "@/constants";

export const metadata: Metadata = {
  title: `お問い合わせ | ${APP_NAME}`,
  description:
    "CalcNoteに関するお問い合わせ、ご意見、ご要望、不具合のご報告はこちらから受け付けております。親サイト（HITtools）の専用フォームよりご連絡ください。",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: `お問い合わせ | ${APP_NAME}`,
    description:
      "CalcNoteに関するお問い合わせ、ご意見、ご要望、不具合のご報告はこちらから受け付けております。親サイト（HITtools）の専用フォームよりご連絡ください。",
    url: `${SITE_URL}/contact`,
    siteName: APP_NAME,
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <CushionLayout
      type="contact"
      title="お問い合わせ"
      badge="Contact Us"
      targetUrl="https://www.hit-tool.com/contact"
      buttonLabel="お問い合わせページを開く"
      targetName="お問い合わせ"
    />
  );
}
