import { Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Wallet,
  CreditCard,
  Building2,
  Menu,
  X,
  Target,
} from 'lucide-react';
import { useState } from 'react';

import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Treasury from './pages/Treasury';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contactos' },
  { to: '/invoices', icon: FileText, label: 'Facturas' },
  { to: '/products', icon: Package, label: 'Productos' },
  { to: '/treasury', icon: Building2, label: 'Tesoreria' },
  { to: '/payments', icon: CreditCard, label: 'Pagos' },
  { to: '/expenses', icon: Wallet, label: 'Gastos' },
  { to: '/budget', icon: Target, label: 'Objetivos' },
];

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-red-600">AS DE LAS CARNES</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center px-6 border-b border-gray-200 bg-white">
          <button className="lg:hidden mr-4" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="text-sm text-gray-500">
            AS DE LAS CARNES DASHBOARD
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/products" element={<Products />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/budget" element={<Budget />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
