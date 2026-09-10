import { useState } from 'react';
import { Building2, Check, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../api';
import { useAuth, useToast } from '../context';
import { Badge, Button, ErrorBox, Field, PageHeading } from '../components';

export default function Profile() {
  const { user, refresh, signedOut } = useAuth();
  const notify = useToast();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    phone: user.phone || '',
  });
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirmation: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api('auth/profile', { method: 'PATCH', body: form });
      await refresh();
      notify('Your profile is up to date.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  async function changePassword(e) {
    e.preventDefault();
    setError(null);
    if (passwords.new_password !== passwords.confirmation) {
      setError(new Error('Your new passwords do not match.'));
      return;
    }
    setBusy(true);
    try {
      await api('auth/change-password', {
        method: 'POST',
        body: {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        },
      });
      signedOut();
      notify('Password updated. Sign in with your new password.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="A WORKSPACE THAT’S YOURS"
        title="My account"
        description="Keep your details current and your account protected."
      />
      <div className="profile-layout">
        <aside className="panel profile-card">
          <div className="profile-cover" />
          <div className="profile-avatar">{user.username.slice(0, 2).toUpperCase()}</div>
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <span className="permission-tag enabled">
            <ShieldCheck size={14} />
            {user.is_superuser ? 'Super Admin' : user.role_name || 'Member'}
          </span>
          <div className="profile-facts">
            <div>
              <Building2 size={17} />
              <span>
                <small>Workspace</small>
                <strong>
                  {user.is_superuser ? 'All shops' : user.tenant_name || 'Awaiting shop assignment'}
                </strong>
              </span>
            </div>
            <div>
              <ShieldCheck size={17} />
              <span>
                <small>Account status</small>
                <Badge value={user.is_active} />
              </span>
            </div>
          </div>
          <div className="profile-note">
            <Check size={15} />
            <span>Your permissions are managed by your administrator.</span>
          </div>
        </aside>
        <section className="panel profile-form">
          <div className="tabs" role="tablist" aria-label="Account settings">
            <button
              role="tab"
              aria-selected={tab === 'profile'}
              aria-controls="account-panel"
              onClick={() => {
                setTab('profile');
                setError(null);
              }}
            >
              <UserRound size={17} />
              Personal information
            </button>
            <button
              role="tab"
              aria-selected={tab === 'security'}
              aria-controls="account-panel"
              onClick={() => {
                setTab('security');
                setError(null);
              }}
            >
              <KeyRound size={17} />
              Password & security
            </button>
          </div>
          <div id="account-panel" role="tabpanel">
            {tab === 'profile' ? (
              <form onSubmit={saveProfile}>
                <div className="settings-body">
                  <h2>A few details about you</h2>
                  <p>These details identify you across your workspace.</p>
                  <ErrorBox error={error} />
                  <div className="form-grid">
                    <Field
                      label="Username"
                      required
                      maxLength={150}
                      autoComplete="username"
                      value={form.username}
                      error={error?.fields?.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                    <Field
                      label="Email address"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      error={error?.fields?.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <Field
                      label="Phone number"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      error={error?.fields?.phone}
                      hint="International format, e.g. +85512345678."
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="settings-footer">
                  <span>
                    <ShieldCheck size={15} />
                    Your details stay in your workspace.
                  </span>
                  <Button busy={busy} type="submit">
                    Save changes
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={changePassword}>
                <div className="settings-body">
                  <h2>Keep your account protected</h2>
                  <p>Choose a unique password you haven’t used elsewhere.</p>
                  <ErrorBox error={error} />
                  <div className="security-fields">
                    <Field
                      label="Current password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={passwords.current_password}
                      error={error?.fields?.current_password}
                      onChange={(e) =>
                        setPasswords({ ...passwords, current_password: e.target.value })
                      }
                    />
                    <Field
                      label="New password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={passwords.new_password}
                      error={error?.fields?.password || error?.fields?.new_password}
                      hint="At least 8 characters. Avoid common passwords and personal details."
                      onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    />
                    <Field
                      label="Confirm new password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={passwords.confirmation}
                      onChange={(e) => setPasswords({ ...passwords, confirmation: e.target.value })}
                    />
                  </div>
                  <div className="info-box">
                    <KeyRound size={18} />
                    <p>
                      After changing your password, you’ll sign in again. Your existing API session
                      will end.
                    </p>
                  </div>
                </div>
                <div className="settings-footer">
                  <span>Make a fresh start with a stronger password.</span>
                  <Button busy={busy} type="submit">
                    Update password
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
