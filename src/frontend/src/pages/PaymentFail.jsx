import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, XCircle } from "lucide-react";

const PaymentFail = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          The transaction was cancelled or an error occurred during processing. Your
          account has not been charged.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3 px-6 rounded-xl shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <RotateCcw className="h-5 w-5" /> Try Again
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full bg-white text-gray-600 font-medium py-3 px-6 rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" /> Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;
