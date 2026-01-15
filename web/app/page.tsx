import Link from 'next/link';
import { listLessons } from '@/lib/lessons';

export default async function HomePage() {
  const lessons = await listLessons();
  const free = lessons.filter(l => l.tier === 'free');
  const premium = lessons.filter(l => l.tier === 'premium');
  return (
    <div>
      <h1>Allie Course</h1>
      <p>Free and premium lessons. Sign in to access premium and subscribe via Stripe.</p>

      <h2>Free Lessons</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {free.map(l => (
          <Link href={`/lesson/${l.slug}`} key={l.slug} style={{ display: 'block', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            {l.thumbnailUrl ? (
              <img src={l.thumbnailUrl} alt={l.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            ) : (
              <div style={{ background: '#f6f6f6', height: 140 }} />
            )}
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{l.title}</div>
              {l.videoId ? <div style={{ fontSize: 12, opacity: 0.7 }}>Has video</div> : null}
            </div>
          </Link>
        ))}
      </div>

      <h2>Premium Lessons</h2>
      <p><a href="/pricing">See pricing</a> to unlock premium content.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {premium.map(l => (
          <Link href={`/lesson/${l.slug}`} key={l.slug} style={{ display: 'block', border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            {l.thumbnailUrl ? (
              <img src={l.thumbnailUrl} alt={l.title} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
            ) : (
              <div style={{ background: '#f6f6f6', height: 140 }} />
            )}
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{l.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Premium</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
