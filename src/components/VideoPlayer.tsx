import React from 'react';

interface VideoPlayerProps {
  url: string;
  className?: string;
}

function getEmbedUrl(url: string): { type: 'iframe' | 'video'; src: string } | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };

  // Adilo (BigCommand)
  const adiloMatch = url.match(/adilo\.bigcommand\.com\/watch\/([a-zA-Z0-9]+)/);
  if (adiloMatch) return { type: 'iframe', src: `https://adilo.bigcommand.com/watch/${adiloMatch[1]}?embed=true` };

  // Panda Video
  const pandaMatch = url.match(/pandavideo\.com(?:\.br)?\/(?:embed\/\?v=|watch\/)?([a-zA-Z0-9-]+)/);
  if (pandaMatch) return { type: 'iframe', src: `https://player-vz-7b95cf00-d55.tv.pandavideo.com.br/embed/?v=${pandaMatch[1]}` };
  // Already an embed URL from Panda
  if (url.includes('pandavideo.com') && url.includes('embed')) return { type: 'iframe', src: url };

  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) return { type: 'iframe', src: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };

  // Direct video file
  if (url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return { type: 'video', src: url };

  // Fallback: try as iframe (covers other embed-ready URLs)
  return { type: 'iframe', src: url };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, className = '' }) => {
  const embed = getEmbedUrl(url);
  if (!embed) return null;

  if (embed.type === 'video') {
    return (
      <div className={`aspect-video rounded-lg overflow-hidden bg-black ${className}`}>
        <video src={embed.src} controls playsInline preload="metadata" className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={`aspect-video rounded-lg overflow-hidden bg-black ${className}`}>
      <iframe
        src={embed.src}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        frameBorder="0"
      />
    </div>
  );
};

export default VideoPlayer;
