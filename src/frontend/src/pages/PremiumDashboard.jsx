import React from "react";
import { useOutletContext } from "react-router-dom";
import { Sparkles, ShieldCheck, Star } from "lucide-react";

const perks = [
  {
    id: "priority",
    icon: ShieldCheck,
    title: "Priority Rendering",
    description: "Premium queues process your AI jobs up to 5x faster.",
  },
  {
    id: "quality",
    icon: Sparkles,
    title: "Ultra Quality",
    description: "Unlock the highest fidelity models and HD downloads.",
  },
  {
    id: "support",
    icon: Star,
    title: "Concierge Support",
    description: "Get 24/7 help from our creative success team.",
  },
];

const PremiumDashboard = () => {
  const { user } = useOutletContext() ?? {};

  return (
    <div className="space-y-8">
      <section className="bg-linear-to-r from-amber-100 via-white to-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-600 font-semibold">
            Premium Access
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">
            {user?.username
              ? `${user.username}, your creative limit does not exist.`
              : "Create without limits."}
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Explore exclusive tools, enhanced rendering quality, and priority
          support tailored for professional creators.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {perks.map((perk) => (
          <div
            key={perk.id}
            className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm"
          >
            <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <perk.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{perk.title}</h3>
            <p className="text-sm text-gray-600">{perk.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default PremiumDashboard;
