import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  Truck,
  RotateCcw,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  // Orders
  {
    category: 'orders',
    question: 'How do I track my order status?',
    answer:
      'You can easily track your order by visiting the "My Orders" page from your profile menu or clicking "Track Order" in the footer. You can also view live courier tracking updates sent directly to your phone via SMS.',
  },
  {
    category: 'orders',
    question: 'Can I cancel or modify an order after placing it?',
    answer:
      'Yes, you can cancel or modify your order while it is in the "Pending" status before dispatch. Once the parcel is handed over to the courier, it cannot be modified, but you can inspect and refuse/exchange it upon delivery.',
  },
  {
    category: 'orders',
    question: 'Do I need an account to place an order?',
    answer:
      'No! You can place orders as a guest with just your name, phone number, and delivery address. However, creating an account helps you track past orders, save multiple delivery addresses, and earn special reward discounts.',
  },

  // Payments
  {
    category: 'payment',
    question: 'What payment methods does Kintesi accept?',
    answer:
      'We accept Cash on Delivery (COD) across all 64 districts in Bangladesh, as well as digital payments via bKash, Nagad, DBBL Rocket, Visa, and Mastercard debit/credit cards.',
  },
  {
    category: 'payment',
    question: 'Is Cash on Delivery (COD) available everywhere in Bangladesh?',
    answer:
      'Yes! We provide 100% Cash on Delivery coverage to all 64 districts, divisional cities, and upazilas through our verified courier network.',
  },
  {
    category: 'payment',
    question: 'Are my online payment details safe?',
    answer:
      'Absolutely. All electronic payments are processed through encrypted 256-bit SSL secured payment gateways. Kintesi never stores your debit/credit card PIN or mobile banking secret codes.',
  },

  // Shipping
  {
    category: 'shipping',
    question: 'How is delivery handled across Bangladesh?',
    answer:
      'We partner with Bangladesh’s leading courier networks (Steadfast, Pathao, RedX). Since exact transit times vary due to road traffic and regional courier schedules, we avoid unrealistic hour promises. However, orders are dispatched promptly, and an SMS with a live tracking code is provided to monitor delivery progress.',
  },
  {
    category: 'shipping',
    question: 'What are the delivery charges?',
    answer:
      'Standard delivery charge inside Dhaka is ৳60, Dhaka suburbs ৳100, and outside Dhaka across all districts is ৳120.',
  },
  {
    category: 'shipping',
    question: 'Can I inspect the parcel before paying the courier?',
    answer:
      'Yes! You are fully allowed to inspect the outer packaging and verify the parcel content in front of the delivery agent before completing cash handover.',
  },

  // Returns
  {
    category: 'returns',
    question: 'What is Kintesi’s return and refund policy?',
    answer:
      'We offer a 7-day easy return policy. If the item you received is defective, damaged, or significantly different from the product description, you can request an exchange or 100% full refund.',
  },
  {
    category: 'returns',
    question: 'How quickly will I receive my refund?',
    answer:
      'Once our quality team inspects the returned item, mobile banking refunds (bKash/Nagad/Rocket) are processed within 24 to 48 hours. Card refunds reflect in 5 to 7 business days.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'orders', label: 'Orders & Tracking', icon: ShoppingBag },
  { id: 'payment', label: 'Payment & COD', icon: CreditCard },
  { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
  { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
];

export const HelpCenterPage: React.FC = () => {
  const { settings } = useSettings();
  const phone = settings?.helplinePhone?.trim() || '01902593390';

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Kintesi Customer Assistance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-sm text-gray-500 mt-3">
            Search our knowledge base for answers regarding orders, payments, delivery coverage, and return policies.
          </p>

          {/* Search Bar */}
          <div className="relative mt-6 max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords: delivery, bKash, refund, order status..."
              className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-rose-100 shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-rose-50/50 hover:text-rose-600 border border-gray-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQs Accordion */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 sm:p-8 mb-12">
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-white hover:bg-gray-50/60 transition"
                    >
                      <span className="font-bold text-sm text-gray-900 pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-rose-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs leading-relaxed text-gray-600 bg-white border-t border-gray-50">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-gray-800">No results found</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Try adjusting your search terms or select another category above.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support Cards (Phone & Live Chat only - No non-existent email) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Phone & Helpline Support</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Reach our customer care team directly via call or message for instant order and delivery inquiries.
              </p>
            </div>
            <a
              href={`tel:${phone}`}
              className="mt-6 inline-flex items-center justify-between p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold transition border border-rose-100"
            >
              <span className="text-sm font-black">{phone}</span>
              <div className="flex items-center gap-1 text-xs">
                <span>Call Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900">Live Customer Chat</h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Chat in real time with our support desk right here on the website for immediate responses.
              </p>
            </div>
            <div className="mt-6 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-800">Support Desk Active</span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">9 AM - 11 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
