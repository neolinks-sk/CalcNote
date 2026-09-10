import { ImageResponse } from "next/og";

export const alt = "CalcNote - メモ＆手書きができる無料電卓アプリ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
              color: "white",
              fontWeight: 900,
            }}
          >
            +
          </div>
          <div style={{ fontSize: 96, fontWeight: 900, color: "white", display: "flex" }}>
            CalcNote
          </div>
        </div>
        <div style={{ fontSize: 34, color: "#cbd5e1", marginTop: 28, display: "flex" }}>
          メモ ＆ 手書きができる無料電卓アプリ
        </div>
        <div style={{ fontSize: 26, color: "#64748b", marginTop: 44, display: "flex" }}>
          hit-tool.com/calcnote
        </div>
      </div>
    ),
    { ...size }
  );
}
