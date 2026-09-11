import React from 'react';
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Banknote,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const ReturnRefundPage: React.FC = () => {
  const { settings } = useSettings();
  const phone = settings?.helplinePhone?.trim() || '01902593390';

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold mb-4">
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>100% Customer Protection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Return & Refund Policy
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Simple, fair, and transparent 7-day hassle-free return and exchange process for all shoppers on Kintesi.
          </p>
        </div>

        {/* 3-Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-sm flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-sm text-gray-900">Notify Support</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Contact our helpline or message via Live Chat within 7 days of parcel delivery with your Order ID and photo/video of the issue.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-sm flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-sm text-gray-900">Pickup or Drop-off</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Our courier team will collect the parcel directly from your doorstep, or you can drop it at the nearest partner hub.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white font-black text-sm flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-sm text-gray-900">Instant Refund or Exchange</h3>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Upon quick quality inspection, we dispatch a fresh replacement or issue your refund to bKash, Nagad, or Bank card.
            </p>
          </div>
        </div>

        {/* Eligibility Details */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 space-y-8 mb-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Valid Reasons for Return</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Product arrived physically damaged or broken in transit</span>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Wrong item, size, color, or specification delivered</span>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Technical fault or factory defect covered by brand warranty</span>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Incomplete order with missing accessories or components</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Non-Returnable Items</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
              <div className="flex items-start gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>Items with damaged original packaging, removed tags, or missing warranty cards</span>
              </div>
              <div className="flex items-start gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>Personal hygiene items, innerwear, cosmetics that have been opened or unsealed</span>
              </div>
              <div className="flex items-start gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>Perishable food items, grocery items beyond expiry or opened seals</span>
              </div>
              <div className="flex items-start gap-2 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>Items physically abused, burnt, water damaged by user mishandling</span>
              </div>
            </div>
          </div>

          {/* Refund Timelines Table */}
          <div className="pt-6 border-t border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-blue-500" />
              <span>Refund Timelines & Payment Channels</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-100 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Refund Channel</th>
                    <th className="p-3">Processing Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Cash on Delivery (COD)</td>
                    <td className="p-3">bKash / Nagad / Rocket</td>
                    <td className="p-3 text-emerald-600 font-bold">24 - 48 Hours</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">bKash / Nagad Direct</td>
                    <td className="p-3">Original Sending Wallet</td>
                    <td className="p-3 text-emerald-600 font-bold">24 - 48 Hours</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Credit / Debit Card (Visa/Mastercard)</td>
                    <td className="p-3">Original Bank Card Account</td>
                    <td className="p-3">5 - 7 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Assistance footer */}
        <div className="text-center text-xs text-gray-500">
          Need urgent help with an active return? Call our hotline at{' '}
          <a href={`tel:${phone}`} className="font-bold text-rose-600 hover:underline">
            {phone}
          </a>{' '}
          or connect with our support agents instantly via Live Chat.
        </div>
      </div>
    </div>
  );
};
