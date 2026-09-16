import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { supabase } from './supabase';

export interface CustomerFeedback {
  id: string;
  customer_name: string;
  customer_contact: string; // phone or email
  category: 'product_quality' | 'delivery_delay' | 'wrong_item' | 'website_issue' | 'suggestion' | 'other';
  rating: number; // 1 to 5
  comment: string;
  order_number?: string;
  created_at: string;
  status: 'new' | 'reviewed' | 'resolved';
}

const STORAGE_KEY = 'kintesi_customer_feedbacks';

export const FEEDBACK_CATEGORIES = [
  { id: 'product_quality', label: 'Product Quality (পণ্যের মান)', labelEn: 'Product Quality' },
  { id: 'delivery_delay', label: 'Delivery / Courier (ডেলিভারি সংক্রান্ত)', labelEn: 'Delivery / Courier' },
  { id: 'wrong_item', label: 'Wrong or Damaged Item (ভুল বা ত্রুটিযুক্ত পার্সেল)', labelEn: 'Wrong or Damaged Item' },
  { id: 'website_issue', label: 'Website / Payment Issue (ওয়েবসাইট বা পেমেন্ট)', labelEn: 'Website / Payment Issue' },
  { id: 'suggestion', label: 'Suggestion & Compliment (পরামর্শ বা প্রশংসা)', labelEn: 'Suggestion & Compliment' },
  { id: 'other', label: 'Other Inquiries (অন্যান্য)', labelEn: 'Other Inquiries' },
] as const;

export async function submitCustomerFeedback(feedback: {
  customer_name: string;
  customer_contact: string;
  category: CustomerFeedback['category'];
  rating: number;
  comment: string;
  order_number?: string;
}): Promise<{ success: boolean; id: string }> {
  const newId = 'fb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const record: CustomerFeedback = {
    id: newId,
    customer_name: feedback.customer_name.trim() || 'Valued Customer',
    customer_contact: feedback.customer_contact.trim(),
    category: feedback.category,
    rating: Number(feedback.rating) || 5,
    comment: feedback.comment.trim(),
    order_number: feedback.order_number?.trim() || undefined,
    created_at: now,
    status: 'new',
  };

  // 1. Save to LocalStorage
  try {
    const existing: CustomerFeedback[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
  } catch (err) {
    console.warn('LocalStorage feedback note:', err);
  }

  // 2. Save to Firestore (Real-time Cloud Database)
  try {
    await addDoc(collection(db, 'customer_feedbacks'), {
      ...record,
      timestamp: now,
    });
  } catch (err) {
    console.warn('Firestore feedback note:', err);
  }

  // 3. Notify Admin via Supabase chat_messages as an instant priority message
  try {
    const stars = '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating);
    const categoryLabel = FEEDBACK_CATEGORIES.find((c) => c.id === record.category)?.labelEn || record.category;
    const orderText = record.order_number ? ` [Order #${record.order_number}]` : '';

    await supabase.from('chat_messages').insert([
      {
        conversation_id: 'feedback_' + record.id,
        sender: 'customer',
        sender_name: `${record.customer_name} (${categoryLabel})`,
        sender_email: record.customer_contact.includes('@') ? record.customer_contact : '',
        sender_phone: !record.customer_contact.includes('@') ? record.customer_contact : '',
        text: `[CUSTOMER FEEDBACK ${stars}]${orderText}\n"${record.comment}"\nContact: ${record.customer_contact}`,
        read: false,
      },
    ]);
  } catch (err) {
    console.warn('Supabase feedback notification note:', err);
  }

  window.dispatchEvent(new CustomEvent('kintesi_feedback_submitted', { detail: record }));
  return { success: true, id: newId };
}

export function getLocalCustomerFeedbacks(): CustomerFeedback[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
