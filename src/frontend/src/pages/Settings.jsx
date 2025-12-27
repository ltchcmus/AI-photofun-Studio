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
  const isPremium = isPremiumOneMonth || isPremiumSixMonths || Boolean(user?.isPremium || user?.premium);

  // Xác định tên gói hiện tại
  const currentPlanName = useMemo(() => {
    if (isPremiumSixMonths) return "Premium 6 tháng";
    if (isPremiumOneMonth) return "Premium 1 tháng";
    if (isPremium) return "Premium";
    return "Free";
  }, [isPremiumOneMonth, isPremiumSixMonths, isPremium]);

  const tokenBalance = user?.tokens ?? 0;
  const dailyLimit = isPremium ? 500 : 200; // Premium có giới hạn cao hơn
  const tokenUsagePercent = dailyLimit ? Math.min(tokenBalance / dailyLimit, 1) * 100 : 0;

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
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium border ${googleLinked
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
                  }`}
              >
                Google — {googleLinked ? "Đã liên kết" : "Chưa liên kết"}
              </span>
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
                onClick={() => alert("Tính năng này chưa được hỗ trợ")}
                className="px-4 py-2 rounded-lg border border-red-200 text-sm font-semibold text-red-600 hover:bg-white"
              >
                Xóa tài khoản
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
              Gói dịch vụ Premium
            </h2>
            <p className="text-sm text-gray-500">
              Thông tin gói Premium hiện tại của bạn.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-yellow-200 rounded-xl p-5 space-y-4 bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Gói hiện tại</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                      {currentPlanName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      {isPremiumSixMonths ? "6 THÁNG" : isPremiumOneMonth ? "1 THÁNG" : "PRO"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {isPremiumSixMonths
                  ? "Bạn đang sử dụng gói Premium 6 tháng với đầy đủ tính năng cao cấp."
                  : isPremiumOneMonth
                    ? "Bạn đang sử dụng gói Premium 1 tháng với đầy đủ tính năng cao cấp."
                    : "Bạn đang mở khóa toàn bộ bộ công cụ cao cấp."}
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm text-gray-500">Số dư token trong tháng</p>
                  <h3 className="text-3xl font-bold">
                    {tokenBalance}
                    <span className="text-base font-normal text-gray-500 ml-2">
                      token
                    </span>
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ShieldCheck className="w-4 h-4" />
                Token sẽ được làm mới vào ngày đầu tiên tháng sau.
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Settings;
