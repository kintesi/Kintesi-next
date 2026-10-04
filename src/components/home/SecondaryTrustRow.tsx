import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export const SecondaryTrustRow: React.FC = () => {
  const items = [
    {
      icon: Truck,
      title: 'Fast & Safe Delivery',
      desc: 'Express doorstep delivery 64 districts',
    },
    {
      icon: ShieldCheck,
      title: '100% Genuine Products',
      desc: 'Authentic items with warranty',
    },
    {
      icon: RotateCcw,
      title: '7-Day Easy Return',
      desc: 'Hassle-free replacement policy',
    },
    {
      icon: Headphones,
      title: '24/7 Dedicated Support',
      desc: 'Always here to help you',
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4">
      <div className="rounded-2xl bg-white border border-gray-100 p-4 sm:p-5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-black text-gray-900 truncate">{item.title}</h5>
                <p className="text-[10px] text-gray-400 font-medium truncate">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
