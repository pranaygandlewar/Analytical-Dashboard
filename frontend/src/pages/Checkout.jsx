import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import api from "../services/api";
import toast from "react-hot-toast";
import { 
  CreditCard, 
  ArrowLeft, 
  CheckCircle, 
  QrCode, 
  Copy, 
  Download, 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  Smartphone,
  RefreshCw,
  FileCheck
} from "lucide-react";

const PLAN_DETAILS = {
  Free: { name: "Free", price: 0, monthly: 0, yearly: 0 },
  Pro: { name: "Pro", price: 499, monthly: 499, yearly: 4999 },
  Business: { name: "Business", price: 999, monthly: 999, yearly: 9999 },
  Enterprise: { name: "Enterprise", price: 2499, monthly: 2499, yearly: 24999 }
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const plan = searchParams.get("plan") || "Pro";
  const cycle = searchParams.get("cycle") || "monthly";

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const planDetail = PLAN_DETAILS[plan] || PLAN_DETAILS.Pro;
  const originalPrice = cycle === "monthly" ? planDetail.monthly : planDetail.yearly;
  const gst = Math.floor(originalPrice * 0.18);
  const totalAmount = originalPrice + gst;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("teampulse@upi");
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setScreenshot(file);
      setScreenshotName(file.name);
      toast.success("Payment screenshot uploaded!");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotName(file.name);
      toast.success("Payment screenshot uploaded!");
    }
  };

  const handleDownloadQr = () => {
    // Simulated QR download
    const link = document.createElement("a");
    link.href = "/logo.png";
    link.download = "teampulse-upi-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("UPI QR Code downloaded!");
  };

  const handleOpenUpiApp = (app) => {
    toast.success(`Opening ${app} on your mobile device...`);
  };

  const handleCompletePayment = async () => {
    if (!screenshot) {
      toast.error("Please upload the payment transaction screenshot to complete checkout verification.");
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing for 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const payload = {
        plan,
        billing_cycle: cycle,
        provider: "demo_upi_sandbox"
      };

      const res = await api.post("/subscription/verify", payload);

      if (res.data.success) {
        toast.success("Demo UPI Payment verified successfully!");
        // Refresh Zustand Auth store user details to immediately unlock pages
        await checkAuth();
        navigate(
          `/payment-success?order_id=${res.data.order_id}&plan=${res.data.plan}&invoice=${res.data.invoice_number}&date=${res.data.payment_date}&amount=${totalAmount}`
        );
      } else {
        toast.error(res.data.message || "Simulated payment verification failed.");
        navigate(`/payment-failed?error=simulated_decline`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong during demo payment checkout.");
      navigate(`/payment-failed?error=server_error`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Background gradients */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/5 blur-3xl rounded-full pointer-events-none" />

      {/* Main card */}
      <div className="max-w-4xl mx-auto bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-slate-850 rounded-[40px] shadow-2xl p-8 md:p-12 relative z-10">
        
        {/* Back button */}
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center gap-2 text-slate-450 hover:text-slate-800 dark:hover:text-white text-xs font-bold transition mb-8 uppercase tracking-wider"
        >
          <ArrowLeft size={16} />
          Back to Plans
        </button>

        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border dark:border-indigo-900/50">
              <RefreshCw size={32} className="animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Simulating Payment Processing</h2>
              <p className="text-sm text-slate-450 font-semibold max-w-sm mx-auto">
                Verifying transaction signature checkpoints over UPI networks. Please do not close or reload this browser tab...
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-10">
            
            {/* Left Column: Invoice summary */}
            <div className="space-y-8 pr-0 md:pr-6 border-r border-slate-100 dark:border-slate-850">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4 shadow-sm">
                  <Sparkles size={10} />
                  <span>SaaS Billing Session</span>
                </span>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Checkout Invoice
                </h1>
                <p className="text-slate-450 font-bold text-xs mt-1.5 uppercase tracking-wide">
                  Review subscription fees and finalize payment
                </p>
              </div>

              {/* Price card */}
              <div className="bg-slate-50 dark:bg-slate-950/50 border dark:border-slate-850 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-slate-850">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">TeamPulse {planDetail.name} Plan</h3>
                    <span className="text-xs text-slate-400 font-semibold uppercase">{cycle} billing cycle</span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ₹{originalPrice}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm font-medium">
                  <div className="flex justify-between text-slate-450">
                    <span>Subtotal</span>
                    <span>₹{originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-450">
                    <span>GST (18%)</span>
                    <span>₹{gst}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 dark:text-white font-extrabold pt-2 text-base">
                    <span>Total Amount</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="space-y-3.5 text-xs text-slate-450 dark:text-slate-500 font-semibold">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Encrypted SSL 256-bit secure checkout server</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-indigo-500" />
                  <span>Instant plan activation and premium access unlock</span>
                </div>
              </div>
            </div>

            {/* Right Column: Demo UPI payment details */}
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Scan & Pay via UPI</h2>
                <p className="text-xs text-slate-450 font-bold mt-1 uppercase tracking-wide">
                  Complete mock payment transfer using any UPI app
                </p>
              </div>

              {/* QR Code Card */}
              <div className="bg-slate-50 dark:bg-slate-950/50 border dark:border-slate-850 rounded-[32px] p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                  {/* Generated clean SVG QR placeholder vector */}
                  <svg className="w-40 h-40" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" />
                    {/* QR Anchors */}
                    <rect x="5" y="5" width="25" height="25" fill="#0b132b" />
                    <rect x="10" y="10" width="15" height="15" fill="white" />
                    <rect x="12" y="12" width="11" height="11" fill="#4f46e5" />
                    
                    <rect x="70" y="5" width="25" height="25" fill="#0b132b" />
                    <rect x="75" y="10" width="15" height="15" fill="white" />
                    <rect x="77" y="12" width="11" height="11" fill="#4f46e5" />

                    <rect x="5" y="70" width="25" height="25" fill="#0b132b" />
                    <rect x="10" y="75" width="15" height="15" fill="white" />
                    <rect x="12" y="77" width="11" height="11" fill="#4f46e5" />

                    {/* QR Inner noise dots */}
                    <rect x="35" y="15" width="10" height="5" fill="#0b132b" />
                    <rect x="55" y="10" width="5" height="15" fill="#4f46e5" />
                    <rect x="40" y="30" width="15" height="10" fill="#0b132b" />
                    <rect x="15" y="45" width="10" height="10" fill="#4f46e5" />
                    <rect x="70" y="40" width="15" height="5" fill="#0b132b" />
                    <rect x="80" y="50" width="10" height="15" fill="#4f46e5" />
                    
                    <rect x="35" y="65" width="25" height="5" fill="#0b132b" />
                    <rect x="45" y="75" width="5" height="15" fill="#4f46e5" />
                    <rect x="70" y="75" width="10" height="10" fill="#0b132b" />
                    <rect x="65" y="85" width="5" height="5" fill="#4f46e5" />
                  </svg>
                </div>

                {/* UPI Details */}
                <div className="space-y-3 w-full">
                  <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-450 font-bold uppercase font-mono">teampulse@upi</span>
                    <button 
                      onClick={handleCopyUpi} 
                      className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg transition"
                    >
                      <Copy size={12} />
                      {copied ? "Copied" : "Copy ID"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleDownloadQr} 
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 dark:text-white rounded-xl text-xs font-bold transition"
                    >
                      <Download size={14} />
                      Download QR
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Quick Pay Triggers (UPI Apps list) */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Fast Mobile Checkout</span>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { name: "GPay", icon: Smartphone },
                    { name: "PhonePe", icon: Smartphone },
                    { name: "Paytm", icon: Smartphone },
                    { name: "BHIM", icon: Smartphone }
                  ].map((app) => (
                    <button
                      key={app.name}
                      onClick={() => handleOpenUpiApp(app.name)}
                      className="flex flex-col items-center justify-center p-2.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900 border dark:border-slate-850 rounded-2xl transition"
                    >
                      <app.icon size={16} className="text-slate-450 dark:text-slate-500 mb-1" />
                      <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drag and drop payment confirmation screenshot upload */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Confirm Payment Transfer</span>
                <div 
                  onDragEnter={handleDrag} 
                  onDragOver={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center transition flex flex-col items-center justify-center ${
                    dragActive 
                      ? "border-indigo-600 bg-indigo-500/5" 
                      : screenshot 
                        ? "border-emerald-500 bg-emerald-500/5" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-350"
                  }`}
                >
                  {screenshot ? (
                    <>
                      <FileCheck size={36} className="text-emerald-500 mb-2" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{screenshotName}</span>
                      <button 
                        onClick={() => { setScreenshot(null); setScreenshotName(""); }} 
                        className="text-[9px] font-bold uppercase text-red-500 hover:underline mt-2"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={36} className="text-slate-400 mb-2" />
                      <span className="text-xs font-semibold text-slate-500">Drag and drop screenshots here or</span>
                      <label className="mt-2 inline-flex py-1.5 px-3 bg-white dark:bg-slate-900 border dark:border-slate-800 hover:bg-slate-50 text-[10px] font-black uppercase rounded-lg cursor-pointer transition">
                        Browse files
                        <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Action checkout verify button */}
              <button
                onClick={handleCompletePayment}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-3xl font-black text-sm transition shadow-lg shadow-indigo-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Complete Demo Payment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
