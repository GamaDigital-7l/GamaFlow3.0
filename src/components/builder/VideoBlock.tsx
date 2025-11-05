import React from 'react';
import { VideoBlockData } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VideoBlockProps {
  id: string;
  data: VideoBlockData;
  onChange: (id: string, data: VideoBlockData) => void;
}

const VideoBlock: React.FC<VideoBlockProps> = ({ id, data, onChange }) => {
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(id, { ...data, url: e.target.value });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={`video-url-${id}`}>Video URL</Label>
      <Input
        type="url"
        id={`video-url-${id}`}
        value={data.url || ''}
        onChange={handleUrlChange}
        placeholder="Enter video URL"
      />
      {data.url && (
        <iframe
          width="560"
          height="315"
          src={data.url}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
};

export default VideoBlock;