import type { ReactNode } from 'react';

interface VideoProps {
  videoId: string;
  title: string;
}

export default function VideoEmbed({ videoId, title }: VideoProps): ReactNode {
  return (
    <div className="praman-video-container">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
