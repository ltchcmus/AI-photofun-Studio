import React, { useMemo, useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { useAuthContext } from "../context/AuthContext";
import { toast } from "../hooks/use-toast";

const PAYMENT_API_URL =
  import.meta.env.VITE_PAYMENT_API_URL ||
  "https://nmcnpm-payment-service.onrender.com/payment/create-payment";
const PAYMENT_API_KEY =
  import.meta.env.VITE_PAYMENT_API_KEY ||
  "81aa801afec422868bea639e7c7bde4be900f533a4e1c755bffbb7c331c205b972a70e93bae29c79023cfe53a1fd9abd7c825cd57a1a46152fcaaacabfda350f";

const PLAN_CONFIG = {
  "1_MONTH": {
    productName: "PREMIUM_ONE_MONTH",
    price: 500,
    amount: 500,
    description: "Premium 1 month",
    image: "https://via.placeholder.com/300x300.png?text=Premium",
  },
  "6_MONTHS": {
    productName: "PREMIUM_SIX_MONTHS",
    price: 2000,
    amount: 2000,
    description: "Premium 6 months",
    image: "https://via.placeholder.com/300x300.png?text=Premium",
  },
};

const createPaymentUrl = async (user, planType) => {
  const planConfig = PLAN_CONFIG[planType];

  const response = await fetch(PAYMENT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PAYMENT_API_KEY,
    },
    body: JSON.stringify({
      userId: user.id,
      productName: planConfig.productName,
      amount: planConfig.amount,
      description: planConfig.description,
      image: planConfig.image,
      email: user.email,
      price: planConfig.price,
      currency: "usd",
      quantity: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Payment API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data?.result?.url) {
    throw new Error("No payment URL received from server");
  }

  return data.result.url;
};

const PricingPage = () => {
  const { user, isAuthenticated } = useAuthContext();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = useMemo(
    () => [
      {
        key: "1_MONTH",
        name: "Premium / Monthly",
        priceLabel: "$5",
        cadence: "Billed monthly",
        blurb:
          "For focused creators who need fast output without long commitments.",
        features: [
          "500 tokens per day",
          "Fast image generation",
          "All styles unlocked",
        ],
        cta: "Start monthly",
        accent: "from-slate-200/40 to-white/10",
      },
      {
        key: "6_MONTHS",
        name: "Premium / 6 Months",
        priceLabel: "$20",
        cadence: "$3.3/mo · billed every 6 months",
        blurb: "Best value for teams and power users who ship often.",
        features: [
          "2000 tokens per day",
          "Highest priority queue",
          "24/7 support and early access",
          "Keep full image history",
        ],
        cta: "Upgrade for $20",
        highlight: true,
        badge: "Most popular",
        accent: "from-amber-200/60 to-orange-200/20",
      },
    ],
    []
  );

  const handleSubscribe = async (planType) => {
    if (loadingPlan) return;

    // Check if user is logged in
    if (!isAuthenticated || !user) {
      toast.warning("Please log in to make a payment");
      return;
    }

    setLoadingPlan(planType);
    try {
      const checkoutUrl = await createPaymentUrl(user, planType);
      // Redirect to Stripe checkout page
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(`Unable to create payment: ${error.message}`);
      setLoadingPlan(null);
    }
    // Note: We don't reset loading in finally block if redirecting,
    // but since we might not redirect on error, we handle it in catch.
    // If success, the page unloads anyway.
    // However, to be safe if navigation is cancelled or SPA behavior:
    // Ideally we should reset if it fails. If it succeeds, we leave the page.
    // Let's keep the original logic structure but with the new state.
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-[-30%] h-80 bg-gradient-to-t from-slate-900 via-slate-950" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pb-16 pt-14 sm:pt-16 lg:pt-20">
        <header className="flex flex-col gap-4 text-center items-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300/80 ring-1 ring-white/10">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />{" "}
            Premium access
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
            Pricing that stays out of the way
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-slate-300">
            Choose the pace that matches your workflow. Transparent pricing,
            elegant experience, no surprises.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const isLoading = loadingPlan === plan.key;
            const isDisabled = !!loadingPlan && !isLoading;

            return (
              <div
                key={plan.key}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-7 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.6)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_35px_90px_-40px_rgba(0,0,0,0.75)] ${
                  plan.highlight ? "ring-1 ring-amber-200/30" : ""
                }`}
              >
                <div
                  className={`absolute inset-0 opacity-60 bg-gradient-to-br ${plan.accent}`}
                />
                <div className="relative flex flex-col h-full gap-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">
                        {plan.highlight ? "Best for momentum" : "Flexible"}
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">
                        {plan.name}
                      </h2>
                    </div>
                    {plan.badge ? (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-100 ring-1 ring-amber-200/40">
                        {plan.badge}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-semibold text-white">
                        {plan.priceLabel}
                      </span>
                      <span className="text-sm text-slate-300">
                        {plan.cadence}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{plan.blurb}</p>
                  </div>

                  <ul className="space-y-2.5 text-sm text-slate-100/90">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-emerald-200">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isDisabled}
                      className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                        plan.highlight
                          ? "bg-white text-slate-900 hover:-translate-y-0.5"
                          : "bg-white/10 text-white hover:bg-white/15 hover:-translate-y-0.5"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        plan.cta
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center text-sm text-slate-300">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="h-px w-6 bg-white/20" />
            Thoughtfully simple — cancel anytime
            <span className="h-px w-6 bg-white/20" />
          </div>
          <p className="max-w-2xl text-slate-400">
            We keep payments minimal: secure checkout, instant activation, and a
            clean dashboard to manage your subscription.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
