export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  } catch {
    return null;
  }
}

export function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

export function isDirectImage(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
}