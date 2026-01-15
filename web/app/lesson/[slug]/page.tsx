import { notFound } from 'next/navigation';
import { getLesson } from '@/lib/lessons';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import VideoPlayer from '@/components/VideoPlayer';
import Paywall from '@/components/Paywall';
import LessonBody from '@/components/LessonBody';

type Props = { params: { slug: string } };

export default async function LessonPage({ params }: Props) {
  const data = await getLesson(params.slug);
  if (!data) return notFound();
  const html = DOMPurify.sanitize(await marked.parse(data.content));

  return (
    <div>
      <h1>{data.title}</h1>
      {data.videoId && <VideoPlayer videoId={data.videoId} />}
      {data.tier === 'premium' && <Paywall priceId={process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_123'} />}
      <LessonBody html={html} tier={data.tier} slug={data.slug} />
    </div>
  );
}
