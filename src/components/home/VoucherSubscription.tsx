import React, { useState } from 'react';
import { Mail, Gift, Check, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const VoucherSubscription: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      toast.error('Please enter your email or mobile number');
      return;
    }
    setIsSubscribed(true);
    toast.success('🎉 Voucher code "KINTESI100" unlocked! Use it at checkout.');
  };

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-gray-950 border border-slate-800 p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl">
        
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Heading & Subtitle */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-300 text-[11px] font-black tracking-wide uppercase">
              <Gift className="w-3.5 h-3.5 text-rose-400" />
              <span>৳100 OFF VOUCHER</span>
            </div>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
              Subscribe for Secret Deals & Vouchers
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed max-w-xl">
              Get notified first whenever limited quantity tech gadgets and seasonal fashion arrivals drop.
            </p>
          </div>

          {/* Right Column: Input Box & Button */}
          <div className="lg:col-span-5">
            {isSubscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Voucher Unlocked!</h4>
                  <p className="text-[11px] text-emerald-300">
                    Use coupon code <span className="font-mono font-black text-amber-300">KINTESI100</span> at checkout for ৳100 off!
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-1 w-full">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter your mobile or email"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 focus:border-rose-500 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                >
                  <span>Get Voucher</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
