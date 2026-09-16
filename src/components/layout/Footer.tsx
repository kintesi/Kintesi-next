import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Shield, Truck, RotateCcw, Headphones, Heart } from 'lucide-react';
import { BkashLogo, NagadLogo, RocketLogo, VisaLogo, MastercardLogo } from '../common/PaymentLogos';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const { user, openAuthModal } = useAuth();
  const phone = settings?.helplinePhone?.trim();

  const handleAffiliateClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal('login');
    }
  };
  return (
    <footer className="hidden md:block bg-white text-gray-600 pt-16 pb-12 border-t border-rose-100/80 shadow-[0_-2px_15px_rgba(225,29,72,0.02)]">
      {/* Trust Badges */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-gray-100">
        <div className="grid grid-cols-4 gap-8">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-rose-200 transition shadow-xs">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">Fast & Safe Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Express shipping all over Bangladesh</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-rose-200 transition shadow-xs">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">100% Genuine Products</h4>
              <p className="text-xs text-gray-500 mt-0.5">Official brand warranty guaranteed</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-rose-200 transition shadow-xs">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">7-Day Easy Return</h4>
              <p className="text-xs text-gray-500 mt-0.5">Hassle-free replacement policy</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-rose-200 transition shadow-xs">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-gray-900 font-bold text-sm">24/7 Expert Support</h4>
              <p className="text-xs text-gray-500 mt-0.5">Always ready to assist your orders</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group py-1">
              <img 
                src="/navbar-logo.webp" 
                alt="Kintesi" 
                className="h-9 w-auto max-w-[180px] object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs" 
              />
            </Link>
            <p className="text-xs leading-relaxed text-gray-500 max-w-sm">
              Kintesi is your trusted online lifestyle, fashion, gadgets and daily shopping marketplace in Bangladesh. Bringing you 100% authentic quality products with express doorstep delivery.
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </div>
              {phone && (
                <>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <a href={`tel:${phone}`} className="hover:text-rose-600 transition font-medium">{phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💬</span>
                    <a
                      href={`https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '880')}?text=${encodeURIComponent('Hello Kintesi Support, I have an inquiry.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 transition font-bold"
                    >
                      WhatsApp Care (+880)
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/shop" className="text-gray-500 hover:text-rose-600 transition">All Products</Link></li>
              <li><Link to="/shop?category=smartphones-tablets" className="text-gray-500 hover:text-rose-600 transition">Smartphones</Link></li>
              <li><Link to="/shop?category=laptops-computers" className="text-gray-500 hover:text-rose-600 transition">Laptops</Link></li>
              <li><Link to="/shop?category=audio-headphones" className="text-gray-500 hover:text-rose-600 transition">Audio & Sound</Link></li>
              <li><Link to="/orders" className="text-gray-500 hover:text-rose-600 transition">Track Order</Link></li>
              <li>
                <Link 
                  to="/affiliate" 
                  onClick={handleAffiliateClick}
                  className="text-gray-500 hover:text-rose-600 transition"
                >
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/help" className="text-gray-500 hover:text-rose-600 transition">Help Center & FAQ</Link></li>
              <li><Link to="/shipping" className="text-gray-500 hover:text-rose-600 transition">Shipping & Delivery</Link></li>
              <li><Link to="/returns" className="text-gray-500 hover:text-rose-600 transition">Return & Refund Policy</Link></li>
              <li><Link to="/terms" className="text-gray-500 hover:text-rose-600 transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-rose-600 transition">Privacy Policy</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('kintesi_open_feedback'))}
                  className="text-gray-500 hover:text-rose-600 transition text-left cursor-pointer"
                >
                  Submit Feedback & Complaints
                </button>
              </li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-gray-900 font-bold text-sm uppercase tracking-wider">Payment Methods</h4>
            <p className="text-xs text-gray-500">We accept secure cashless payments & COD:</p>
            <div className="grid grid-cols-3 gap-2 pt-1 w-fit">
              <div className="w-[60px] h-[36px] bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-gray-200 hover:border-rose-300 hover:scale-105 transition" title="bKash">
                <BkashLogo className="max-h-5 max-w-[44px] object-contain" />
              </div>
              <div className="w-[60px] h-[36px] bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-gray-200 hover:border-rose-300 hover:scale-105 transition" title="Nagad">
                <NagadLogo className="max-h-5 max-w-[44px] object-contain" />
              </div>
              <div className="w-[60px] h-[36px] bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-gray-200 hover:border-rose-300 hover:scale-105 transition" title="DBBL Rocket">
                <RocketLogo className="max-h-4.5 max-w-[44px] object-contain" />
              </div>
              <div className="w-[60px] h-[36px] bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-gray-200 hover:border-rose-300 hover:scale-105 transition" title="Visa">
                <VisaLogo className="max-h-4 max-w-[44px] object-contain" />
              </div>
              <div className="w-[60px] h-[36px] bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm border border-gray-200 hover:border-rose-300 hover:scale-105 transition" title="Mastercard">
                <MastercardLogo className="max-h-5 max-w-[44px] object-contain" />
              </div>
              <div className="w-[60px] h-[36px] bg-rose-700 text-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-rose-600/50 hover:scale-105 transition" title="Cash on Delivery">
                <span className="text-[11px] font-black uppercase tracking-wider text-center leading-none">৳ COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} Kintesi. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          <span>Developed with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
          <span>by</span>
          <a 
            href="https://seocorerank.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold text-gray-800 hover:text-rose-600 transition underline underline-offset-2"
          >
            SEOCoreRank
          </a>
        </p>
      </div>
    </footer>
  );
};
