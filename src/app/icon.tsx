import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * The nabla — both the literal gradient operator and the app's own name — drawn as an SVG triangle
 * rather than the Unicode glyph (Satori's default font in ImageResponse doesn't include it, and its CSS
 * border-triangle trick doesn't render as a triangle either — a real SVG shape is the reliable path).
 */
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
          background: "#1a1d27",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20">
          <polygon points="2,2 18,2 10,18" fill="#e8a355" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
