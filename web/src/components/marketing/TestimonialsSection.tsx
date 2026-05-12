import Image from 'next/image';
import { panelSurfaceStyles } from '@/components/surfaceStyles';
import { sectionTitleStyles } from '@/components/typographyStyles';
import { getPublicAppUrlOrDefault } from '@/lib/publicAppUrl';
import { getPublishedTestimonials, type Testimonial } from '@/content/testimonials';

function buildReviewJsonLd(items: Testimonial[], siteUrl: string) {
  const softwareId = `${siteUrl}#insiderflow-app`;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'SoftwareApplication',
      '@id': softwareId,
      name: 'Insider Flow',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: siteUrl,
    },
  ];

  for (const t of items) {
    const review: Record<string, unknown> = {
      '@type': 'Review',
      '@id': `${siteUrl}#review-${t.id}`,
      itemReviewed: { '@id': softwareId },
      author: { '@type': 'Person', name: t.authorSchemaName },
      reviewBody: `${t.quoteHant}\n${t.quoteEn}`,
      inLanguage: ['zh-Hant', 'en'],
    };
    if (t.datePublished) review.datePublished = t.datePublished;
    if (typeof t.ratingValue === 'number') {
      review.reviewRating = {
        '@type': 'Rating',
        ratingValue: t.ratingValue,
        bestRating: 5,
        worstRating: 1,
      };
    }
    graph.push(review);
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export default function TestimonialsSection() {
  const items = getPublishedTestimonials();
  if (items.length === 0) return null;

  const siteUrl = getPublicAppUrlOrDefault();
  const jsonLd = buildReviewJsonLd(items, siteUrl);
  const jsonStr = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <section className="space-y-4" aria-labelledby="home-testimonials-heading">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonStr }} />
      <h2 id="home-testimonials-heading" className={sectionTitleStyles()}>
        <span className="zh-Hant">讀者回饋</span>
        <span className="zh-Hans hidden">读者回馈</span>
        <span lang="en" className="text-gray-500 text-sm font-normal ml-2">
          Reader notes
        </span>
      </h2>
      <p className="text-xs text-gray-500 -mt-2">
        <span className="zh-Hant">已授權刊登；可匿名。星等僅在讀者明確給分時顯示。</span>
        <span className="zh-Hans hidden">已授权刊登；可匿名。星等仅在读者明确给分时显示。</span>
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((t) => (
          <article key={t.id} className={`${panelSurfaceStyles()} rounded-xl border border-gray-700 p-4 flex flex-col gap-3`}>
            <blockquote className="text-sm text-gray-200 leading-relaxed flex-1">
              <p className="zh-Hant">「{t.quoteHant}」</p>
              <p className="zh-Hans hidden">「{t.quoteHans}」</p>
              <p lang="en" className="text-xs text-gray-500 mt-2 not-italic">
                {t.quoteEn}
              </p>
            </blockquote>
            {t.ratingValue ? (
              <p className="text-amber-400 text-xs" aria-label={`Rating ${t.ratingValue} of 5`}>
                {'★'.repeat(t.ratingValue)}
                <span className="text-gray-600 ml-1">/ 5</span>
              </p>
            ) : null}
            <footer className="text-xs text-gray-500 border-t border-gray-700/80 pt-2">
              <span className="zh-Hant">{t.authorLabelHant}</span>
              <span className="zh-Hans hidden">{t.authorLabelHans}</span>
              {t.datePublished ? <span className="text-gray-600 ml-2">{t.datePublished}</span> : null}
            </footer>
            {t.imageSrc ? (
              <figure className="mt-1 overflow-hidden rounded-lg border border-gray-600 bg-gray-800/50">
                <Image
                  src={t.imageSrc}
                  alt={t.imageAltEn ?? t.imageAltHant ?? 'Testimonial'}
                  width={320}
                  height={120}
                  className="w-full h-auto object-cover"
                  unoptimized={t.imageSrc.endsWith('.svg')}
                />
                {(t.imageAltHant || t.imageAltHans) && (
                  <figcaption className="text-[10px] text-gray-600 px-2 py-1">
                    <span className="zh-Hant">{t.imageAltHant}</span>
                    <span className="zh-Hans hidden">{t.imageAltHans}</span>
                  </figcaption>
                )}
              </figure>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
