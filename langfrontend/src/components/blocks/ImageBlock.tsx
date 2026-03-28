import { C } from "../../theme";
import type { ImageBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// IMAGE BLOCK — responsive image with optional caption
// ─────────────────────────────────────────────────────────────
interface ImageBlockProps {
  data: ImageBlockData;
  accentColor: string;
}

export default function ImageBlock({ data }: ImageBlockProps) {
  if (!data.url) return null;

  return (
    <div
      style={{
        marginBottom: 24,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: "hidden",
      }}
    >
      <img
        src={data.url}
        alt={data.alt ?? "Image"}
        style={{ width: "100%", display: "block", maxHeight: 480, objectFit: "contain" }}
        loading="lazy"
      />
      {data.caption && (
        <div
          style={{
            padding: "10px 16px",
            borderTop: `1px solid ${C.border}`,
            color: C.dim, fontSize: 12, textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {data.caption}
        </div>
      )}
    </div>
  );
}
