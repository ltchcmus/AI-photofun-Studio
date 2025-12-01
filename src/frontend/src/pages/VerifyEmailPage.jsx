import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { userApi } from "../api/userApi";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleActivate = async (event) => {
    event?.preventDefault();
    if (!verificationCode.trim()) {
      toast.error("Vui lòng nhập mã xác thực");
      return;
    }

    setLoading(true);
    try {
      await userApi.activateProfile(verificationCode.trim());
      toast.success("Xác thực email thành công. Vui lòng đăng nhập.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể xác thực tài khoản";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await userApi.resendVerification();
      toast.success("Đã gửi lại mã xác thực tới email của bạn");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể gửi lại mã xác thực";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl px-10 py-12">
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-400">
              STEP 2 / 2
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Xác minh email
            </h1>
            <p className="text-sm text-gray-500 mt-3">
              Mở hộp thư của bạn và nhập mã gồm 6 ký tự để kích hoạt tài khoản
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Mã xác thực
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="Nhập mã gồm 6 ký tự"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl text-center text-xl tracking-widest uppercase text-gray-800 focus:border-black focus:ring-4 focus:ring-black/10 transition-all"
                maxLength={6}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl text-base font-semibold text-white transition-all ${
                loading ? "bg-gray-800/60 cursor-not-allowed" : "bg-black"
              }`}
            >
              {loading ? "Đang kích hoạt..." : "Kích hoạt tài khoản"}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <p className="text-sm text-gray-500">Không nhận được mã?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className={`w-full py-3.5 border-2 rounded-2xl font-semibold transition-all ${
                resending
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-900 text-gray-900 hover:bg-gray-50"
              }`}
            >
              {resending ? "Đang gửi lại..." : "Gửi lại mã xác thực"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
