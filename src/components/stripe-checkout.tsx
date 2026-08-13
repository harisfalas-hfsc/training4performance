import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

/** Test-mode notice — renders nothing once live payments are on. */
export function PaymentTestModeBanner() {
  const token = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;
  if (!token) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs font-medium text-destructive">
        Card payments are not configured for this build yet.
      </div>
    );
  }
  if (token.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-brand-amber/30 bg-brand-amber/10 px-4 py-2 text-center text-xs font-medium text-brand-amber">
        Payments are in test mode — no real money is taken. Use card 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}

/** Inline, PCI-compliant payment form for the T4P season subscription. */
export function StripeEmbeddedCheckout({
  priceId,
  teamName,
  returnUrl,
}: {
  priceId: string;
  teamName?: string;
  returnUrl?: string;
}) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: {
        priceId,
        teamName,
        returnUrl: returnUrl || window.location.href,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout could not be started.");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="mt-4">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
