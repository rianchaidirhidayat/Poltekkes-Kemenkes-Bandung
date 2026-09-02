import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PublicMicrosite } from './components/PublicMicrosite';
import { AdminDashboard } from './components/AdminDashboard';
import { QRCodeModal } from './components/QRCodeModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { MenuItem, MicrositeProfile, ClickLog } from './types';
import { INITIAL_MENUS, INITIAL_PROFILE, INITIAL_CLICK_LOGS } from './data/initialData';

const LOCAL_STORAGE_MENUS_KEY = 'direct_menu_items_v2';
const LOCAL_STORAGE_PROFILE_KEY = 'direct_menu_profile_v2';
const LOCAL_STORAGE_LOGS_KEY = 'direct_menu_logs_v2';
const LOCAL_STORAGE_ADMIN_PIN_KEY = 'direct_menu_admin_pin_v2';
const SESSION_ADMIN_AUTH_KEY = 'direct_menu_admin_auth_v2';

export default function App() {
  // Load initial states from localStorage with safe fallback
  const [menus, setMenus] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MENUS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_MENUS;
  });

  const [profile, setProfile] = useState<MicrositeProfile>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PROFILE;
  });

  const [logs, setLogs] = useState<ClickLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CLICK_LOGS;
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ADMIN_PIN_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'admin123';
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [currentView, setCurrentView] = useState<'public' | 'admin' | 'split'>(() => {
    try {
      const isAuth = sessionStorage.getItem(SESSION_ADMIN_AUTH_KEY) === 'true';
      if (isAuth) return 'admin';
    } catch {
      // ignore
    }
    return 'public';
  });

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(menus));
    } catch {
      // ignore storage overflow
    }
  }, [menus]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ADMIN_PIN_KEY, adminPin);
    } catch {
      // ignore
    }
  }, [adminPin]);

  useEffect(() => {
    try {
      if (isAdminAuthenticated) {
        sessionStorage.setItem(SESSION_ADMIN_AUTH_KEY, 'true');
      } else {
        sessionStorage.removeItem(SESSION_ADMIN_AUTH_KEY);
      }
    } catch {
      // ignore
    }
  }, [isAdminAuthenticated]);

  // Handle URL parameters or Hash (#admin or ?admin=true) & Keyboard shortcut Alt+A
  useEffect(() => {
    const checkAdminTrigger = () => {
      const hasAdminHash = window.location.hash.toLowerCase().includes('admin');
      const urlParams = new URLSearchParams(window.location.search);
      const hasAdminQuery = urlParams.has('admin');

      if (hasAdminHash || hasAdminQuery) {
        if (!isAdminAuthenticated) {
          setIsAuthModalOpen(true);
        } else {
          setCurrentView('admin');
        }
      }
    };

    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);

    // Keyboard shortcut listener: Alt + A or Ctrl + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'a' || e.key === 'A')) || (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A'))) {
        e.preventDefault();
        if (isAdminAuthenticated) {
          setCurrentView((prev) => (prev === 'admin' ? 'public' : 'admin'));
        } else {
          setIsAuthModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('hashchange', checkAdminTrigger);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminAuthenticated]);

  // Auth Success Handler
  const handleAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('admin');
  };

  // Logout Handler
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView('public');
    try {
      sessionStorage.removeItem(SESSION_ADMIN_AUTH_KEY);
      if (window.location.hash.includes('admin')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      // ignore
    }
  };

  // Click tracking event dispatcher
  const handleMenuClick = (clickedMenu: MenuItem) => {
    // 1. Increment menu click count
    setMenus((prev) =>
      prev.map((m) =>
        m.id === clickedMenu.id ? { ...m, clickCount: (m.clickCount || 0) + 1 } : m
      )
    );

    // 2. Detect device type
    const ua = navigator.userAgent;
    let device: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      device = 'Tablet';
    } else if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
        ua
      )
    ) {
      device = 'Mobile';
    }

    // 3. Create log
    const newLog: ClickLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuId: clickedMenu.id,
      menuTitle: clickedMenu.title,
      category: clickedMenu.category || 'Umum',
      timestamp: new Date().toISOString(),
      device,
      browser: /Chrome/i.test(ua) ? 'Chrome' : /Safari/i.test(ua) ? 'Safari' : 'Browser',
      referrer: document.referrer ? new URL(document.referrer).hostname : 'Direct / QR',
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  // Simulate click for demo
  const handleSimulateClick = () => {
    if (menus.length === 0) return;
    const randomMenu = menus[Math.floor(Math.random() * menus.length)];
    const devices: Array<'Mobile' | 'Desktop' | 'Tablet'> = ['Mobile', 'Mobile', 'Mobile', 'Desktop', 'Tablet'];
    const referrers = ['Instagram Bio', 'WhatsApp Share', 'TikTok Profile', 'Google Search', 'Direct QR'];
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    const randomRef = referrers[Math.floor(Math.random() * referrers.length)];

    setMenus((prev) =>
      prev.map((m) =>
        m.id === randomMenu.id ? { ...m, clickCount: (m.clickCount || 0) + 1 } : m
      )
    );

    const simulatedLog: ClickLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuId: randomMenu.id,
      menuTitle: randomMenu.title,
      category: randomMenu.category || 'Umum',
      timestamp: new Date().toISOString(),
      device: randomDevice,
      browser: randomDevice === 'Mobile' ? 'Chrome Mobile' : 'Chrome 122',
      referrer: randomRef,
    };

    setLogs((prev) => [simulatedLog, ...prev.slice(0, 199)]);
  };

  const handleClearLogs = () => {
    if (window.confirm('Hapus seluruh riwayat log klik analitik?')) {
      setLogs([]);
      setMenus((prev) => prev.map((m) => ({ ...m, clickCount: 0 })));
    }
  };

  const handleResetDemo = () => {
    setMenus(INITIAL_MENUS);
    setProfile(INITIAL_PROFILE);
    setLogs(INITIAL_CLICK_LOGS);
    setAdminPin('admin123');
    localStorage.removeItem(LOCAL_STORAGE_MENUS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_LOGS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ADMIN_PIN_KEY);
  };

  const totalClicks = menus.reduce((acc, m) => acc + (m.clickCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Top Navbar: ONLY rendered when Admin is Authenticated */}
      {isAdminAuthenticated && (
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          onOpenQR={() => setIsQRModalOpen(true)}
          onResetDemo={handleResetDemo}
          onLogout={handleAdminLogout}
          profile={profile}
          totalClicks={totalClicks}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {/* PUBLIC MICROSITE VIEW (Default for Employees) */}
        {(!isAdminAuthenticated || currentView === 'public') && (
          <div className="flex-1 flex flex-col justify-start">
            <PublicMicrosite
              profile={profile}
              menus={menus}
              onMenuClick={handleMenuClick}
              onOpenQR={() => setIsQRModalOpen(true)}
              onOpenAdmin={() => {
                if (isAdminAuthenticated) {
                  setCurrentView('admin');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              isStandalone={true}
            />
          </div>
        )}

        {/* ADMIN DASHBOARD VIEW (Only accessible when authenticated) */}
        {isAdminAuthenticated && currentView === 'admin' && (
          <AdminDashboard
            menus={menus}
            setMenus={setMenus}
            profile={profile}
            setProfile={setProfile}
            logs={logs}
            setLogs={setLogs}
            onOpenPublicPreview={() => setCurrentView('public')}
            onOpenQR={() => setIsQRModalOpen(true)}
            onSimulateClick={handleSimulateClick}
            onClearLogs={handleClearLogs}
            adminPin={adminPin}
            setAdminPin={setAdminPin}
            onLogout={handleAdminLogout}
          />
        )}

        {/* SPLIT DUAL VIEW (Admin Workspace on Left + Live Interactive Public Microsite on Right) */}
        {isAdminAuthenticated && currentView === 'split' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[calc(100vh-56px)] bg-slate-100/60">
            {/* Left 7 cols: Admin Controls */}
            <div className="lg:col-span-7 border-r border-slate-200 overflow-y-auto max-h-[calc(100vh-56px)] bg-slate-50">
              <AdminDashboard
                menus={menus}
                setMenus={setMenus}
                profile={profile}
                setProfile={setProfile}
                logs={logs}
                setLogs={setLogs}
                onOpenPublicPreview={() => setCurrentView('public')}
                onOpenQR={() => setIsQRModalOpen(true)}
                onSimulateClick={handleSimulateClick}
                onClearLogs={handleClearLogs}
                adminPin={adminPin}
                setAdminPin={setAdminPin}
                onLogout={handleAdminLogout}
              />
            </div>

            {/* Right 5 cols: Live Public Microsite Screen */}
            <div className="lg:col-span-5 bg-slate-200/50 overflow-y-auto max-h-[calc(100vh-56px)] p-6 flex flex-col items-center justify-start">
              <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Visitor Simulator
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded font-mono font-semibold">
                    Interaktif
                  </span>
                </div>
                <PublicMicrosite
                  profile={profile}
                  menus={menus}
                  onMenuClick={handleMenuClick}
                  onOpenQR={() => setIsQRModalOpen(true)}
                  isStandalone={false}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        savedPin={adminPin}
      />

      {/* QR Code Sharing Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        profile={profile}
        publicUrl={window.location.href.split('#')[0].split('?')[0]}
      />
    </div>
  );
}

