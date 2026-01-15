type Props = { videoId?: string };

export default function VideoPlayer({ videoId }: Props) {
  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}`;
  return (
    <div style={{ margin: '1rem 0', position: 'relative', paddingTop: '56.25%' }}>
      <iframe
        src={src}
        title="Lesson Video"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

