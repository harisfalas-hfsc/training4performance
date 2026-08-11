import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage, Prose } from "@/components/marketing";
import { T4P, Training4Performance } from "@/components/brand-text";
import { breadcrumbLd, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    ...seoHead({
      path: "/privacy",
      title: "Privacy Policy (GDPR) | T4P Training 4 Performance",
      description:
        "How T4P collects, processes and protects personal data under the EU GDPR, including special-category health data for football players and coaching staff.",
      card: "summary",
    }),
    scripts: [
      breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Privacy Policy", path: "/privacy" },
      ]),
    ],
  }),
  component: () => (
    <MarketingPage>
      <Prose title="Privacy Policy" updated="10 August 2026">
        <p>
          This policy explains how personal data is handled in <T4P /> (<Training4Performance />) in accordance with
          Regulation (EU) 2016/679 (GDPR).
        </p>

        <h2>1. Roles: controller and processor</h2>
        <p>
          For account data of subscribers and staff users (name, email, club, billing details), <T4P /> is the
          <strong> controller</strong>. For player and performance data entered by a club, the club is the
          <strong> controller</strong> and <T4P /> acts as <strong>processor</strong> under Article 28 GDPR.
        </p>

        <h2>2. Data we process</h2>
        <ul>
          <li><strong>Account data:</strong> name, email address, club name, role, authentication identifiers.</li>
          <li><strong>Subscription data:</strong> plan, season, status.</li>
          <li><strong>Player data (club-controlled):</strong> identity, position, contract, training records, GPS and physical output, RPE, wellness, testing results, availability.</li>
          <li><strong>Health data (special category, Article 9):</strong> injury, diagnosis, rehabilitation and return-to-play information, only where a club chooses to record it.</li>
          <li><strong>Technical data:</strong> log data necessary for security and service operation.</li>
        </ul>

        <h2>3. Legal bases</h2>
        <ul>
          <li>Performance of a contract (Art. 6(1)(b)) for providing the Service.</li>
          <li>Legitimate interests (Art. 6(1)(f)) for security, fraud prevention and service improvement.</li>
          <li>Legal obligation (Art. 6(1)(c)) for accounting and tax records.</li>
          <li>For health data, the club must rely on an appropriate Article 9(2) condition — typically explicit consent or occupational-health/employment obligations under national law.</li>
        </ul>

        <h2>4. Access control</h2>
        <p>
          Availability, workload, performance and clinical notes are visible to the staff users the club invites
          into its workspace. The club is responsible for limiting those invitations to personnel authorised to see
          health-related data, and for removing access when a staff member leaves.
        </p>

        <h2>5. Sub-processors and hosting</h2>
        <p>
          Data is hosted on managed cloud infrastructure within the European Union where available. Sub-processors
          are engaged only under written data-processing agreements with equivalent protection. Where a transfer
          outside the EEA is unavoidable, EU Standard Contractual Clauses are used.
        </p>

        <h2>6. Retention</h2>
        <ul>
          <li>Account data: for the duration of the subscription plus 12 months.</li>
          <li>Club-controlled player data: for as long as the club maintains its account, or until the club deletes it.</li>
          <li>Invoicing records: as required by applicable tax law (typically 6–10 years).</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>
          Data subjects have the right of access, rectification, erasure, restriction, data portability, objection,
          and the right not to be subject to solely automated decision-making with legal or similarly significant
          effects. <T4P /> does not make such automated decisions; alerts and AI observations are advisory and always
          reviewed by staff. Requests concerning player data should be addressed to the club as controller; <T4P />
          assists the club in fulfilling them.
        </p>

        <h2>8. Security</h2>
        <p>
          Measures include encrypted transport, encrypted storage at rest, row-level access rules, authenticated
          access, restriction of health data to the customer workspace and least-privilege administrative access. Personal data
          breaches are notified to the competent supervisory authority within 72 hours where required, and to
          affected controllers without undue delay.
        </p>

        <h2>9. Cookies</h2>
        <p>
          <T4P /> uses only strictly necessary cookies and local storage for authentication and interface preferences.
          No advertising or third-party tracking cookies are used, so no consent banner is required for these.
        </p>

        <h2>10. Complaints and contact</h2>
        <p>
          Data protection contact: harisfalas@gmail.com. Data subjects may lodge a complaint with the supervisory
          authority of their EU member state of residence, work or the place of the alleged infringement.
        </p>
      </Prose>
    </MarketingPage>
  ),
});
