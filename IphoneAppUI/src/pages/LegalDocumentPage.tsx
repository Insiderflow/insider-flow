import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CONTACT_EMAIL, getLegalDocument } from "@/content/legal";
import { useLanguage } from "@/i18n/LanguageContext";

function renderBody(body: string) {
  if (!body.includes(CONTACT_EMAIL)) {
    return <p className="text-sm leading-relaxed text-gray-300">{body}</p>;
  }

  const [before, after] = body.split(CONTACT_EMAIL);
  return (
    <p className="text-sm leading-relaxed text-gray-300">
      {before}
      <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">
        {CONTACT_EMAIL}
      </a>
      {after}
    </p>
  );
}

export default function LegalDocumentPage() {
  const { docId } = useParams<{ docId: string }>();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();
  const doc = docId ? getLegalDocument(docId, locale) : null;

  if (!doc) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-tab-safe pt-safe">
        <p className="text-muted">{t.legal.notFound}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-tab-safe pt-safe">
      <header className="sticky top-0 z-10 border-b border-border bg-canvas/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium text-accent-blue"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.legal.back}
        </button>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 text-sm text-gray-200">
        <h1 className="text-2xl font-semibold text-white">{doc.title}</h1>
        <p className="text-gray-400">{t.legal.lastUpdated(doc.lastUpdated)}</p>

        {doc.sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-lg font-medium text-white">{section.heading}</h2>
            {renderBody(section.body)}
          </section>
        ))}

        <p className="pt-3 text-gray-400">
          {t.legal.alsoSee}{" "}
          <Link to={doc.relatedPath} className="text-accent-blue hover:underline">
            {doc.relatedLabel}
          </Link>
          。
        </p>
      </main>
    </div>
  );
}
