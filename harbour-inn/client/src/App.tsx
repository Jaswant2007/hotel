import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { BookingsPage } from './pages/BookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CheckoutPage } from './pages/CheckoutPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-neutral-cream text-neutral-text font-sans antialiased">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <BookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
          </main>

          {/* Global Auth Modal */}
          <AuthModal />

          {/* Footer */}
          <footer className="border-t border-neutral-border bg-neutral-cream py-8 text-center text-xs text-neutral-muted">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p>© {new Date().getFullYear()} Harbour Inn Hotel &amp; Waterfront Residences. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="#terms" className="hover:text-primary underline">Guest Terms</a>
                <a href="#privacy" className="hover:text-primary underline">Privacy Policy</a>
                <a href="#security" className="hover:text-primary underline">Security Standards</a>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
