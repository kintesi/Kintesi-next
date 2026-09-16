import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams } from 'react-router-dom';
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

// Robust Lazy Loader with automatic retry on chunk deployment hash changes
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const isChunkError =
        err?.message?.includes('Failed to fetch dynamically imported module') ||
        err?.message?.includes('error loading dynamically imported module') ||
        err?.name === 'ChunkLoadError';

      const retryKey = 'kintesi_chunk_retry_' + window.location.pathname;
      const hasRetried = sessionStorage.getItem(retryKey);

      if (isChunkError && !hasRetried) {
        sessionStorage.setItem(retryKey, 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }

      throw err;
    }
  });
}

// Storefront Lazy-loaded Pages (Code-splitting with resilient fallback)
const ShopPage = lazyRetry(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazyRetry(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const ShowcasePage = lazyRetry(() => import('./pages/ShowcasePage').then((m) => ({ default: m.ShowcasePage })));
const WishlistPage = lazyRetry(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const CartPage = lazyRetry(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazyRetry(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazyRetry(() => import('./pages/OrderSuccessPage').then((m) => ({ default: m.OrderSuccessPage })));
const MyOrdersPage = lazyRetry(() => import('./pages/MyOrdersPage').then((m) => ({ default: m.MyOrdersPage })));
const ProfilePage = lazyRetry(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const HelpCenterPage = lazyRetry(() => import('./pages/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })));
const ShippingDeliveryPage = lazyRetry(() => import('./pages/ShippingDeliveryPage').then((m) => ({ default: m.ShippingDeliveryPage })));
const ReturnRefundPage = lazyRetry(() => import('./pages/ReturnRefundPage').then((m) => ({ default: m.ReturnRefundPage })));
const TermsOfServicePage = lazyRetry(() => import('./pages/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage })));
const PrivacyPolicyPage = lazyRetry(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const AffiliateDashboardPage = lazyRetry(() => import('./pages/AffiliateDashboardPage').then((m) => ({ default: m.AffiliateDashboardPage })));

// Admin Lazy-loaded Pages (Isolated from shopper bundle)
const AdminLayout = lazyRetry(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboard = lazyRetry(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminProducts = lazyRetry(() => import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })));
const AdminOrders = lazyRetry(() => import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })));
const AdminCoupons = lazyRetry(() => import('./pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })));
const AdminCategories = lazyRetry(() => import('./pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminPaymentSettings = lazyRetry(() => import('./pages/admin/AdminPaymentSettings').then((m) => ({ default: m.AdminPaymentSettings })));
const AdminTeam = lazyRetry(() => import('./pages/admin/AdminTeam').then((m) => ({ default: m.AdminTeam })));
const AdminBanners = lazyRetry(() => import('./pages/admin/AdminBanners').then((m) => ({ default: m.AdminBanners })));
const AdminLiveChat = lazyRetry(() => import('./pages/admin/AdminLiveChat').then((m) => ({ default: m.AdminLiveChat })));
const AdminPresets = lazyRetry(() => import('./pages/admin/AdminPresets').then((m) => ({ default: m.AdminPresets })));
const AdminAffiliates = lazyRetry(() => import('./pages/admin/AdminAffiliates').then((m) => ({ default: m.AdminAffiliates })));

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

function LegacyCategoryRedirect() {
  const { category } = useParams<{ category: string }>();
  return <Navigate to={category ? `/shop?category=${encodeURIComponent(category)}` : '/shop'} replace />;
}

const StorefrontLayout = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white w-full max-w-[100vw] overflow-x-hidden relative">
      <Navbar />
      <main className="flex-1 pb-24 md:pb-0 w-full max-w-full overflow-x-hidden">
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

                            {/* Legacy URLs mapped for SEO / Google indexation compatibility */}
                            <Route path="/product-category/:category" element={<LegacyCategoryRedirect />} />
                            <Route path="/product-category" element={<Navigate to="/shop" replace />} />
                            <Route path="/category/:category" element={<LegacyCategoryRedirect />} />
                            <Route path="/categories/:category" element={<LegacyCategoryRedirect />} />
                            <Route path="/collections/:category" element={<LegacyCategoryRedirect />} />
                            <Route path="/collection/:category" element={<LegacyCategoryRedirect />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                            <Route path="/terms-and-conditions" element={<TermsOfServicePage />} />
                            <Route path="/terms-conditions" element={<TermsOfServicePage />} />
                            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                            <Route path="/refund-policy" element={<ReturnRefundPage />} />
                            <Route path="/return-policy" element={<ReturnRefundPage />} />
                            <Route path="/contact" element={<HelpCenterPage />} />
                            <Route path="/contact-us" element={<HelpCenterPage />} />
                            <Route path="/about" element={<HelpCenterPage />} />
                            <Route path="/about-us" element={<HelpCenterPage />} />

                            {/* Catch-all 404 Route */}
                            <Route path="*" element={<Navigate to="/" replace />} />
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
