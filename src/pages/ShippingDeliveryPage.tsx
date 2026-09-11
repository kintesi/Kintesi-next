import React from 'react';
import {
  Truck,
  ShieldCheck,
  MapPin,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageSquare,
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
            <span>Nationwide Courier Delivery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Shipping & Delivery Policy
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Everything you need to know about our delivery coverage, shipping charges, and verified courier partners across Bangladesh.
          </p>
        </div>

        {/* Coverage & Shipping Charges Cards (No unrealistic time promises) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">City Area</span>
              <h3 className="font-bold text-base text-gray-900 mt-0.5">Inside Dhaka</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Covers all zones within Dhaka metropolitan area. Quick dispatch directly to your doorstep.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-baseline justify-between">
              <span className="text-xs text-gray-500 font-medium">Delivery Charge</span>
              <span className="text-2xl font-black text-rose-600">৳60</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Suburban Area</span>
              <h3 className="font-bold text-base text-gray-900 mt-0.5">Dhaka Suburbs</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Covers Savar, Gazipur, Narayanganj, Tongi, Keraniganj and surrounding adjacent zones.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-baseline justify-between">
              <span className="text-xs text-gray-500 font-medium">Delivery Charge</span>
              <span className="text-2xl font-black text-amber-600">৳100</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">All 64 Districts</span>
              <h3 className="font-bold text-base text-gray-900 mt-0.5">Outside Dhaka</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Nationwide coverage across all divisional cities, zilas, and upazilas via partner couriers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-baseline justify-between">
              <span className="text-xs text-gray-500 font-medium">Delivery Charge</span>
              <span className="text-2xl font-black text-blue-600">৳120</span>
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-8 mb-10">
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900">Order Dispatch & Realistic Delivery</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              অর্ডার কনফার্ম করার পর আমরা দ্রুততম সময়ে পার্সেল প্রস্তুত করে কুরিয়ারে হস্তান্তর করি। বাংলাদেশে ট্রাফিক অবস্থা, আবহাওয়া এবং কুরিয়ার হাবের প্রসেসিংয়ের ওপর নির্ভর করে ডেলিভারি সময় নির্ধারিত হয়। তাই কোনো নির্দিষ্ট ফিক্সড সময়ের নিশ্চয়তা দেওয়া হয় না, তবে পার্সেলটি যথাসম্ভব দ্রুত আপনার ঠিকানায় পৌঁছাতে কুরিয়ার টিম কাজ করে।
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900">Delivery Partners & Live Tracking</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              We partner with trusted courier services including Steadfast Courier, Pathao Logistics, and RedX. As soon as your order is dispatched, you will receive an SMS with your Consignment Tracking Code to monitor the live courier transit progress at any time.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <PackageCheck className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <h2 className="text-lg font-bold text-gray-900">Open-Box Inspection on Delivery</h2>
            </div>
            <p className="text-xs leading-relaxed text-gray-600">
              গ্রাহকের শতভাগ সন্তুষ্টি নিশ্চিত করতে ডেলিভারিম্যানের সামনেই পার্সেল খুলে প্রোডাক্টটি মিলিয়ে নেওয়ার সুযোগ রয়েছে। কোনো সমস্যা বা ত্রুটি পরিলক্ষিত হলে তৎক্ষণাৎ ডেলিভারিম্যানকে অবহিত করে পার্সেল রিটার্ন করতে পারবেন।
            </p>
          </section>

          {/* Direct Assistance Banner */}
          <section className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">Need Delivery Assistance?</h4>
                <p className="text-[11px] leading-relaxed text-rose-700 mt-0.5">
                  Call our helpline or message via Live Chat anytime for instant delivery updates.
                </p>
              </div>
            </div>
            <a
              href={`tel:${phone}`}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 flex-shrink-0 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{phone}</span>
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};
