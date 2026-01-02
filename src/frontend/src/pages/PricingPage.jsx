import React, { useState } from "react";
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans flex flex-col justify-center">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">Upgrade to Premium</h2>
        <p className="text-gray-600 mt-2">
          Choose a plan that suits your creative needs
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 w-full">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-gray-900">1 Month Plan</h3>
          <div className="my-4">
            <span className="text-4xl font-bold text-gray-900">$5</span>
            <span className="text-gray-500">/month</span>
          </div>

          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 500
              Tokens per day
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Fast
              image generation
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Unlock
              all Styles
            </li>
          </ul>

          <button
            type="button"
            onClick={() => handleSubscribe("1_MONTH")}
            disabled={!!loadingPlan}
            className="w-full py-3 px-4 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-70 flex justify-center items-center"
          >
            {loadingPlan === "1_MONTH" ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Choose 1 Month Plan"
            )}
          </button>
        </div>

        <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 flex flex-col relative overflow-hidden md:scale-105 transform transition-transform duration-300 z-10">
          <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
            BEST VALUE
          </div>

          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            6 Month Plan
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          </h3>

          <div className="my-4">
            <span className="text-4xl font-bold text-white">$20</span>
            <span className="text-gray-400">/6 months</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Only about $3.3/month (Save 33%)
          </p>

          <ul className="space-y-3 mb-8 flex-1 text-gray-300">
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" /> 2000
              Tokens per day
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" /> Highest
              priority queue
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" /> Support
              24/7 & Early Access
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" /> Keep
              all image history
            </li>
          </ul>

          <button
            type="button"
            onClick={() => handleSubscribe("6_MONTHS")}
            disabled={!!loadingPlan}
            className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-700 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-orange-900/50 flex justify-center items-center"
          >
            {loadingPlan === "6_MONTHS" ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Upgrade Now ($20)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
