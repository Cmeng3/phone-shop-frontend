import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  Layers3,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';
import { api, formatNumber } from '../api';
import { useAuth } from '../context';
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Loading,
  PageHeading,
  ProductImage,
  TextLink,
} from '../components';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user.can_manage_catalog) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api('dashboard', { signal: controller.signal })
      .then((result) => setData(result.data))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision, user.can_manage_catalog]);
  if (!user.can_manage_catalog)
    return (
      <>
        <PageHeading
          eyebrow="YOUR WORKSPACE"
          title={`Welcome, ${user.username}.`}
          description="Your account is ready. Let’s get you the access you need."
        />
        <div className="panel">
          <Empty
            title="A workspace made for your role"
            description={
              user.tenant_id
                ? 'Ask for a catalog role to start managing your shop’s products.'
                : 'Your administrator needs to assign you to a shop before you can manage its catalog.'
            }
            action={
              <Button onClick={() => navigate('/role-requests')}>
                View role requests
                <ArrowRight size={16} />
              </Button>
            }
          />
        </div>
      </>
    );
  function exportSummary() {
    const content = [
      'Metric,Value',
      ...[
        'products',
        'units',
        'inventory_value',
        'brands',
        'categories',
        'low_stock',
        'pending_requests',
      ].map((key) => `${key},${data[key]}`),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phoneshop-overview.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  const maxCount = Math.max(1, ...(data?.monthly_products || []).map((m) => m.count));
  const availability = data?.availability || [];
  const availablePercent = data?.products ? (availability[0].count / data.products) * 100 : 0;
  const unavailablePercent = data?.products ? (availability[1].count / data.products) * 100 : 0;
  const stats = data
    ? [
        [
          'Total products',
          data.products,
          Smartphone,
          `${formatNumber(data.categories)} categories in your catalog`,
          '/products',
          'mint',
        ],
        [
          'Units in stock',
          data.units,
          Boxes,
          `${formatNumber(data.low_stock)} products need a stock check`,
          '/products?low_stock=true',
          'blue',
        ],
        [
          user.is_superuser ? 'Active shops' : 'Catalog brands',
          user.is_superuser ? data.active_tenants : data.brands,
          Building2,
          user.is_superuser
            ? `${data.tenants} shops across your workspace`
            : 'Your catalog, organized by brand',
          user.is_superuser ? '/tenants' : '/brands',
          'violet',
        ],
        [
          'Pending requests',
          data.pending_requests,
          ClipboardCheck,
          'Keep your team moving forward',
          '/role-requests?status=PENDING',
          'amber',
        ],
      ]
    : [];
  return (
    <>
      <PageHeading
        eyebrow="A CLEAR VIEW OF YOUR BUSINESS"
        title="Workspace overview"
        description={`Welcome back, ${user.username}. Here’s how things are looking today.`}
      >
        <Button variant="secondary" disabled={!data || loading} onClick={exportSummary}>
          <ArrowDownToLine size={16} />
          Export overview
        </Button>
        <Button onClick={() => navigate('/products?create=1')}>
          <Plus size={17} />
          Add product
        </Button>
      </PageHeading>
      <ErrorBox error={error} retry={() => setRevision((v) => v + 1)} />
      {loading ? (
        <Loading label="Bringing your workspace together…" />
      ) : (
        data && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="welcome-label">
                  <Sparkles size={15} /> ROOM TO GROW
                </span>
                <h2>
                  Good business starts
                  <br />
                  with a little clarity.
                </h2>
                <p>Your inventory, shops, and team. One connected view.</p>
                <Link to="/products">
                  Explore your catalog <ArrowRight size={16} />
                </Link>
              </div>
              <div className="banner-graphic" aria-hidden="true">
                <div className="graphic-grid" />
                <div className="graphic-phone phone-back">
                  <i />
                  <span />
                </div>
                <div className="graphic-phone phone-front">
                  <i />
                  <span />
                  <b />
                  <em />
                </div>
                <div className="graphic-check">
                  <ShieldCheck size={26} />
                </div>
              </div>
              <div className="banner-date">
                <CalendarDays size={15} />
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </section>
            <section className="stats-grid" aria-label="Workspace statistics">
              {stats.map(([label, value, Icon, note, path, tone]) => (
                <button className="stat-card" key={label} onClick={() => navigate(path)}>
                  <div className="stat-head">
                    <span>{label}</span>
                    <span className={`stat-icon ${tone}`}>
                      <Icon size={19} />
                    </span>
                  </div>
                  <strong>{formatNumber(value)}</strong>
                  <div className="stat-foot">
                    <span>{note}</span>
                    <ArrowUpRight size={14} />
                  </div>
                </button>
              ))}
            </section>
            <div className="dashboard-charts">
              <section className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Catalog growth</h2>
                    <p>Products added over the last six months</p>
                  </div>
                  <span className="subtle-tag">6 months</span>
                </div>
                <div className="chart-summary">
                  <strong>
                    {formatNumber(data.monthly_products.reduce((sum, m) => sum + m.count, 0))}
                  </strong>
                  <span>products added</span>
                  <span className="chart-key">
                    <i />
                    New products
                  </span>
                </div>
                <div
                  className="bar-chart"
                  role="img"
                  aria-label={data.monthly_products
                    .map((m) => `${m.month}: ${m.count} products`)
                    .join(', ')}
                >
                  <div className="chart-grid">
                    <span>{maxCount}</span>
                    <span>{Math.round(maxCount / 2)}</span>
                    <span>0</span>
                  </div>
                  <div className="chart-bars">
                    {data.monthly_products.map((month, index) => (
                      <div className="bar-column" key={month.period}>
                        <div className="bar-track">
                          <div
                            className={`bar ${index === 5 ? 'current' : ''}`}
                            style={{
                              height: `${(month.count / maxCount) * 100}%`,
                              minHeight: month.count ? 7 : 2,
                            }}
                            tabIndex={0}
                            aria-label={`${month.month}: ${month.count} products`}
                          >
                            <span className="bar-tooltip">{month.count} products</span>
                          </div>
                        </div>
                        <span>{month.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              <section className="panel availability-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Inventory at a glance</h2>
                    <p>A home for every product</p>
                  </div>
                  <Layers3 size={18} className="muted" />
                </div>
                <div
                  className="donut"
                  style={{
                    background: data.products
                      ? `conic-gradient(#1c8970 0% ${availablePercent}%, #efb768 ${availablePercent}% ${availablePercent + unavailablePercent}%, #dfe6e3 ${availablePercent + unavailablePercent}% 100%)`
                      : '#e9eeeb',
                  }}
                  role="img"
                  aria-label={availability.map((v) => `${v.name}: ${v.count}`).join(', ')}
                >
                  <div>
                    <strong>{formatNumber(data.products)}</strong>
                    <span>Total products</span>
                  </div>
                </div>
                <div className="chart-legend">
                  {availability.map((item, i) => (
                    <button
                      key={item.name}
                      onClick={() => navigate(`/products?status=${item.name.toUpperCase()}`)}
                    >
                      <i style={{ background: ['#1c8970', '#efb768', '#dfe6e3'][i] }} />
                      <span>{item.name}</span>
                      <strong>{formatNumber(item.count)}</strong>
                    </button>
                  ))}
                </div>
              </section>
            </div>
            <div className="dashboard-bottom">
              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Fresh on the shelves</h2>
                    <p>The latest additions to your catalog</p>
                  </div>
                  <TextLink onClick={() => navigate('/products')}>View all</TextLink>
                </div>
                {data.recent_products.length ? (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Brand</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_products.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <button
                                className="product-cell"
                                onClick={() =>
                                  navigate(`/products?search=${encodeURIComponent(product.sku)}`)
                                }
                              >
                                <ProductImage src={product.image} name={product.name} />
                                <span>
                                  <strong>{product.name}</strong>
                                  <small>{product.sku}</small>
                                </span>
                              </button>
                            </td>
                            <td>{product.brand_name}</td>
                            <td>{formatNumber(product.price)}</td>
                            <td>
                              <span className={product.stock <= 5 ? 'stock-low' : ''}>
                                {product.stock} units
                              </span>
                            </td>
                            <td>
                              <Badge value={product.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="Your next bestseller belongs here"
                    description="Add your first product to bring your catalog to life."
                    action={
                      <Button variant="secondary" onClick={() => navigate('/products?create=1')}>
                        <Plus size={16} />
                        Add your first product
                      </Button>
                    }
                  />
                )}
              </section>
              <section className="attention-panel">
                <span className="attention-icon">
                  <CircleAlert size={23} />
                </span>
                <h2>
                  A little attention
                  <br />
                  goes a long way.
                </h2>
                <p>
                  {data.low_stock
                    ? `${data.low_stock} products have 5 units or fewer. Keep your shelves ready for what’s next.`
                    : 'Your stock is looking healthy. Keep an eye on your inventory as your catalog grows.'}
                </p>
                <Button variant="secondary" onClick={() => navigate('/products?low_stock=true')}>
                  Review stock
                  <ArrowRight size={15} />
                </Button>
                <div className="inventory-value">
                  <span>Total listed inventory value</span>
                  <strong>{formatNumber(data.inventory_value)}</strong>
                  <small>Stock × current listed price</small>
                </div>
              </section>
            </div>
            <div className="overview-foot">
              <span>
                <i className="status-dot" />
                Live from your workspace
              </span>
              <button className="text-link" onClick={() => setRevision((v) => v + 1)}>
                <RefreshCw size={13} />
                Refresh overview
              </button>
            </div>
          </>
        )
      )}
    </>
  );
}
