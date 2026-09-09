import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Order } from '../types';
import { formatPrice } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useChat } from '../contexts/ChatContext';
import {
  Package,
  CheckCircle,
  Truck,
  ShoppingBag,
  Star,
  MessageSquare,
  CheckCircle2,
  X,
  Printer,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { InvoiceModal } from '../components/invoice/InvoiceModal';

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

export const MyOrdersPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { openChat } = useChat();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [reviewingItem, setReviewingItem] = useState<{ productId: string; title: string; image: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cartfly_reviewed_items') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        let fetchedOrders: Order[] = [];
        
        if (user) {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (data) fetchedOrders = data;
        }

        const local = JSON.parse(localStorage.getItem('cartfly_guest_orders') || '[]');
        if (local.length > 0) {
          const merged = [...fetchedOrders, ...local.filter((l: any) => !fetchedOrders.some((f) => f.order_number === l.order_number))];
          setOrders(merged);
        } else {
          setOrders(fetchedOrders);
        }
      } catch (err) {
        console.warn('Orders load note:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user]);

  const handleOpenReviewModal = (item: { productId: string; title: string; image: string }) => {
    setReviewingItem(item);
    setReviewRating(5);
    setReviewComment('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem || !reviewComment.trim()) {
      toast.error('Please share your thoughts in the review comment');
      return;
    }

    const newReview = {
      id: 'rev-' + Date.now(),
      productId: reviewingItem.productId,
      name: profile?.full_name || user?.user_metadata?.full_name || 'Verified Customer',
      rating: reviewRating,
      comment: reviewComment,
      date: 'Just now',
      verified: true,
    };

    // Save locally and into Supabase
    try {
      const existingReviews = JSON.parse(localStorage.getItem(`cartfly_reviews_${reviewingItem.productId}`) || '[]');
      localStorage.setItem(`cartfly_reviews_${reviewingItem.productId}`, JSON.stringify([newReview, ...existingReviews]));
    } catch {}

    const updatedReviewed = [...reviewedProductIds, reviewingItem.productId];
    setReviewedProductIds(updatedReviewed);
    localStorage.setItem('cartfly_reviewed_items', JSON.stringify(updatedReviewed));

    toast.success('Thank you! Your verified purchaser review has been published.');
    setIsReviewModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-black text-gray-900">My Orders & Tracking</h1>
        <p className="text-xs text-gray-500 mt-1">Track active orders, view receipts, and review delivered products</p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No orders found</h3>
          <p className="text-xs text-gray-500 mb-6">You have not placed any orders yet.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStepIdx = STATUS_STEPS.indexOf(order.order_status);
            const isDelivered = order.order_status === 'delivered';

            return (
              <div
                key={order.id || order.order_number}
                className={`bg-white rounded-3xl border p-6 sm:p-8 space-y-6 shadow-sm transition ${
                  isDelivered ? 'border-emerald-200' : 'border-gray-100'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-gray-900">
                        #{order.order_number}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs text-gray-400 font-semibold block">Total Amount</span>
                      <span className="text-base font-black text-emerald-700">{formatPrice(order.total_amount)}</span>
                    </div>

                    {/* Chat with Seller */}
                    <button
                      type="button"
                      onClick={() =>
                        openChat({
                          order: {
                            orderNumber: order.order_number,
                            totalAmount: order.total_amount,
                            status: order.order_status,
                          },
                        })
                      }
                      className="p-2 sm:px-3 sm:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      title="Chat with Seller & Support"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Chat with Seller</span>
                    </button>

                    {/* Invoice Button */}
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="p-2 sm:px-3 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      title="View & Print Invoice"
                    >
                      <Printer className="w-4 h-4 text-gray-700" />
                      <span className="hidden sm:inline">Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Tracking Stepper */}
                {order.order_status !== 'cancelled' && (
                  <div className="py-2">
                    <div className="grid grid-cols-4 gap-2 text-center relative">
                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition ${
                                isCompleted
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${
                              isCompleted ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ordered Items with Delivered Review Trigger */}
                <div className="bg-gray-50/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ordered Items</h4>
                    {isDelivered && (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered • Reviews Unlocked
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-200">
                    {order.items?.map((item: any, idx: number) => {
                      const alreadyReviewed = reviewedProductIds.includes(item.productId);
                      const skuOrId = item.sku || item.product_id || ('CF-' + (item.id || order.id || 'ITEM').slice(0, 6).toUpperCase());

                      return (
                        <div key={idx} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || '/logo.webp'}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-xl bg-white border border-gray-200 flex-shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-[10px]">
                                  SKU: {skuOrId}
                                </span>
                                <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.title}</p>
                              </div>
                              <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                                <span>Qty: {item.quantity}</span>
                                {item.selectedSize && <span>• Size: {item.selectedSize}</span>}
                                {item.selectedColor && <span>• Color: {item.selectedColor}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="font-black text-gray-900 text-sm">{formatPrice(item.price * item.quantity)}</span>

                            {/* Review Button if order is delivered */}
                            {isDelivered && (
                              alreadyReviewed ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold">
                                  <CheckCircle className="w-3.5 h-3.5" /> Reviewed
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenReviewModal(item)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition shadow-sm active:scale-95"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                  <span>Write Review</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping info */}
                <div className="text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-gray-100">
                  <div>
                    <span>Shipping Address: </span>
                    <strong className="text-gray-800">{order.shipping_address}, {order.city}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Payment: </span>
                    <strong className="uppercase text-gray-800">{order.payment_method}</strong> ({order.payment_status})
                    {order.transaction_id && (
                      <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        TrxID: {order.transaction_id}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && reviewingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">Review Delivered Product</h3>
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Purchase
                </p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-2 hover:bg-gray-100 text-gray-400 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Snapshot */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <img
                src={reviewingItem.image || '/logo.webp'}
                alt={reviewingItem.title}
                className="w-12 h-12 object-cover rounded-xl bg-white border border-gray-200"
              />
              <p className="font-bold text-xs text-gray-800 line-clamp-2">{reviewingItem.title}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              {/* Star rating selector */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1.5">Rate this product *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-extrabold text-sm text-gray-800 ml-2">{reviewRating} out of 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Your Detailed Experience & Feedback *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was the product quality, performance, material, or packaging? Would you recommend it?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95"
                >
                  Submit Verified Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}

    </div>
  );
};
