import React from 'react';
import { Truck, ShieldCheck, RotateCcw, MessageCircle } from 'lucide-react';

export const TrustFeaturesBar: React.FC = () => {
  const features = [
    {
      icon: Truck,
      title: '64 Districts Covered',
      subtitle: 'Express doorstep reach with COD',
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine',
      subtitle: 'Official warranty verification',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: RotateCcw,
      title: '7-Day Free Replacement',
      subtitle: 'Simple hassle-free claim procedure',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp 24/7 Care',
      subtitle: 'Instant live executive support',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {features.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-rose-200 transition-all flex items-center gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug truncate">
                  {item.title}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-relaxed truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
