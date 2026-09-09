import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Shield, Truck, RotateCcw, Headphones, Heart } from 'lucide-react';
import { BkashLogo, NagadLogo, RocketLogo, VisaLogo, MastercardLogo } from '../common/PaymentLogos';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 pt-16 pb-12 border-t border-gray-800/80">
      {/* Trust Badges */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-gray-800/80">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Fast & Safe Delivery</h4>
              <p className="text-xs text-gray-500 mt-0.5">Express shipping all over Bangladesh</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Genuine Products</h4>
              <p className="text-xs text-gray-500 mt-0.5">Official brand warranty guaranteed</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">7-Day Easy Return</h4>
              <p className="text-xs text-gray-500 mt-0.5">Hassle-free replacement policy</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">24/7 Expert Support</h4>
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
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center">
                <img src="/logo.png" alt="Kintesi" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-extrabold text-white">
                Kin<span className="text-emerald-500">tesi</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-gray-400 max-w-sm">
              Kintesi is your trusted online lifestyle, fashion, gadgets and daily shopping marketplace in Bangladesh (kintesi.com). Bringing you 100% authentic quality products with express doorstep delivery.
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Dhaka, Bangladesh • kintesi.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+880 1800-KINTESI</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>support@kintesi.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/shop" className="hover:text-emerald-400 transition">All Products</Link></li>
              <li><Link to="/shop?category=smartphones-tablets" className="hover:text-emerald-400 transition">Smartphones</Link></li>
              <li><Link to="/shop?category=laptops-computers" className="hover:text-emerald-400 transition">Laptops</Link></li>
              <li><Link to="/shop?category=audio-headphones" className="hover:text-emerald-400 transition">Audio & Sound</Link></li>
              <li><Link to="/orders" className="hover:text-emerald-400 transition">Track Order</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-emerald-400 transition">Help Center & FAQ</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Shipping & Delivery</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Return & Refund Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Payment Methods</h4>
            <p className="text-xs text-gray-400">We accept secure cashless payments & COD:</p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="h-9 px-3 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100 hover:scale-105 transition" title="bKash">
                <BkashLogo className="h-6 w-auto" />
              </div>
              <div className="h-9 px-3 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100 hover:scale-105 transition" title="Nagad">
                <NagadLogo className="h-6 w-auto" />
              </div>
              <div className="h-9 px-3 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100 hover:scale-105 transition" title="DBBL Rocket">
                <RocketLogo className="h-6 w-auto" />
              </div>
              <div className="h-9 px-3 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100 hover:scale-105 transition" title="Visa">
                <VisaLogo className="h-5 w-auto" />
              </div>
              <div className="h-9 px-3 bg-white rounded-xl flex items-center justify-center shadow-md border border-gray-100 hover:scale-105 transition" title="Mastercard">
                <MastercardLogo className="h-5 w-auto" />
              </div>
              <div className="h-9 px-3 bg-emerald-800 text-white rounded-xl flex items-center justify-center shadow-md border border-emerald-700/50 text-[11px] font-black uppercase tracking-wider hover:scale-105 transition" title="Cash on Delivery">
                <span>৳ COD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} Kintesi (kintesi.com). All rights reserved.</p>
        <p className="flex items-center gap-1">
          Designed with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for modern e-commerce.
        </p>
      </div>
    </footer>
  );
};
