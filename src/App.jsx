import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Boxes,
  Building2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Tags,
  UserRound,
  Users,
  X,
  Layers3,
} from 'lucide-react';
import { useAuth, useToast } from './context';
import { Button, ErrorBox, Loading, Logo } from './components';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ResourcePage from './pages/ResourcePage';
import Profile from './pages/Profile';
import Help from './pages/Help';

const links = [
  {
    section: 'WORKSPACE',
    items: [
      ['/dashboard', 'Overview', LayoutDashboard],
      ['/products', 'Products', Smartphone, 'catalog'],
      ['/product-lines', 'Product lines', Layers3, 'catalog'],
      ['/categories', 'Categories', Boxes, 'catalog'],
      ['/brands', 'Brands', Tags, 'catalog'],
    ],
  },
  {
    section: 'ADMINISTRATION',
    items: [
      ['/tenants', 'Shops & tenants', Building2, 'admin'],
      ['/users', 'Team members', Users, 'admin'],
      ['/roles', 'Roles & permissions', ShieldCheck, 'admin'],
      ['/role-requests', 'Role requests', ClipboardList],
    ],
  },
];

function Workspace() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const title =
    links.flatMap((group) => group.items).find((item) => item[0] === location.pathname)?.[1] ||
    (location.pathname === '/profile' ? 'My profile' : 'Workspace guide');
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    document.title = `${title} · PhoneShop`;
  }, [location.pathname, title]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  async function signOut() {
    setBusy(true);
    try {
      await logout();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }
  const allowed = (kind) =>
    kind === 'admin' ? user.is_superuser : kind === 'catalog' ? user.can_manage_catalog : true;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Logo light />
          <button
            className="mobile-close icon-button"
            aria-label="Close menu"
            onClick={() => setMenu(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>{user.is_superuser ? 'All shops' : user.tenant_name || 'My workspace'}</strong>
            <small>
              {user.is_superuser ? 'Super admin workspace' : user.role_name || 'Member workspace'}
            </small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {links.map((group) => (
            <div className="nav-group" key={group.section}>
              <div className="nav-label">{group.section}</div>
              {group.items
                .filter((item) => allowed(item[3]))
                .map(([path, label, Icon]) => (
                  <NavLink key={path} to={path}>
                    <Icon size={19} />
                    <span>{label}</span>
                    <ChevronRight className="nav-chevron" size={14} />
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="status-dot" />
            <strong>Your next chapter starts here.</strong>
            <p>A little clarity for every busy day.</p>
          </div>
          <NavLink to="/help" className="utility-link">
            <CircleHelp size={18} />
            Workspace guide
          </NavLink>
          <NavLink to="/profile" className="utility-link">
            <Settings2 size={18} />
            Account settings
          </NavLink>
          <button className="sidebar-user" onClick={() => navigate('/profile')}>
            <span className="avatar">{user.username.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{user.username}</strong>
              <small>{user.is_superuser ? 'Super Admin' : user.role_name || 'Member'}</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <button className="signout" onClick={signOut} disabled={busy}>
            <LogOut size={16} />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            {user.can_manage_catalog && (
              <form
                className="global-search"
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate(`/products?search=${encodeURIComponent(search)}`);
                }}
              >
                <Search size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a product…"
                  aria-label="Search all products"
                />
              </form>
            )}
            <NavLink
              to="/role-requests"
              className="notification-button"
              aria-label="View role requests"
            >
              <Bell size={19} />
            </NavLink>
            <div className="topbar-divider" />
            <NavLink to="/profile" className="header-avatar" aria-label="Open my profile">
              {user.username.slice(0, 2).toUpperCase()}
            </NavLink>
          </div>
        </header>
        <main id="main-content" className="page-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            {['products', 'product-lines', 'categories', 'brands'].map((resource) => (
              <Route
                key={resource}
                path={`/${resource}`}
                element={
                  user.can_manage_catalog ? (
                    <ResourcePage key={resource} resource={resource} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
            ))}
            {['tenants', 'users', 'roles'].map((resource) => (
              <Route
                key={resource}
                path={`/${resource}`}
                element={
                  user.is_superuser ? (
                    <ResourcePage key={resource} resource={resource} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
            ))}
            <Route path="/role-requests" element={<ResourcePage resource="role-requests" />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <footer className="workspace-footer">
            <span>PhoneShop Workspace</span>
            <span>Everything in its place.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, bootstrapError, bootstrap } = useAuth();
  if (loading)
    return (
      <div className="boot-screen">
        <Logo />
        <Loading />
      </div>
    );
  if (bootstrapError)
    return (
      <div className="boot-screen">
        <Logo />
        <ErrorBox error={bootstrapError} />
        <Button onClick={bootstrap}>Reconnect</Button>
      </div>
    );
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={user ? <Workspace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}
