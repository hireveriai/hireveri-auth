import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(180deg, rgba(17,38,73,1) 0%, rgba(8,21,43,1) 100%)",
            border: "1px solid rgba(85,190,255,0.45)",
            boxShadow: "0 6px 18px rgba(0, 185, 255, 0.22)",
            color: "#F3FBFF",
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "Arial, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          HV
        </div>
      </div>
    ),
    size
  );
}
