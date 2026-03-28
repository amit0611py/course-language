import { C } from "../../theme";
import type { VideoBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// VIDEO BLOCK
// Supports:
//   • YouTube   — embeds via iframe
//   • Vimeo     — embeds via iframe
//   • Direct    — HTML5 <video> element
// ─────────────────────────────────────────────────────────────
interface VideoBlockProps {
  data: VideoBlockData;
  accentColor: string;
}

function getYouTubeEmbedUrl(url: string): string | null {
  const ytMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/) ??
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export default function VideoBlock({ data }: VideoBlockProps) {
  if (!data.url) return null;

  const ytEmbed = getYouTubeEmbedUrl(data.url);
  const vmEmbed = getVimeoEmbedUrl(data.url);
  const isEmbed = !!ytEmbed || !!vmEmbed;
  const embedSrc = ytEmbed ?? vmEmbed;

  return (
    <div
      style={{
        marginBottom: 24,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: "hidden",
      }}
    >
      {data.title && (
        <div
          style={{
            padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
            color: C.muted, fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span>▶</span>
          {data.title}
        </div>
      )}

      {isEmbed ? (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={embedSrc!}
            title={data.title ?? "Video"}
            style={{
              position: "absolute", top: 0, left: 0,
              width: "100%", height: "100%", border: "none",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          src={data.url}
          poster={data.poster}
          controls
          style={{ width: "100%", display: "block", maxHeight: 480 }}
        />
      )}
    </div>
  );
}
