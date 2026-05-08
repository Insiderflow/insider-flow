import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Insider Flow",
  description: "Terms for using Insider Flow.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 text-sm text-gray-200">
      <h1 className="text-3xl font-semibold text-white">Terms of Service</h1>
      <p className="text-gray-300">Last updated: 2026-05-05</p>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Service scope</h2>
        <p>
          Insider Flow provides informational tooling around market and insider-trading-related data.
          Content is provided on an as-is basis and may be delayed, incomplete, or corrected over time.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">No investment advice</h2>
        <p>
          Insider Flow is not investment, legal, accounting, or tax advice. You are solely responsible for
          your decisions and should consult qualified professionals where needed.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Accounts and acceptable use</h2>
        <p>
          You are responsible for safeguarding your account credentials. Abuse, scraping beyond allowed limits,
          credential sharing, reverse engineering, or attempts to degrade service availability are prohibited.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Subscriptions and billing</h2>
        <p>
          Paid plans (if enabled) renew based on your selected billing cycle unless canceled. Billing,
          refunds, and platform-specific terms may be managed by the provider handling your purchase
          (for example Stripe, Apple, or Google) and are subject to their policies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Availability and changes</h2>
        <p>
          We may modify, suspend, or discontinue features at any time. We may update these terms when
          required by legal, security, or product changes.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Liability limits</h2>
        <p>
          To the maximum extent allowed by law, Insider Flow is not liable for indirect, incidental,
          special, consequential, or punitive damages, including trading losses or missed opportunities.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-medium text-white">Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a className="text-blue-300 hover:text-blue-200" href="mailto:support@insiderflow.asia">
            support@insiderflow.asia
          </a>
        </p>
      </section>

      <p className="pt-3 text-gray-300">
        Also see our{" "}
        <Link className="text-blue-300 hover:text-blue-200" href="/privacy">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
