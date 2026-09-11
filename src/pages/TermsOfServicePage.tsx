import React from 'react';
import { FileText, ShieldCheck, Scale, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const TermsOfServicePage: React.FC = () => {
  const { settings } = useSettings();
  const phone = settings?.helplinePhone?.trim() || '01902593390';
  const email = settings?.supportEmail?.trim() || 'support@kintesi.com';

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold mb-4">
            <Scale className="w-3.5 h-3.5 text-rose-500" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Please review the terms and legal conditions governing your use of Kintesi’s website and services.
          </p>
          <p className="text-xs text-gray-400 mt-1">Last Updated: September 2026</p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-10 space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">1</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, or making purchases on Kintesi ("Platform", "we", "us"), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service and all applicable laws of the People’s Republic of Bangladesh. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">2</span>
              <span>Account Registration & Eligibility</span>
            </h2>
            <p>
              To access certain features, you may be required to register an account using a valid email address or phone number. You are solely responsible for maintaining the confidentiality of your credentials. You agree that all registration information you provide is true, accurate, and up to date.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">3</span>
              <span>Product Pricing & Availability</span>
            </h2>
            <p>
              All prices listed on Kintesi are in Bangladeshi Taka (BDT ৳) and inclusive of applicable government VAT unless explicitly stated. While we make every effort to display accurate specifications and pricing, errors may occur. In the event of a pricing or stock error, Kintesi reserves the right to cancel or decline the affected order and issue an immediate refund.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">4</span>
              <span>Order Acceptance & Cancellations</span>
            </h2>
            <p>
              Receipt of an order confirmation does not signify our final acceptance of your order. Kintesi reserves the right to accept or decline your order at any time for reasons including inventory unavailability, suspicion of fraud, courier delivery constraints, or non-verification of delivery phone numbers.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">5</span>
              <span>Payment & Fraud Prevention</span>
            </h2>
            <p>
              We support Cash on Delivery (COD), bKash, Nagad, Rocket, and major credit/debit cards. Repeated refusal of Cash on Delivery orders upon delivery without a legitimate reason may result in temporary or permanent suspension of your account and restriction to prepaid orders only.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">6</span>
              <span>Intellectual Property</span>
            </h2>
            <p>
              All trademarks, logos, texts, graphics, user interfaces, visual design, and code on Kintesi are owned or licensed by Kintesi and protected under international copyright and intellectual property laws. Unauthorized reproduction, modification, or distribution is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">7</span>
              <span>Governing Law & Jurisdiction</span>
            </h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of Bangladesh. Any dispute arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Contacting Us</h3>
            <p className="text-xs text-gray-500">
              For any questions regarding these Terms, please contact us at{' '}
              <a href={`mailto:${email}`} className="text-rose-600 font-semibold underline">
                {email}
              </a>{' '}
              or call{' '}
              <a href={`tel:${phone}`} className="text-rose-600 font-semibold underline">
                {phone}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
