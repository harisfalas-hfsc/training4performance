import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage, Prose } from "@/components/marketing";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — T4P" },
      {
        name: "description",
        content:
          "Disclaimer for T4P: the platform is a decision-support tool and does not provide medical, diagnostic or legal advice.",
      },
      { property: "og:title", content: "Disclaimer — T4P" },
      { property: "og:description", content: "Limits of use for the T4P performance platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <MarketingPage>
      <Prose title="Disclaimer" updated="10 August 2026">
        <h2>No medical advice</h2>
        <p>
          T4P is a performance monitoring and decision-support tool for qualified sports staff. It does not provide
          medical advice, diagnosis or treatment, and it is not a medical device within the meaning of Regulation
          (EU) 2017/745. Injury, illness and return-to-play decisions must always be made by qualified medical
          professionals.
        </p>

        <h2>Advisory metrics</h2>
        <p>
          Training load, acute:chronic workload ratio, monotony, strain, wellness indices, alerts and AI-generated
          observations are statistical indicators derived from the data entered. They are approximations, depend on
          the quality and completeness of that data, and must be interpreted in context by qualified staff. They do
          not predict injury and must not be used as the sole basis for a decision affecting a player's health,
          participation or contract.
        </p>

        <h2>Data accuracy</h2>
        <p>
          T4P processes data as supplied by the club and by GPS or other third-party systems. No warranty is given
          as to the accuracy, completeness or fitness for purpose of imported third-party data.
        </p>

        <h2>Third-party systems</h2>
        <p>
          References to GPS providers and other third-party products are for interoperability purposes only and do
          not imply endorsement, partnership or certification by those providers.
        </p>

        <h2>Limitation</h2>
        <p>
          To the fullest extent permitted by applicable law, T4P and its creator accept no liability for injury,
          loss of performance, sporting outcome, financial loss or any other damage arising from decisions taken on
          the basis of information presented in the platform.
        </p>

        <h2>Contact</h2>
        <p>Questions about this disclaimer: harisfalas@gmail.com.</p>
      </Prose>
    </MarketingPage>
  ),
});
