import React, { useMemo } from "react";
import {
  Coins,
  KeyRound,
  Link2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

const DEFAULT_PLAN = {
  currentPlan: "Free",
  nextPlan: "Premium",
  tokenBalance: 120,
  dailyLimit: 200,
};

const Settings = () => {
  const planInfo = useMemo(() => DEFAULT_PLAN, []);
  const planIsPremium = planInfo.currentPlan?.toLowerCase() === "premium";

  const accountActions = [
    {
      id: "change-password",
      title: "Đổi mật khẩu",
      description: "Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn.",
      actionLabel: "Cập nhật",
      icon: Lock,
    },
    {
      id: "set-email-password",
      title: "Thiết lập mật khẩu cho đăng nhập email",
      description:
        "Tạo mật khẩu khi trước đó bạn chỉ đăng nhập bằng Google hoặc mạng xã hội.",
      actionLabel: "Thiết lập",
      icon: KeyRound,
    },
  ];

  const socialProviders = [
    { id: "google", name: "Google", status: "Đã liên kết" },
    { id: "facebook", name: "Facebook", status: "Chưa liên kết" },
    { id: "apple", name: "Apple", status: "Chưa liên kết" },
  ];

  const tokenUsagePercent = planInfo.dailyLimit
    ? Math.min(planInfo.tokenBalance / planInfo.dailyLimit, 1) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Settings
        </p>
        <h1 className="text-3xl font-bold">Trung tâm thiết lập</h1>
        <p className="text-sm text-gray-500">
          Quản lý thông tin tài khoản, bảo mật và gói dịch vụ của bạn.
        </p>
      </header>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Tài khoản</h2>
          <p className="text-sm text-gray-500">
            Thiết lập bảo mật và quyền kiểm soát cho hồ sơ của bạn.
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
                  className="self-start md:self-auto px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
                  Trạng thái liên kết mạng xã hội
                </h3>
                <p className="text-sm text-gray-500">
                  Đồng bộ các nền tảng bạn đã kết nối để đăng nhập nhanh hơn.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {socialProviders.map((provider) => {
                const isLinked = provider.status === "Đã liên kết";
                return (
                  <span
                    key={provider.id}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                      isLinked
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {provider.name} — {provider.status}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="border border-red-200 rounded-xl p-4 bg-red-50">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-white text-red-500">
                <Trash2 className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700">Xóa tài khoản</h3>
                <p className="text-sm text-red-600">
                  Thao tác này sẽ xóa toàn bộ dữ liệu của bạn. Hành động không
                  thể khôi phục.
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-white"
              >
                Xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Gói dịch vụ</h2>
          <p className="text-sm text-gray-500">
            Theo dõi gói hiện tại và dung lượng token trong ngày.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-gray-100 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-purple-50 text-purple-600">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500">Gói hiện tại</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {planInfo.currentPlan || "Free"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      planIsPremium
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {planIsPremium ? "Premium" : "Free"}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {planIsPremium
                ? "Bạn đang mở khóa toàn bộ bộ công cụ cao cấp."
                : "Nâng cấp để sử dụng không giới hạn và thêm token."}
            </p>
            <button
              type="button"
              className="w-full px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900"
            >
              {planIsPremium ? "Quản lý gói" : "Nâng cấp lên Premium"}
            </button>
          </div>

          <div className="border border-gray-100 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                <Coins className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm text-gray-500">Số dư token trong ngày</p>
                <h3 className="text-3xl font-bold">
                  {planInfo.tokenBalance}
                  <span className="text-base font-normal text-gray-500 ml-2">
                    token
                  </span>
                </h3>
              </div>
            </div>
            <div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${tokenUsagePercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {planInfo.tokenBalance} / {planInfo.dailyLimit} token hôm nay
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="w-4 h-4" />
              Token sẽ được làm mới vào 0h hằng ngày.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
