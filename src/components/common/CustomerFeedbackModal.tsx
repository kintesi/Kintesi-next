import React, { useState } from 'react';
import {
  X,
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  submitCustomerFeedback,
  FEEDBACK_CATEGORIES,
  CustomerFeedback,
} from '../../lib/feedbackService';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string;
  initialCategory?: CustomerFeedback['category'];
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber = '',
  initialCategory = 'product_quality',
}) => {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { language } = useLanguage();

  const phone = settings?.helplinePhone?.trim() || '01902593390';
  const cleanPhoneForWhatsApp = phone.replace(/\D/g, '').replace(/^0/, '880');

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<CustomerFeedback['category']>(initialCategory);
  const [orderNumber, setOrderNumber] = useState<string>(initialOrderNumber);
  const [customerName, setCustomerName] = useState<string>(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [customerContact, setCustomerContact] = useState<string>(
    profile?.phone || user?.email || ''
  );
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error(
        language === 'bn'
          ? 'অনুগ্রহ করে আপনার মতামত বা সমস্যার বিবরণ লিখুন।'
          : 'Please describe your feedback or issue.'
      );
      return;
    }

    if (!customerContact.trim()) {
      toast.error(
        language === 'bn'
          ? 'অনুগ্রহ করে যোগাযোগের জন্য মোবাইল নম্বর বা ইমেইল দিন।'
          : 'Please provide your mobile number or email so we can reach you.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitCustomerFeedback({
        customer_name: customerName,
        customer_contact: customerContact,
        category,
        rating,
        comment,
        order_number: orderNumber,
      });

      if (res.success) {
        setIsSubmitted(true);
        toast.success(
          language === 'bn'
            ? 'আপনার মূল্যবান মতামত গ্রহণ করা হয়েছে। ধন্যবাদ!'
            : 'Thank you! Your feedback has been received.'
        );
      }
    } catch {
      toast.error(
        language === 'bn'
          ? 'মতামত পাঠাতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent(
      `Hello Kintesi Support, I have feedback/inquiry regarding ${
        orderNumber ? `Order #${orderNumber}` : 'my shopping experience'
      }: "${comment.slice(0, 100)}"`
    );
    window.open(`https://wa.me/${cleanPhoneForWhatsApp}?text=${text}`, '_blank');
  };

  const ratingDescriptions: Record<number, { en: string; bn: string }> = {
    5: { en: 'Excellent! Loved the experience', bn: 'চমৎকার! দারুণ অভিজ্ঞতা' },
    4: { en: 'Very Good, minor suggestions', bn: 'খুব ভালো, কিছু সাধারণ পরামর্শ' },
    3: { en: 'Average, needs improvement', bn: 'মোটামুটি, আরও উন্নতি প্রয়োজন' },
    2: { en: 'Disappointed with product or service', bn: 'অসন্তুষ্ট, আশানুরূপ নয়' },
    1: { en: 'Very Poor, urgent resolution needed', bn: 'খুবই বাজে, দ্রুত সমাধান চাই' },
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-slide-up max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold mb-1.5 border border-rose-100">
              <Sparkles className="w-3 h-3 text-rose-500" />
              <span>{language === 'bn' ? 'কাস্টমার মতামত ও সহায়তা' : 'Customer Care & Feedback'}</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              {language === 'bn' ? 'আপনার অভিজ্ঞতা আমাদের জানান' : 'Help Us Serve You Better'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'bn'
                ? 'আপনার প্রতিটি অভিযোগ ও পরামর্শ আমাদের সর্বোচ্চ অগ্রাধিকার।'
                : 'Your honest feedback helps us protect quality and solve issues fast.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-gray-900">
                {language === 'bn' ? 'মতামত সফলভাবে জমা হয়েছে!' : 'Feedback Successfully Received!'}
              </h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                {language === 'bn'
                  ? 'আমরা আপনার অভিযোগ/পরামর্শ সতর্কতার সাথে পর্যালোচনা করব। প্রয়োজনে আমাদের টিম সরাসরি যোগাযোগ করবে।'
                  : 'We review every submission carefully. If you reported an issue, our care team will follow up directly.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {language === 'bn' ? 'ঠিক আছে' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Star Rating */}
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 text-center space-y-2">
              <label className="block font-bold text-gray-800 text-[11px] uppercase tracking-wider">
                {language === 'bn' ? 'আপনার সার্বিক রেটিং' : 'How was your experience?'}
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeStar = hoverRating ? star <= hoverRating : star <= rating;
                  return (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform duration-150 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          activeStar
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 stroke-[1.5]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-bold text-gray-600">
                {language === 'bn'
                  ? ratingDescriptions[hoverRating || rating]?.bn
                  : ratingDescriptions[hoverRating || rating]?.en}
              </p>

              {/* Resolution Reassurance if dissatisfied */}
              {(hoverRating || rating) <= 3 && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-left text-rose-800 text-[11px]">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {language === 'bn'
                      ? 'অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত! আপনার বিষয়টি অগ্রাধিকার ভিত্তিতে সমাধান করা হবে।'
                      : 'We sincerely apologize! If you have any issue with an order, our team will resolve it immediately.'}
                  </span>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1.5 text-[10px]">
                {language === 'bn' ? 'মতামতের বিষয় (Category)' : 'Topic / Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-800 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              >
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {language === 'bn' ? cat.label : cat.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Number (Optional) */}
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1.5 text-[10px]">
                {language === 'bn' ? 'অর্ডার নম্বর (যদি থাকে - ঐচ্ছিক)' : 'Order Number (Optional)'}
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. 1024"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1 text-[10px]">
                  {language === 'bn' ? 'আপনার নাম' : 'Your Name'}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1 text-[10px]">
                  {language === 'bn' ? 'মোবাইল বা ইমেইল *' : 'Phone or Email *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="017xxxxxxxx or email"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Detailed Comment */}
            <div>
              <label className="block font-bold text-gray-700 uppercase mb-1 text-[10px]">
                {language === 'bn' ? 'বিস্তারিত বিবরণ বা অভিযোগ *' : 'Detailed Feedback / Issue *'}
              </label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'আপনার পণ্যের মান, ডেলিভারি বা অন্য কোনো সমস্যা স্পষ্টভাবে লিখুন...'
                    : 'Tell us in detail what went well or what we should fix for you...'
                }
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none"
              />
            </div>

            {/* Immediate Help Option via WhatsApp */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  {language === 'bn'
                    ? 'জরুরি সমাধান প্রয়োজন? সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন'
                    : 'Need urgent resolution? Talk to our care desk on WhatsApp'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleWhatsAppHelp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition shrink-0 active:scale-95 flex items-center gap-1"
              >
                <span>WhatsApp</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-800 font-bold rounded-xl transition"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : language === 'bn' ? 'মতামত পাঠান' : 'Submit Feedback'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
