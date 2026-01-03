import React, { useEffect, useMemo, useState } from "react";
import {
  Coins,
  KeyRound,
  Link2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  Crown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { userApi } from "../api/userApi";

const Settings = () => {
  const { user } = useAuth();

  // Xác định trạng thái premium và loại gói
  const isPremiumOneMonth = Boolean(user?.premiumOneMonth);
  const isPremiumSixMonths = Boolean(user?.premiumSixMonths);
  const isPremium =
    isPremiumOneMonth ||
    isPremiumSixMonths ||
    Boolean(user?.isPremium || user?.premium);

  // Determine current plan name
  const currentPlanName = useMemo(() => {
    if (isPremiumSixMonths) return "Premium 6 Months";
    if (isPremiumOneMonth) return "Premium 1 Month";
    if (isPremium) return "Premium";
    return "Free";
  }, [isPremiumOneMonth, isPremiumSixMonths, isPremium]);

  const tokenBalance = user?.tokens ?? 0;
  const dailyLimit = isPremium ? 500 : 200; // Premium có giới hạn cao hơn
  const tokenUsagePercent = dailyLimit
    ? Math.min(tokenBalance / dailyLimit, 1) * 100
    : 0;

  const accountActions = [
    {
      id: "change-password",
      title: "Change Password",
      description: "Update your password to protect your account.",
      actionLabel: "Update",
      icon: Lock,
    },
    {
      id: "set-email-password",
      title: "Set Email Password",
      description:
        "Create a password when you previously only logged in with Google or social accounts.",
      actionLabel: "Set Up",
      icon: KeyRound,
    },
  ];

  // Trạng thái liên kết Google (dựa vào xác minh email)
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    const checkGoogleLinkStatus = async () => {
      try {
        const response = await userApi.checkVerifyStatus();
        const isVerified = response.data?.result ?? false;
        setGoogleLinked(isVerified);
      } catch (error) {
        console.error("Failed to check Google link status:", error);
        setGoogleLinked(false);
      }
    };
    checkGoogleLinkStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Settings
        </p>
        <h1 className="text-3xl font-bold">Settings Center</h1>
        <p className="text-sm text-gray-500">
          Manage your account information, security, and service plans.
        </p>
      </header>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-gray-500">
            Security settings and controls for your profile.
          </p>
        </div>

        <div className="space-y-4">
          {accountActions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-100 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="p-2 rounded-full bg-gray-50 text-gray-700">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="self-start md:self-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  {item.actionLabel}
                </button>
              </div>
            );
          })}

          <div className="border border-gray-100 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-indigo-50 text-indigo-600">
                <Link2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Social Account Status
                </h3>
                <p className="text-sm text-gray-500">
                  Sync platforms you've connected for faster login.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  googleLinked
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                }`}
              >
                Google — {googleLinked ? "Linked" : "Not linked"}
              </span>
            </div>
          </div>

          <div className="border border-red-200 rounded-xl p-4 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-white text-red-500">
                <Trash2 className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700">Delete Account</h3>
                <p className="text-sm text-red-600">
                  This action will delete all your data. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("This feature is not yet supported")}
                className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-white cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {isPremium && (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Premium Plan
            </h2>
            <p className="text-sm text-gray-500">
              Your current Premium plan information.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-yellow-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Current Plan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      {currentPlanName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      {isPremiumSixMonths
                        ? "6 MONTHS"
                        : isPremiumOneMonth
                        ? "1 MONTH"
                        : "PRO"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {isPremiumSixMonths
                  ? "You are using the 6-month Premium plan with all premium features."
                  : isPremiumOneMonth
                  ? "You are using the 1-month Premium plan with all premium features."
                  : "You have unlocked all premium tools."}
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Monthly Token Balance</p>
                  <h3 className="text-3xl font-bold">
                    {tokenBalance}
                    <span className="text-base font-normal text-gray-500 ml-2">
                      tokens
                    </span>
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4" />
                Tokens will be refreshed on the first day of next month.
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Settings;
