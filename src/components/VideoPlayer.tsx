import React from 'react';

interface VideoPlayerProps {
  url: string;
  className?: string;
  onProgress?: (percentage: number) => void;
  onComplete?: () => void;
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
  const adiloMatch = url.match(/adilo\.bigcommand\.com\/watch\/([a-zA-Z0-9_-]+)/);
  if (adiloMatch) return { type: 'iframe', src: `https://adilo.bigcommand.com/watch/${adiloMatch[1]}?embed=true` };

  // Panda Video
  const pandaMatch = url.match(/pandavideo\.com(?:\.br)?\/(?:embed\/\?v=|watch\/)?([a-zA-Z0-9_-]+)/);
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

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, className = '', onProgress, onComplete }) => {
  const embed = getEmbedUrl(url);
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    completedRef.current = false;
  }, [url]);

  React.useEffect(() => {
    if (!embed || embed.type !== 'iframe') return;

    const handleMessage = (event: MessageEvent) => {
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          return;
        }
      }

      if (!data) return;

      // Extract current time and duration, trying common video player message structures (especially Adilo)
      const currentTime = data.currentTime ?? data.value ?? data.data?.currentTime;
      const duration = data.duration ?? data.data?.duration;

      if (typeof currentTime === 'number' && typeof duration === 'number' && duration > 0) {
        const percentage = (currentTime / duration) * 100;
        
        if (onProgress) onProgress(percentage);

        if (percentage >= 90 && !completedRef.current) {
          completedRef.current = true;
          if (onComplete) onComplete();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [embed, url, onProgress, onComplete]);

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
