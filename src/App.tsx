import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AddressProvider } from './contexts/AddressContext';
import { CouponProvider } from './contexts/CouponContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ChatProvider } from './contexts/ChatContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from 'sonner';

// Storefront Eager Pages & Layouts
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LiveChatWidget } from './components/chat/LiveChatWidget';
import { HomePage } from './pages/HomePage';

// Storefront Lazy-loaded Pages (Code-splitting for Lighthouse Performance)
const ShopPage = React.lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ShowcasePage = React.lazy(() => import('./pages/ShowcasePage').then((m) => ({ default: m.ShowcasePage })));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CartPage = React.lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = React.lazy(() => import('./pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const MyOrdersPage = React.lazy(() => import('./pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const HelpCenterPage = React.lazy(() => import('./pages/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })));
const ShippingDeliveryPage = React.lazy(() => import('./pages/ShippingDeliveryPage').then((m) => ({ default: m.ShippingDeliveryPage })));
const ReturnRefundPage = React.lazy(() => import('./pages/ReturnRefundPage').then((m) => ({ default: m.ReturnRefundPage })));
const TermsOfServicePage = React.lazy(() => import('./pages/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const AffiliateDashboardPage = React.lazy(() => import('./pages/AffiliateDashboardPage').then((m) => ({ default: m.AffiliateDashboardPage })));

// Admin Lazy-loaded Pages (Isolated from shopper bundle)
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = React.lazy(() => import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })));
const AdminCategories = React.lazy(() => import('./pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminPaymentSettings = React.lazy(() => import('./pages/admin/AdminPaymentSettings').then((m) => ({ default: m.AdminPaymentSettings })));
const AdminTeam = React.lazy(() => import('./pages/admin/AdminTeam').then((m) => ({ default: m.AdminTeam })));
const AdminBanners = React.lazy(() => import('./pages/admin/AdminBanners').then((m) => ({ default: m.AdminBanners })));
const AdminLiveChat = React.lazy(() => import('./pages/admin/AdminLiveChat').then((m) => ({ default: m.AdminLiveChat })));
const AdminPresets = React.lazy(() => import('./pages/admin/AdminPresets').then((m) => ({ default: m.AdminPresets })));
const AdminAffiliates = React.lazy(() => import('./pages/admin/AdminAffiliates').then((m) => ({ default: m.AdminAffiliates })));

import { setActiveAffiliateReferral, recordAffiliateClick } from './lib/affiliateService';
import { useLocation } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/auth/AuthModal';

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

function AffiliateTracker() {
  const location = useLocation();

  React.useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const affCode = params.get('aff') || params.get('ref');
      if (affCode && affCode.trim()) {
        const cleanCode = affCode.trim().toUpperCase();
        setActiveAffiliateReferral(cleanCode);
        recordAffiliateClick(cleanCode);
      }
    } catch {
      // safe fallback
    }
  }, [location.search]);

  return null;
}

const StorefrontLayout = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0">
        <React.Suspense fallback={<PageLoader />}>
          <Outlet />
        </React.Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <LiveChatWidget />
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} initialMode={authModalMode} />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AffiliateTracker />
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <AddressProvider>
              <CouponProvider>
                <CartProvider>
                  <WishlistProvider>
                    <ChatProvider>
                      <Toaster position="bottom-right" richColors closeButton />
                      <React.Suspense fallback={<PageLoader />}>
                        <Routes>
                          {/* Customer Storefront Routes */}
                          <Route element={<StorefrontLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/shop" element={<ShopPage />} />
                            <Route path="/showcase/:type" element={<ShowcasePage />} />
                            <Route path="/flash-sale" element={<ShowcasePage showcaseType="flash_sale" />} />
                            <Route path="/trending" element={<ShowcasePage showcaseType="trending" />} />
                            <Route path="/featured" element={<ShowcasePage showcaseType="featured" />} />
                            <Route path="/new-arrivals" element={<ShowcasePage showcaseType="new_arrival" />} />
                            <Route path="/product/:slug" element={<ProductDetailPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/affiliate" element={<AffiliateDashboardPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/wishlist" element={<WishlistPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                            <Route path="/orders" element={<MyOrdersPage />} />
                            <Route path="/help" element={<HelpCenterPage />} />
                            <Route path="/faq" element={<HelpCenterPage />} />
                            <Route path="/shipping" element={<ShippingDeliveryPage />} />
                            <Route path="/returns" element={<ReturnRefundPage />} />
                            <Route path="/terms" element={<TermsOfServicePage />} />
                            <Route path="/privacy" element={<PrivacyPolicyPage />} />
                          </Route>

                          {/* Admin Panel Routes */}
                          <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="presets" element={<AdminPresets />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="affiliates" element={<AdminAffiliates />} />
                            <Route path="coupons" element={<AdminCoupons />} />
                            <Route path="categories" element={<AdminCategories />} />
                            <Route path="chat" element={<AdminLiveChat />} />
                            <Route path="banners" element={<AdminBanners />} />
                            <Route path="payment-settings" element={<AdminPaymentSettings />} />
                            <Route path="team" element={<AdminTeam />} />
                            <Route path="users" element={<AdminTeam />} />
                            <Route path="staff" element={<AdminTeam />} />
                          </Route>
                        </Routes>
                      </React.Suspense>
                    </ChatProvider>
                  </WishlistProvider>
                </CartProvider>
              </CouponProvider>
            </AddressProvider>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
