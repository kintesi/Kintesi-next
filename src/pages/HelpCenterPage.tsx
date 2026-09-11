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
  Mail,
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
      'You can easily track your order by visiting the "My Orders" page from your profile menu or clicking "Track Order" in the footer. You can also view live delivery timeline updates sent to your phone and email.',
  },
  {
    category: 'orders',
    question: 'Can I cancel or modify an order after placing it?',
    answer:
      'Yes, you can cancel or modify your order while it is in the "Pending" status before dispatch. Once the parcel is shipped with our courier partner, it cannot be edited, but you can request an easy exchange or return upon delivery.',
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
    question: 'How long does delivery take inside and outside Dhaka?',
    answer:
      'Inside Dhaka city, deliveries typically arrive within 24 to 48 hours. For locations outside Dhaka and other districts, standard delivery takes 3 to 5 business days.',
  },
  {
    category: 'shipping',
    question: 'What are the delivery charges?',
    answer:
      'Standard delivery charge inside Dhaka is ৳60, and outside Dhaka is ৳120. Special promotional orders may qualify for free express shipping with coupon codes.',
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
  const email = settings?.supportEmail?.trim() || 'support@kintesi.com';

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
            Search our knowledge base for answers regarding orders, payments, delivery, and return policies.
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

        {/* Contact Support Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Phone Support</h3>
              <p className="text-xs text-gray-500 mt-1">
                Reach our customer care team directly for order inquiries.
              </p>
            </div>
            <a
              href={`tel:${phone}`}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              <span>{phone}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Email Inquiries</h3>
              <p className="text-xs text-gray-500 mt-1">
                Send us detailed queries regarding corporate or bulk orders.
              </p>
            </div>
            <a
              href={`mailto:${email}`}
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700"
            >
              <span>{email}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">Live Customer Chat</h3>
              <p className="text-xs text-gray-500 mt-1">
                Instant answers with our active support agents right here.
              </p>
            </div>
            <div className="mt-5 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Agents Active (9 AM - 11 PM)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
