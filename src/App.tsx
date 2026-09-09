import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AddressProvider } from './contexts/AddressContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ChatProvider } from './contexts/ChatContext';
import { Toaster } from 'sonner';

// Storefront Components & Pages
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { CartDrawer } from './components/cart/CartDrawer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { LiveChatWidget } from './components/chat/LiveChatWidget';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { WishlistPage } from './pages/WishlistPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { ProfilePage } from './pages/ProfilePage';

// Admin Components & Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminPaymentSettings } from './pages/admin/AdminPaymentSettings';
import { AdminTeam } from './pages/admin/AdminTeam';
import { AdminBanners } from './pages/admin/AdminBanners';
import { AdminLiveChat } from './pages/admin/AdminLiveChat';

const StorefrontLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <LiveChatWidget />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AddressProvider>
            <CartProvider>
              <WishlistProvider>
                <ChatProvider>
                  <Toaster position="top-right" richColors />
                  <Routes>
                    {/* Customer Storefront Routes */}
                    <Route element={<StorefrontLayout />}>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/product/:slug" element={<ProductDetailPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                      <Route path="/orders" element={<MyOrdersPage />} />
                    </Route>

                    {/* Admin Panel Routes */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="chat" element={<AdminLiveChat />} />
                      <Route path="banners" element={<AdminBanners />} />
                      <Route path="payment-settings" element={<AdminPaymentSettings />} />
                      <Route path="team" element={<AdminTeam />} />
                    </Route>
                  </Routes>
                </ChatProvider>
              </WishlistProvider>
            </CartProvider>
          </AddressProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
