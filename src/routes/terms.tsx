import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage, Prose } from "@/components/marketing";
import { T4P, Training4Performance } from "@/components/brand-text";
import { breadcrumbLd, seoHead, webPageLd } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    ...seoHead({
      path: "/terms",
      title: "Terms & Conditions | T4P Training 4 Performance",
      description:
        "Terms and conditions of use for T4P (Training 4 Performance), the football performance management platform for strength and conditioning coaches.",
      card: "summary",
    }),
    scripts: [
      webPageLd({
        path: "/terms",
        name: "Terms & Conditions",
        description: "The contractual terms governing use of the T4P football performance platform.",
        breadcrumb: true,
      }),
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Terms & Conditions", path: "/terms" },
      ]),
    ],
  }),
  component: () => (
    <MarketingPage>
      <Prose title="Terms & Conditions" updated="10 August 2026">
        <h2>1. Scope</h2>
        <p>
          These terms govern the use of <T4P /> (<Training4Performance />), a software-as-a-service platform for football
          fitness, performance and training management ("the Service"). By creating an account or using the
          Service, the subscribing club, organisation or individual ("the Customer") accepts these terms.
        </p>

        <h2>2. Subscription and billing</h2>
        <ul>
          <li>A team subscription costs €699 per season, billed yearly in advance, and covers one team.</li>
          <li>The subscription renews automatically every month until it is cancelled, and can be cancelled at any time from the account area; access continues until the end of the paid month.</li>
          <li>Prices are in euro and exclude VAT, which is added where legally applicable.</li>
          <li>The subscriber owns the account and the data inside it, and can export or delete it at any time.</li>
        </ul>

        <h2>3. Right of withdrawal (EU consumers)</h2>
        <p>
          Where the Customer is a consumer within the meaning of EU Directive 2011/83/EU, a 14-day right of
          withdrawal applies from the conclusion of the contract. By requesting immediate access to the Service,
          the consumer acknowledges that the right of withdrawal lapses once the Service has been fully performed
          and expressly consents to this. Business customers (clubs and organisations) are not covered by the
          consumer right of withdrawal.
        </p>

        <h2>4. Acceptable use</h2>
        <ul>
          <li>Accounts and credentials must not be shared outside the Customer's authorised staff.</li>
          <li>The Service must not be used to store data unlawfully obtained or processed.</li>
          <li>Reverse engineering, resale or sublicensing of the Service is not permitted.</li>
          <li>The Customer is responsible for the accuracy and lawfulness of the data it uploads.</li>
        </ul>

        <h2>5. Customer data and roles</h2>
        <p>
          The Customer remains the controller of all player, staff and performance data entered into the Service.
          <T4P /> acts as a processor on the Customer's behalf under Article 28 GDPR. Health-related data (injury,
          diagnosis, rehabilitation) is accessible to the staff users the Customer invites to its workspace; the
          Customer is responsible for limiting those invitations to authorised personnel.
        </p>

        <h2>6. Availability</h2>
        <p>
          <T4P /> aims for high availability but does not guarantee uninterrupted access. Planned maintenance is
          communicated in advance where reasonably possible. No warranty is given that the Service will be free of
          errors.
        </p>

        <h2>7. Liability</h2>
        <p>
          <T4P /> is a decision-support tool. It does not provide medical advice and does not replace professional
          judgement by qualified coaching or medical staff. To the maximum extent permitted by applicable law,
          liability is limited to the fees paid by the Customer in the twelve months preceding the event giving
          rise to the claim. Nothing limits liability for death, personal injury caused by negligence, fraud, or
          any liability that cannot be excluded under mandatory law.
        </p>

        <h2>8. Termination</h2>
        <p>
          A subscription runs month to month and may be cancelled at any time, taking effect at the end of the current paid month. After a cancellation, expiry or failed payment the account switches to read-only: all data, reports and exports remain available, but no new records can be created or edited until the subscription is resumed. <T4P /> may suspend
          or terminate access in the event of material breach of these terms or non-payment, following notice.
          On termination, the Customer may request an export of its data within 30 days.
        </p>

        <h2>9. Changes</h2>
        <p>
          These terms may be updated. Material changes are notified to subscribers at least 30 days in
          advance. Continued use after the effective date constitutes acceptance.
        </p>

        <h2>10. Governing law</h2>
        <p>
          These terms are governed by the law of the European Union member state in which <T4P /> is established, with
          mandatory consumer protection rules of the customer's country of residence remaining unaffected. Disputes
          are subject to the competent courts of that jurisdiction. EU consumers may also use the European Online
          Dispute Resolution platform.
        </p>

        <h2>11. Contact</h2>
        <p>Questions about these terms: harisfalas@gmail.com.</p>
      </Prose>
    </MarketingPage>
  ),
});
