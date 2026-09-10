import { useState } from 'react';
import { ArrowRight, Check, Layers, LockKeyhole, Package, ShieldCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context';
import { Logo, Button, Field, ErrorBox } from '../components';

export default function Login() {
  const { user, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Logo light />
        <div className="login-story-content">
          <span className="story-kicker">
            <i /> A little more organized. A lot more possible.
          </span>
          <h1>
            Your shop.
            <br />
            All together<span>.</span>
          </h1>
          <p>
            More clarity. Less busywork. A calmer way to manage your products, your people, and
            every shop you grow.
          </p>
          <div className="phone-scene" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="phone-illustration">
              <div className="phone-camera" />
              <div className="phone-screen">
                <div className="mini-greeting">YOUR WORKSPACE</div>
                <strong>Looking good.</strong>
                <div className="mini-chart">
                  {[28, 47, 36, 64, 53, 78, 94].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mini-product">
                  <span>
                    <Package size={16} />
                  </span>
                  <div>
                    Everything in its place<small>One connected catalog</small>
                  </div>
                  <Check size={15} />
                </div>
              </div>
            </div>
            <div className="floating-card float-left">
              <span>
                <Layers size={20} />
              </span>
              <div>
                One workspace<small>Every shop, connected</small>
              </div>
            </div>
            <div className="floating-card float-right">
              <span>
                <ShieldCheck size={20} />
              </span>
              <div>
                Made for your team<small>The right access, always</small>
              </div>
            </div>
          </div>
          <div className="story-features">
            <span>
              <Check size={15} /> Organized inventory
            </span>
            <span>
              <Check size={15} /> Connected teams
            </span>
          </div>
        </div>
        <footer>Built for the way you run your business.</footer>
      </section>
      <section className="login-form-panel">
        <div className="mobile-logo">
          <Logo />
        </div>
        <div className="login-form-wrap">
          <span className="login-icon">
            <LockKeyhole size={23} />
          </span>
          <div className="eyebrow">WELCOME TO YOUR WORKSPACE</div>
          <h2>Good to have you back.</h2>
          <p>Sign in to keep your business moving.</p>
          <form onSubmit={submit}>
            <ErrorBox error={error} />
            <Field
              label="Username, email or phone number"
              placeholder="Your username, email or +855…"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <Field
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" busy={busy} className="login-submit">
              Sign in to your workspace
              <ArrowRight size={17} />
            </Button>
          </form>
          <div className="login-help">
            <ShieldCheck size={16} />
            <span>Your workspace is private and access is protected.</span>
          </div>
          <div className="login-support">
            Need an account or help signing in?
            <br />
            <strong>Contact your shop administrator.</strong>
          </div>
        </div>
        <footer>
          PhoneShop Workspace <span>Simple. Connected. Yours.</span>
        </footer>
      </section>
    </main>
  );
}
