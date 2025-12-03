import React, { useState, useEffect } from "react";
import {
  Mail,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { userApi } from "../api/userApi";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // State cho bộ đếm ngược gửi lại mã
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Email người dùng (Có thể lấy từ context hoặc localStorage nếu cần, tạm thời để text chung)
  // const userEmail = "your-email@example.com";

  // Xử lý đếm ngược
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Xử lý nhập mã (Chỉ cho phép nhập số, tối đa 6 ký tự)
  const handleInputChange = (e) => {
    // Chỉ lấy số
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length <= 6) {
      setCode(value);
      setError(""); // Xóa lỗi khi người dùng bắt đầu nhập lại
    }
  };

  // Xử lý nút Xác thực
  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số.");
      return;
    }

    setLoading(true);
    try {
      await userApi.activateProfile(code);

      setSuccess(true);
      toast.success("Xác thực email thành công!");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Mã xác thực không đúng. Vui lòng thử lại.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Gửi lại mã
  const handleResend = async () => {
    if (!canResend) return;

    try {
      await userApi.resendVerification();
      toast.success("Đã gửi lại mã xác thực mới đến email của bạn");

      // Reset timer
      setTimer(60);
      setCanResend(false);
      setCode("");
      setError("");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể gửi lại mã xác thực";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100 animate-in fade-in zoom-in duration-300">
        {/* Icon Email - Có hiệu ứng chuyển đổi trạng thái */}
        <div
          className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 relative transition-colors duration-500 ${
            success ? "bg-green-100" : "bg-blue-100"
          }`}
        >
          {success ? (
            <CheckCircle className="h-10 w-10 text-green-600 animate-in zoom-in spin-in-90 duration-300" />
          ) : (
            <Mail className="h-10 w-10 text-blue-600" />
          )}

          {/* Badge check nhỏ khi chưa success hoàn toàn nhưng đang ở trạng thái thường */}
          {!success && (
            <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
              <div className="bg-orange-400 rounded-full w-3 h-3 animate-pulse"></div>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Xác thực Email
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Chúng tôi đã gửi một mã xác thực 6 số đến email của bạn. <br />
          Vui lòng kiểm tra hộp thư đến.
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* Ô nhập mã - Style letter-spacing rộng */}
          <div className="relative group">
            <input
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="000000"
              className={`w-full text-center text-4xl font-bold tracking-[0.5em] py-4 border-2 rounded-xl focus:outline-none transition-all font-mono
                ${
                  error
                    ? "border-red-300 bg-red-50 text-red-600 focus:border-red-500 placeholder-red-200"
                    : success
                    ? "border-green-300 bg-green-50 text-green-600"
                    : "border-gray-200 bg-gray-50 text-gray-800 focus:border-blue-500 focus:bg-white placeholder-gray-200 hover:border-blue-300"
                }
              `}
              disabled={loading || success}
              autoFocus
              maxLength={6}
            />
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-red-500 text-sm mt-3 animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6 || success}
            className={`w-full font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
              ${
                success
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-green-200"
                  : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none text-white shadow-blue-200"
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xác thực...
              </>
            ) : success ? (
              "Xác thực thành công!"
            ) : (
              "Xác nhận"
            )}
            {!loading && !success && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Khu vực Gửi lại mã */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Bạn chưa nhận được mã?</p>

          <button
            onClick={handleResend}
            disabled={!canResend}
            className={`flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors p-2 rounded-lg
              ${
                canResend
                  ? "text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <RotateCcw
              className={`w-4 h-4 ${
                !canResend && "animate-spin-slow opacity-50"
              }`}
            />
            {canResend ? "Gửi lại mã ngay" : `Gửi lại sau ${timer}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
