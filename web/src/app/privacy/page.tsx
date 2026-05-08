import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Insider Flow",
  description: "How Insider Flow collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 text-sm text-gray-200">
      <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
      <p className="text-gray-300">Last updated: 2026-05-05</p>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">What we collect</h2>
        <p>
          Account email, authentication identifiers (Google/Facebook when used), session data, watchlist and
          app preferences, and usage logs required for reliability and abuse prevention.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">How we use data</h2>
        <p>
          We use your data to authenticate users, provide app features, send transactional emails
          (verification/password reset), improve product stability, and secure the platform.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Payments</h2>
        <p>
          Payments and subscriptions are processed by third-party providers (for example Stripe,
          Apple, Google, RevenueCat). We do not store full card numbers in Insider Flow.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Sharing</h2>
        <p>
          We share data only with service providers required to operate Insider Flow
          (hosting, database, authentication, email, billing) and when legally required.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Retention</h2>
        <p>
          We keep data while your account is active and as needed for security, legal obligations,
          and auditability. Data is deleted or anonymized when no longer required.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Your controls</h2>
        <p>
          You can request account deletion and data export by emailing{" "}
          <a className="text-blue-300 hover:text-blue-200" href="mailto:support@insiderflow.asia">
            support@insiderflow.asia
          </a>
          . We may verify account ownership before processing requests.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Contact</h2>
        <p>
          Privacy questions:{" "}
          <a className="text-blue-300 hover:text-blue-200" href="mailto:support@insiderflow.asia">
            support@insiderflow.asia
          </a>
        </p>
      </section>

      <p className="pt-3 text-gray-300">
        Also see our{" "}
        <Link className="text-blue-300 hover:text-blue-200" href="/terms">
          Terms of Service
        </Link>
        .
      </p>
    </main>
  );
}
