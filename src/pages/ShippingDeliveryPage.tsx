import React from 'react';
import {
  Truck,
  Clock,
  ShieldCheck,
  MapPin,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const ShippingDeliveryPage: React.FC = () => {
  const { settings } = useSettings();
  const phone = settings?.helplinePhone?.trim() || '01902593390';

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold mb-4">
            <Truck className="w-3.5 h-3.5 text-rose-500" />
            <span>Fast & Reliable Nationwide Delivery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Shipping & Delivery Policy
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Everything you need to know about our delivery timelines, charges, coverage, and courier partners across Bangladesh.
          </p>
        </div>

        {/* Timelines Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Inside Dhaka</h3>
            <p className="text-2xl font-black text-rose-600 mt-1">24 - 48 Hours</p>
            <p className="text-xs text-gray-500 mt-2">
              Standard delivery inside Dhaka metropolitan area. Same-day dispatch for orders confirmed before 12 PM.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-700">
              Delivery Fee: <span className="text-rose-600 font-bold">৳60</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Dhaka Suburbs</h3>
            <p className="text-2xl font-black text-amber-600 mt-1">48 - 72 Hours</p>
            <p className="text-xs text-gray-500 mt-2">
              Covers Savar, Gazipur, Narayanganj, Tongi, Keraniganj and surrounding adjacent areas.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-700">
              Delivery Fee: <span className="text-amber-600 font-bold">৳100</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Outside Dhaka</h3>
            <p className="text-2xl font-black text-blue-600 mt-1">3 - 5 Days</p>
            <p className="text-xs text-gray-500 mt-2">
              All 64 districts, divisional cities, zilas, and upazilas across Bangladesh via top courier networks.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs font-semibold text-gray-700">
              Delivery Fee: <span className="text-blue-600 font-bold">৳120</span>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-8 mb-10">
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900">Order Verification & Dispatch</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              After placing an order on Kintesi, our support team will promptly verify your order and shipping address via phone call or SMS if required. Once confirmed, your item is carefully packed with protective cushioning and handed over to our courier partner.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <PackageCheck className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900">Open-Box Inspection on Delivery</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              To guarantee total peace of mind, customers are allowed to open the outer courier parcel in front of the delivery agent to ensure the ordered item and color match before completing cash payment. If there is any visible defect, you can decline the parcel on the spot without hassle.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900">Delivery Partners & Tracking</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              We partner with Bangladesh’s leading logistics providers including Steadfast Courier, Pathao Logistics, RedX, and Paperfly. Once dispatched, you will receive an SMS containing your tracking consignment number to follow live progress.
            </p>
          </section>

          <section className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">Special Weather & Holiday Delays</h4>
                <p className="text-[11px] leading-relaxed text-rose-700 mt-1">
                  During official national holidays, Eid festivals, severe adverse weather or regional political hartals, courier transit might experience an additional 24–48 hours delay. Our customer care hotline ({phone}) is always available to assist.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
