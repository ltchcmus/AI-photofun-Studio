import React, { useMemo, useState, useEffect } from "react";
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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Listen for dark mode changes
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeStorage = localStorage.getItem("darkMode") === "true";
      const bodyHasDark = document.body.classList.contains("dark");
      setIsDarkMode(darkModeStorage || bodyHasDark);
    };

    // Initial check
    checkDarkMode();

    // Listen for storage changes (when changed from another tab/window)
    window.addEventListener("storage", checkDarkMode);

    // Listen for class changes on body (when changed in same tab via Sidebar)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("storage", checkDarkMode);
      observer.disconnect();
    };
  }, []);

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
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"
      } relative overflow-hidden`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute -left-20 top-10 h-64 w-64 rounded-full ${
            isDarkMode ? "bg-cyan-500/5" : "bg-cyan-300/10"
          } blur-3xl animate-float`}
          style={{ animationDelay: "0s", animationDuration: "8s" }}
        />
        <div
          className={`absolute right-0 top-20 h-72 w-72 rounded-full ${
            isDarkMode ? "bg-amber-500/10" : "bg-amber-200/20"
          } blur-3xl animate-float`}
          style={{ animationDelay: "2s", animationDuration: "10s" }}
        />
        <div
          className={`absolute inset-x-6 top-28 h-72 rounded-3xl bg-gradient-to-r ${
            isDarkMode
              ? "from-slate-800 via-slate-900 to-slate-800"
              : "from-slate-50 via-white to-slate-50"
          }`}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 pb-16 pt-14 sm:pt-16 lg:pt-20">
        <header className="flex flex-col gap-4 text-center items-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full ${
              isDarkMode
                ? "bg-slate-100/10 text-slate-400 ring-slate-100/20"
                : "bg-slate-900/5 text-slate-500 ring-slate-900/10"
            } px-4 py-2 text-xs uppercase tracking-[0.25em] ring-1 transition-all duration-300 hover:scale-105`}
          >
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 animate-pulse-subtle" />{" "}
            Premium access
          </span>
          <h1
            className={`text-4xl sm:text-5xl font-semibold tracking-tight ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Pricing that stays out of the way
          </h1>
          <p
            className={`max-w-2xl text-sm sm:text-base ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}
          >
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
                className={`group/card relative overflow-hidden rounded-2xl border ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800 shadow-[0_25px_70px_-45px_rgba(0,0,0,0.6)] hover:border-slate-500 hover:shadow-[0_35px_90px_-50px_rgba(0,0,0,0.8)]"
                    : "border-slate-200 bg-white shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)] hover:border-slate-400 hover:shadow-[0_35px_90px_-50px_rgba(15,23,42,0.5)]"
                } p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] ${
                  plan.highlight
                    ? isDarkMode
                      ? "ring-2 ring-amber-500/40 hover:ring-amber-400/60"
                      : "ring-2 ring-amber-200/80 hover:ring-amber-300"
                    : ""
                }`}
              >
                {/* Glow effect on hover */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 ${
                    isDarkMode
                      ? "bg-gradient-to-br from-slate-600/20 via-transparent to-slate-700/20"
                      : "bg-gradient-to-br from-slate-100/50 via-transparent to-slate-200/50"
                  }`}
                />
                <div
                  className={`absolute inset-0 opacity-70 bg-gradient-to-br ${plan.accent}`}
                />
                <div className="relative flex flex-col h-full gap-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={`text-xs uppercase tracking-[0.2em] ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {plan.highlight ? "Best for momentum" : "Flexible"}
                      </p>
                      <h2
                        className={`mt-2 text-2xl font-semibold ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {plan.name}
                      </h2>
                    </div>
                    {plan.badge ? (
                      <span
                        className={`relative overflow-hidden rounded-full ${
                          isDarkMode
                            ? "bg-amber-900/30 text-amber-400 ring-amber-700"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        } px-3 py-1 text-xs font-medium ring-1 animate-pulse-subtle`}
                      >
                        <span className="relative z-10">{plan.badge}</span>
                        {/* Shimmer effect */}
                        <span className="absolute inset-0 -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="flex items-end gap-2">
                      <span
                        className={`text-4xl font-semibold transition-transform duration-300 group-hover/card:scale-110 inline-block ${
                          isDarkMode ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {plan.priceLabel}
                      </span>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {plan.cadence}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-sm ${
                        isDarkMode ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {plan.blurb}
                    </p>
                  </div>

                  <ul
                    className={`space-y-2.5 text-sm ${
                      isDarkMode ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    {plan.features.map((item, index) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 group/feature"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 group-hover/card:scale-110 group-hover/feature:rotate-12 ${
                            isDarkMode
                              ? "bg-emerald-900/30 text-emerald-400 ring-emerald-700 group-hover/card:bg-emerald-800/40 group-hover/card:ring-emerald-600"
                              : "bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover/card:bg-emerald-100 group-hover/card:ring-emerald-200"
                          } ring-1`}
                          style={{ transitionDelay: `${index * 50}ms` }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="leading-snug transition-colors duration-300 group-hover/feature:font-medium">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isDisabled}
                      className={`group/btn relative overflow-hidden inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 ${
                        isDarkMode
                          ? "focus-visible:outline-slate-100"
                          : "focus-visible:outline-slate-900"
                      } ${
                        plan.highlight
                          ? (isDarkMode
                              ? "bg-slate-100 text-slate-900 hover:bg-white hover:shadow-lg hover:shadow-slate-100/20"
                              : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/40") +
                            " hover:-translate-y-1 hover:scale-105"
                          : (isDarkMode
                              ? "bg-slate-100/10 text-slate-100 hover:bg-slate-100/20 hover:shadow-md"
                              : "bg-slate-900/5 text-slate-900 hover:bg-slate-900/10 hover:shadow-md") +
                            " hover:-translate-y-1"
                      } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100`}
                    >
                      {/* Shine effect on hover */}
                      <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <span className="relative z-10 flex items-center gap-2">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          plan.cta
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-12 flex flex-col items-center gap-3 text-center text-sm ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          <div
            className={`flex items-center gap-2 group/footer ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            <span
              className={`h-px w-6 transition-all duration-500 group-hover/footer:w-12 ${
                isDarkMode
                  ? "bg-slate-700 group-hover/footer:bg-slate-600"
                  : "bg-slate-200 group-hover/footer:bg-slate-300"
              }`}
            />
            Thoughtfully simple — cancel anytime
            <span
              className={`h-px w-6 transition-all duration-500 group-hover/footer:w-12 ${
                isDarkMode
                  ? "bg-slate-700 group-hover/footer:bg-slate-600"
                  : "bg-slate-200 group-hover/footer:bg-slate-300"
              }`}
            />
          </div>
          <p
            className={`max-w-2xl ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            We keep payments minimal: secure checkout, instant activation, and a
            clean dashboard to manage your subscription.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
