import React from 'react';
import { Shield, Lock, Eye, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const PrivacyPolicyPage: React.FC = () => {
  const { settings } = useSettings();
  const phone = settings?.helplinePhone?.trim() || '01902593390';
  const email = settings?.supportEmail?.trim() || 'support@kintesi.com';

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold mb-4">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>Data Protection & Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Learn how Kintesi collects, safeguards, uses, and respects your personal information when you shop with us.
          </p>
          <p className="text-xs text-gray-400 mt-1">Last Updated: September 2026</p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-10 space-y-8 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">1</span>
              <span>Information We Collect</span>
            </h2>
            <p className="mb-2">When you use Kintesi, we collect information necessary to fulfill your orders and enhance your shopping experience:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Contact & Identity:</strong> Name, delivery address, phone number, and email address.</li>
              <li><strong>Order History:</strong> Products purchased, payment method (COD, bKash, etc.), transaction IDs, and invoice details.</li>
              <li><strong>Device & Browsing:</strong> IP address, device type, browser information, and referral sources to optimize website performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">2</span>
              <span>How We Use Your Information</span>
            </h2>
            <p className="mb-2">We strictly use your data for legitimate e-commerce operations, including:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Processing, packaging, and dispatching your orders.</li>
              <li>Communicating delivery updates, SMS dispatch alerts, and verification calls.</li>
              <li>Providing instant customer support via Live Chat and Helpline.</li>
              <li>Detecting and preventing fraudulent orders and abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">3</span>
              <span>Data Sharing & Third Parties</span>
            </h2>
            <p>
              We <strong>NEVER sell or rent</strong> your personal information to marketing brokers or third parties. We share data solely with trusted service providers necessary for business fulfillment:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2">
              <li><strong>Delivery Couriers:</strong> Name, delivery address, and phone number shared with Steadfast, Pathao, or RedX for shipping.</li>
              <li><strong>Payment Gateways:</strong> Encrypted transaction handshakes with authorized financial service providers (bKash, SSLCommerz).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">4</span>
              <span>Cookies & Local Storage</span>
            </h2>
            <p>
              Kintesi uses cookies and browser local storage to save your cart items, keep you logged in safely, and remember your site preferences. You may disable cookies in your browser settings, though certain shopping features may be affected.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">5</span>
              <span>Security & Data Retention</span>
            </h2>
            <p>
              We implement industry-standard SSL encryption and modern secure database architectures to safeguard your personal data. Customer account records are retained only as long as necessary to comply with tax and legal requirements in Bangladesh.
            </p>
          </section>

          <section>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">6</span>
              <span>Your Privacy Rights</span>
            </h2>
            <p>
              You have the right to review, update, or request deletion of your account and personal records at any time. Simply visit your Profile settings or contact our support team.
            </p>
          </section>

          <section className="pt-4 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-1">Privacy Officer Contact</h3>
            <p className="text-xs text-gray-500">
              For inquiries regarding this privacy policy or personal data inquiries, reach us at{' '}
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
