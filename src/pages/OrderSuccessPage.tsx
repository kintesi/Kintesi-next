import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShoppingBag, PackageCheck, Printer, FileText } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { InvoiceModal } from '../components/invoice/InvoiceModal';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const order = location.state?.order;

  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-xl space-y-8 text-center">
        
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-black tracking-widest uppercase text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full">
            Order Confirmed & Invoice Generated
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-4">
            Thank you for your order!
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Your order reference is <strong className="text-gray-900 font-mono">#{orderId}</strong>. An official invoice has been automatically generated.
          </p>
        </div>

        {/* Order Details summary */}
        {order && (
          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200/80 text-left space-y-4 text-xs">
            <div className="flex flex-wrap justify-between items-center border-b border-gray-200 pb-3 gap-2">
              <span className="font-bold text-gray-800">Delivery & Payment Summary</span>
              <div className="flex items-center gap-2">
                <span className="uppercase text-emerald-700 font-extrabold bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  {order.payment_method === 'bank' ? 'Bank Transfer' : order.payment_method}
                </span>
                {order.transaction_id && (
                  <span className="font-mono text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300 font-black">
                    TrxID: {order.transaction_id}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-600">
              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Customer</p>
                <p className="font-bold text-gray-900 text-xs mt-0.5">{order.customer_name}</p>
                <p>{order.customer_phone}</p>
                <p>{order.customer_email}</p>
              </div>

              <div>
                <p className="text-gray-400 font-semibold uppercase text-[10px]">Shipping Address</p>
                <p className="font-bold text-gray-900 text-xs mt-0.5">{order.shipping_address}</p>
                <p>{order.city} {order.postal_code}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-sm text-gray-900">
              <span>Total Paid / Due</span>
              <span className="text-emerald-700 font-black">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons with Invoice Trigger */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          {order && (
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="px-6 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-2xl text-xs transition shadow-sm flex items-center gap-2 active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>Print Official Invoice</span>
            </button>
          )}

          <Link
            to="/orders"
            className="px-6 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition shadow flex items-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Track Order Status</span>
          </Link>

          <Link
            to="/shop"
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

      </div>

      {/* Invoice Modal */}
      {isInvoiceOpen && order && (
        <InvoiceModal order={order} onClose={() => setIsInvoiceOpen(false)} />
      )}
    </div>
  );
};
