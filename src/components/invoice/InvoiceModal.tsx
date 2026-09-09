import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types';
import { formatPrice } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';
import { useChat } from '../../contexts/ChatContext';
import {
  Printer,
  X,
  ShieldCheck,
  Phone,
  Mail,
  MessageCircle,
  QrCode,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface InvoiceProps {
  order: Order;
  onClose?: () => void;
}

export const InvoiceModal: React.FC<InvoiceProps> = ({ order, onClose }) => {
  const { settings } = useSettings();
  const { openChat } = useChat();

  const handlePrint = () => {
    window.print();
  };

  const handleOpenChat = () => {
    openChat({
      order: {
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.order_status,
      },
    });
    if (onClose) onClose();
  };

  const sellerPhone = settings?.helplinePhone || '01805930164';

  const modalContent = (
    <div id="kintesi-invoice-portal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto print:z-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100 print:shadow-none print:border-none print:max-w-none print:w-full print:rounded-none print:overflow-visible print:max-h-none">
        
        {/* Print / Action Toolbar (Hidden during print) */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <span>Customer Official Invoice</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-mono">
              #{order.order_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Chat with Seller Button */}
            <button
              onClick={handleOpenChat}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              title="Live Chat with Seller & Store Support"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Chat with Seller</span>
            </button>

            {/* Print / Download Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div id="printable-invoice" className="p-8 sm:p-12 space-y-8 text-gray-800 bg-white">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-2 border-gray-100 pb-8">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 p-2 flex items-center justify-center border border-gray-200">
                <img src="/logo.png" alt="Kintesi" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Kin<span className="text-emerald-600">tesi</span>
                </h1>
                <p className="text-xs text-gray-500 font-semibold">Premier Online Shopping Marketplace • kintesi.com</p>
                <p className="text-[11px] text-gray-400">Dhaka, Bangladesh • support@kintesi.com • Helpline: {sellerPhone}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-md border border-emerald-200">
                OFFICIAL TAX INVOICE
              </span>
              <p className="font-mono font-black text-gray-900 text-base mt-2">
                INV-{order.order_number}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Issue Date: {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Billing & Shipping Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
            <div className="space-y-1.5">
              <p className="font-black uppercase tracking-wider text-emerald-800 text-[10px]">Customer & Shipping Details</p>
              <p className="text-sm font-extrabold text-gray-900">{order.customer_name}</p>
              <p className="text-gray-600 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {order.customer_phone}</p>
              <p className="text-gray-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {order.customer_email}</p>
              <p className="text-gray-800 font-medium pt-1 leading-relaxed">
                📍 {order.shipping_address}, {order.city} {order.postal_code ? `(${order.postal_code})` : ''}
              </p>
            </div>

            <div className="space-y-1.5 sm:text-right border-t sm:border-t-0 sm:border-l border-gray-200 sm:pl-6 pt-3 sm:pt-0">
              <p className="font-black uppercase tracking-wider text-emerald-800 text-[10px]">Payment & Order Status</p>
              <p className="text-xs font-bold text-gray-900">
                Payment Method: <span className="text-emerald-700 font-extrabold uppercase">{order.payment_method === 'bank' ? 'Direct Bank Transfer' : order.payment_method}</span>
              </p>
              {order.transaction_id && (
                <p className="text-[11px] text-gray-700">
                  TrxID / Ref: <strong className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{order.transaction_id}</strong>
                </p>
              )}
              {order.seller_payment_snapshot?.seller_name && (
                <p className="text-[11px] text-purple-900 font-bold">
                  Seller / Merchant: {order.seller_payment_snapshot.seller_name}
                </p>
              )}
              <p className="text-xs text-gray-600">
                Payment Status: <span className="uppercase font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px]">{order.payment_status}</span>
              </p>
              <p className="text-xs text-gray-600">
                Fulfillment: <span className="uppercase font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px]">{order.order_status}</span>
              </p>
              {order.customer_note && (
                <p className="text-[11px] text-gray-500 italic pt-1">
                  Customer Note: {order.customer_note}
                </p>
              )}
            </div>
          </div>

          {/* Items Table with Product SKU / Order Item ID */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/90 text-gray-700 font-extrabold uppercase tracking-wider border-b border-gray-200 text-[11px]">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Product SKU / Item ID</th>
                  <th className="p-3.5">Item Description</th>
                  <th className="p-3.5 text-center w-16">Qty</th>
                  <th className="p-3.5 text-right w-24">Unit Price</th>
                  <th className="p-3.5 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {order.items?.map((item: any, idx: number) => {
                  const skuOrId = item.sku || item.product_id || ('CF-' + (item.id || order.id || 'ITEM').slice(0, 6).toUpperCase());
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-3.5 text-center font-bold text-gray-400">{idx + 1}</td>
                      
                      {/* Product SKU / Item ID Display */}
                      <td className="p-3.5">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded-md font-mono font-bold text-[11px] border border-emerald-200 block w-fit">
                          {skuOrId}
                        </span>
                      </td>

                      {/* Item Description & Variant */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-xs leading-snug">{item.title}</p>
                            {(item.selectedSize || item.selectedColor) && (
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {item.selectedSize && <span className="font-semibold">Size: {item.selectedSize} </span>}
                                {item.selectedColor && <span>• Color: {item.selectedColor}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-bold text-xs">{item.quantity}</td>
                      <td className="p-3.5 text-right font-medium text-gray-600">{formatPrice(item.price)}</td>
                      <td className="p-3.5 text-right font-black text-gray-900 text-xs">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Calculation Breakdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pt-2">
            {/* Guarantee Seal & Chat Shortcut */}
            <div className="space-y-2 text-xs text-gray-500 max-w-sm">
              <div className="flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>100% Genuine Certified Quality • Official Kintesi Warranty</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                For returns, exchange, or delivery tracking, contact seller helpline: <strong>{sellerPhone}</strong>.
              </p>
            </div>

            {/* Calculations Card */}
            <div className="w-full sm:w-72 bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Special Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping Delivery Fee</span>
                <span className="font-bold text-gray-900">
                  {order.shipping_cost === 0 ? 'FREE' : formatPrice(order.shipping_cost)}
                </span>
              </div>
              <div className="border-t-2 border-gray-900 pt-2 flex justify-between font-black text-sm text-gray-900">
                <span>Grand Total</span>
                <span className="text-emerald-700 text-lg">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Footer, Barcode & Official Signature */}
          <div className="border-t-2 border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-gray-500">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-bold text-gray-800 text-xs">Thank you for ordering with Kintesi (kintesi.com)!</p>
              <p>This is a computer-generated official receipt. No physical signature required.</p>
            </div>
            
            {/* Simulated Barcode */}
            <div className="flex flex-col items-center">
              <div className="h-9 flex items-center gap-0.5 bg-white p-1">
                {[...Array(32)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-900 h-full"
                    style={{ width: i % 4 === 0 ? '3px' : i % 2 === 0 ? '1.5px' : '1px' }}
                  />
                ))}
              </div>
              <span className="font-mono text-[10px] font-bold text-gray-600 mt-1">
                #{order.order_number}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
