import React from 'react';

// 1. Exact bKash Official Logo
export const BkashLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <img
    src="/payment/bkash.png"
    alt="bKash"
    className={`${className} object-contain`}
  />
);

// 2. Exact Nagad Official Logo
export const NagadLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <img
    src="/payment/nagad.png"
    alt="Nagad"
    className={`${className} object-contain`}
  />
);

// 3. Exact DBBL Rocket Official Logo
export const RocketLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <img
    src="/payment/rocket.png"
    alt="Rocket"
    className={`${className} object-contain`}
  />
);

// 4. Exact Visa Official Logo
export const VisaLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <img
    src="/payment/visa.png"
    alt="Visa"
    className={`${className} object-contain`}
  />
);

// 5. Exact Mastercard Official Logo
export const MastercardLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <img
    src="/payment/mastercard.png"
    alt="Mastercard"
    className={`${className} object-contain`}
  />
);

// 6. Official Cash on Delivery (COD) Badge
export const CodLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <div className={`px-2.5 py-1 bg-emerald-800 text-white rounded-lg flex items-center justify-center font-black text-[10px] uppercase tracking-wider ${className}`}>
    <span>৳ COD Available</span>
  </div>
);
