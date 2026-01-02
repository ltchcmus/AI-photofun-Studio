import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-green-100 animate-in fade-in zoom-in duration-300">
        <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 ring-8 ring-green-50">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>

        <p className="text-gray-500 mb-8 leading-relaxed">
          Thank you! Your account has been upgraded to
          <span className="font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 ml-1">
            Premium
          </span>
          . You can start using the new features right away.
        </p>

        <button
          type="button"
          onClick={() => navigate("/create")}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          Start Creating
          <ArrowRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/home")}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Go back to home
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
