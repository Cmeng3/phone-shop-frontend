import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Ban,
  Download,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from 'lucide-react';
import { api, allRecords, downloadCsv, formatDate, formatNumber } from '../api';
import { useAuth, useToast } from '../context';
import {
  Badge,
  Button,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeading,
  ProductImage,
} from '../components';
import { resources, filterSources, titleCase } from '../resources';

function useLookups(config, user, revision) {
  const sources = [
    ...new Set(
      [
        ...config.fields.filter((f) => !f.adminOnly || user.is_superuser).map((f) => f.source),
        ...config.filters
          .filter((key) => key !== 'tenant_id' || user.is_superuser)
          .map((key) => filterSources[key]?.[1]),
      ].filter(Boolean),
    ),
  ];
  const key = sources.join('|');
  const [state, setState] = useState({ data: {}, loading: true, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    setState((old) => ({ ...old, loading: true, error: '' }));
    Promise.all(
      sources.map(async (source) => [source, await allRecords(source, controller.signal)]),
    )
      .then((entries) => setState({ data: Object.fromEntries(entries), loading: false, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError')
          setState({ data: {}, loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [key, revision]);
  return state;
}

export default function ResourcePage({ resource }) {
  const config = resources[resource];
  const { user } = useAuth();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const [revision, setRevision] = useState(0);
  const [search, setSearch] = useState(params.get('search') || '');
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const lookup = useLookups(config, user, revision);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = new URLSearchParams(
    [...params.entries()].filter(([key]) => key !== 'create'),
  ).toString();
  useEffect(() => {
    setSearch(params.get('search') || '');
  }, [params.get('search')]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (params.get('search') || '')) {
        const next = new URLSearchParams(params);
        search ? next.set('search', search) : next.delete('search');
        next.delete('page');
        setParams(next, { replace: true });
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [search, params, setParams]);
  useEffect(() => {
    if (params.has('create')) {
      if (resource !== 'role-requests' || (!user.is_superuser && user.tenant_id))
        setModal({ type: 'edit', row: null });
      const next = new URLSearchParams(params);
      next.delete('create');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api(`${resource}${query ? '?' + query : ''}`, { signal: controller.signal })
      .then((result) => {
        setRows(result.data);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [resource, query, revision]);
  const changeFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key === 'tenant_id') {
      next.delete('category_id');
      next.delete('brand_id');
    }
    if (key !== 'page') next.delete('page');
    setParams(next);
  };
  const name = (source, id) =>
    lookup.data[source]?.find((item) => String(item.id) === String(id))?.name ||
    (id ? `#${id}` : 'Not assigned');
  const refreshed = (message) => {
    setModal(null);
    if (page > 1 && rows.length === 1) changeFilter('page', String(page - 1));
    setRevision((r) => r + 1);
    notify(message);
  };
  const allowCreate = resource !== 'role-requests' || (!user.is_superuser && user.tenant_id);
  const filterCount = [...params.entries()].filter(
    ([key]) => !['page', 'ordering'].includes(key),
  ).length;
  function filterOptions(key) {
    const options = lookup.data[filterSources[key][1]] || [];
    const shop = params.get('tenant_id');
    return shop && ['category_id', 'brand_id'].includes(key)
      ? options.filter((option) => String(option.tenant_id) === shop)
      : options;
  }
  function optionLabel(option) {
    return user.is_superuser && option.tenant_id
      ? `${option.name} · ${name('tenants', option.tenant_id)}`
      : option.name;
  }
  async function exportProducts() {
    setExporting(true);
    try {
      const filters = new URLSearchParams(query);
      filters.delete('page');
      const records = await allRecords(`products?${filters}`);
      downloadCsv(
        'phoneshop-products.csv',
        ['Product', 'SKU', 'Shop', 'Brand', 'Category', 'Price', 'Stock', 'Status'],
        records.map((row) => [
          row.name,
          row.sku,
          row.tenant_name,
          row.brand_name,
          row.category_name,
          row.price,
          row.stock,
          row.status,
        ]),
      );
      notify(`Exported ${records.length} products matching your filters.`);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setExporting(false);
    }
  }
  const headers = {
    products: [
      'Product',
      'Brand / category',
      ...(user.is_superuser ? ['Shop'] : []),
      'Price',
      'Stock',
      'Status',
    ],
    'product-lines': ['Product line', 'Category', 'Brand', 'Created'],
    categories: ['Category', 'Slug', ...(user.is_superuser ? ['Shop'] : []), 'Created'],
    brands: ['Brand', ...(user.is_superuser ? ['Shop'] : []), 'Status', 'Created'],
    tenants: ['Shop', 'Type', 'Status', 'Created'],
    roles: ['Role', 'Catalog permission', 'Created'],
    users: ['Team member', 'Shop', 'Role', 'Status'],
    'role-requests': ['Requested role', 'Requested by', 'Reason', 'Status', 'Submitted'],
  }[resource];
  function cells(row) {
    const title = (main, sub, image) => (
      <div className="record-cell">
        {image !== undefined && <ProductImage src={image} name={main} />}
        <div>
          <strong>{main}</strong>
          {sub && <small>{sub}</small>}
        </div>
      </div>
    );
    switch (resource) {
      case 'products':
        return [
          title(row.name, row.sku, row.image),
          title(row.brand_name, row.category_name),
          ...(user.is_superuser ? [row.tenant_name] : []),
          formatNumber(row.price),
          <span className={row.stock <= 5 ? 'stock-low' : ''}>{row.stock} units</span>,
          <Badge value={row.status} />,
        ];
      case 'product-lines':
        return [
          title(row.name, `Line #${row.id}`),
          name('categories', row.category_id),
          name('brands', row.brand_id),
          formatDate(row.created_at),
        ];
      case 'categories':
        return [
          title(row.name, row.description),
          <code>{row.slug}</code>,
          ...(user.is_superuser ? [name('tenants', row.tenant_id)] : []),
          formatDate(row.created_at),
        ];
      case 'brands':
        return [
          title(row.name, row.description, row.logo_url),
          ...(user.is_superuser ? [name('tenants', row.tenant_id)] : []),
          <Badge value={row.status} />,
          formatDate(row.created_at),
        ];
      case 'tenants':
        return [
          title(row.name, `Shop #${row.id}`),
          <span className="subtle-tag">{row.type}</span>,
          <Badge value={row.status} />,
          formatDate(row.created_at),
        ];
      case 'roles':
        return [
          title(row.name, row.description),
          <span className={`permission-tag ${row.can_manage_catalog ? 'enabled' : ''}`}>
            <ShieldCheck size={14} />
            {row.can_manage_catalog ? 'Can manage catalog' : 'No catalog access'}
          </span>,
          formatDate(row.created_at),
        ];
      case 'users':
        return [
          <div className="record-cell">
            <span className="table-avatar">{row.username.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{row.username}</strong>
              <small>{row.email}</small>
            </div>
          </div>,
          row.tenant_name || 'Not assigned',
          row.is_superuser ? 'Super Admin' : row.role_name || 'Not assigned',
          <Badge value={row.is_active} />,
        ];
      default:
        return [
          title(row.role_name, `Request #${row.id}`),
          row.username,
          <span className="truncate" title={row.reason}>
            {row.reason || 'No reason provided'}
          </span>,
          <Badge value={row.status} />,
          formatDate(row.created_at),
        ];
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={
          ['users', 'tenants', 'roles', 'role-requests'].includes(resource)
            ? 'PEOPLE & WORKSPACES'
            : 'YOUR CATALOG, ORGANIZED'
        }
        title={config.title}
        description={config.description}
      >
        {resource === 'products' && (
          <Button
            variant="secondary"
            busy={exporting}
            disabled={loading || !!error || !rows.length}
            onClick={exportProducts}
          >
            <Download size={17} /> Export products
          </Button>
        )}
        {allowCreate && (
          <Button onClick={() => setModal({ type: 'edit', row: null })}>
            <Plus size={17} />
            {resource === 'role-requests' ? 'Request a role' : `Add ${config.singular}`}
          </Button>
        )}
      </PageHeading>
      <section className="panel resource-panel">
        <div className="resource-top">
          <div>
            <h2>
              {resource === 'role-requests' && !user.is_superuser
                ? 'My requests'
                : `All ${resource === 'users' ? 'team members' : resource === 'tenants' ? 'shops' : resource.replaceAll('-', ' ')}`}
              <span className="count-pill">{pagination?.count ?? '—'}</span>
            </h2>
            <p>
              {filterCount
                ? 'Showing records that match your filters.'
                : 'Browse, update and organize your records.'}
            </p>
          </div>
          <span className="resource-label">
            <span className="status-dot" />
            {user.is_superuser ? 'All shops' : user.tenant_name || 'My workspace'}
          </span>
        </div>
        <div className="filter-bar">
          {!config.noSearch && (
            <div className="table-search">
              <Search size={17} />
              <input
                aria-label={`Search ${resource}`}
                placeholder={`Search ${resource.replaceAll('-', ' ')}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch('')}>
                  <X size={15} />
                </button>
              )}
            </div>
          )}
          <div className="filter-controls">
            <Filter size={16} className="muted" />
            {config.filters
              .filter((key) => key !== 'tenant_id' || user.is_superuser)
              .map((key) =>
                key === 'status' ? (
                  <select
                    key={key}
                    aria-label="Filter by status"
                    value={params.get(key) || ''}
                    onChange={(e) => changeFilter(key, e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {config.statuses.map((value) => (
                      <option key={value} value={value}>
                        {titleCase(value)}
                      </option>
                    ))}
                  </select>
                ) : key === 'type' ? (
                  <input
                    key={key}
                    aria-label="Filter by shop type"
                    placeholder="Shop type"
                    value={params.get(key) || ''}
                    onChange={(e) => changeFilter(key, e.target.value)}
                  />
                ) : (
                  <select
                    key={key}
                    aria-label={`Filter by ${filterSources[key][0].toLowerCase()}`}
                    value={params.get(key) || ''}
                    onChange={(e) => changeFilter(key, e.target.value)}
                  >
                    <option value="">
                      All{' '}
                      {key === 'category_id'
                        ? 'categories'
                        : `${filterSources[key][0].toLowerCase()}s`}
                    </option>
                    {filterOptions(key).map((option) => (
                      <option key={option.id} value={option.id}>
                        {optionLabel(option)}
                      </option>
                    ))}
                  </select>
                ),
              )}
            {resource === 'products' && (
              <button
                className={`filter-chip ${params.get('low_stock') ? 'selected' : ''}`}
                aria-pressed={params.get('low_stock') === 'true'}
                onClick={() => changeFilter('low_stock', params.get('low_stock') ? '' : 'true')}
              >
                Low stock
              </button>
            )}
            {filterCount > 0 && (
              <button
                className="clear-filters"
                onClick={() => {
                  setSearch('');
                  setParams({});
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        <div className="catalog-toolbar">
          <span>
            {resource === 'products'
              ? 'Low stock means 5 units or fewer, excluding archived products.'
              : 'Changes are saved to your shop workspace.'}
          </span>
          <div>
            {resource === 'products' && (
              <select
                aria-label="Sort products"
                value={params.get('ordering') || '-created_at,-id'}
                onChange={(e) => changeFilter('ordering', e.target.value)}
              >
                <option value="-created_at,-id">Newest first</option>
                <option value="name,id">Name: A to Z</option>
                <option value="price,id">Price: low to high</option>
                <option value="-price,-id">Price: high to low</option>
                <option value="stock,id">Stock: low to high</option>
              </select>
            )}
            <Button
              variant="secondary"
              className="small"
              disabled={loading}
              onClick={() => setRevision((r) => r + 1)}
            >
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>
        <ErrorBox error={error || lookup.error} retry={() => setRevision((r) => r + 1)} />
        {loading ? (
          <Loading label={`Loading ${resource.replaceAll('-', ' ')}…`} />
        ) : (
          !error &&
          (rows.length ? (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {headers.map((header) => (
                        <th key={header}>{header}</th>
                      ))}
                      <th className="actions-heading">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        {cells(row).map((cell, index) => (
                          <td key={index}>{cell}</td>
                        ))}
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              title="View details"
                              aria-label={`View ${row.name || row.username || 'request ' + row.id}`}
                              onClick={() => setModal({ type: 'detail', row })}
                            >
                              <Eye size={16} />
                            </button>
                            {resource === 'role-requests' ? (
                              user.is_superuser &&
                              row.status === 'PENDING' && (
                                <>
                                  <button
                                    className="icon-button accept"
                                    aria-label={`Approve request ${row.id}`}
                                    title="Approve request"
                                    onClick={() => setModal({ type: 'approve', row })}
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    className="icon-button danger-text"
                                    aria-label={`Reject request ${row.id}`}
                                    title="Reject request"
                                    onClick={() => setModal({ type: 'reject', row })}
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              )
                            ) : resource === 'users' ? (
                              !row.is_superuser && (
                                <>
                                  <button
                                    className="icon-button"
                                    aria-label={`Change role for ${row.username}`}
                                    title="Change role"
                                    onClick={() => setModal({ type: 'change-role', row })}
                                  >
                                    <UserCog size={16} />
                                  </button>
                                  <button
                                    className="icon-button"
                                    aria-label={`${row.is_active ? 'Ban' : 'Unban'} ${row.username}`}
                                    title={row.is_active ? 'Ban user' : 'Unban user'}
                                    onClick={() =>
                                      setModal({ type: row.is_active ? 'ban' : 'unban', row })
                                    }
                                  >
                                    {row.is_active ? <Ban size={16} /> : <Check size={16} />}
                                  </button>
                                  <button
                                    className="icon-button danger-text"
                                    aria-label={`Delete ${row.username}`}
                                    title="Delete user"
                                    onClick={() => setModal({ type: 'delete', row })}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )
                            ) : (
                              <>
                                <button
                                  className="icon-button"
                                  title="Edit"
                                  aria-label={`Edit ${row.name}`}
                                  onClick={() => setModal({ type: 'edit', row })}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="icon-button danger-text"
                                  title="Delete"
                                  aria-label={`Delete ${row.name}`}
                                  onClick={() => setModal({ type: 'delete', row })}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>
                  Showing {(page - 1) * 50 + 1}–{(page - 1) * 50 + rows.length} of{' '}
                  {formatNumber(pagination?.count)} records
                </span>
                <div>
                  <button
                    className="button secondary small"
                    disabled={!pagination?.previous}
                    onClick={() => changeFilter('page', String(page - 1))}
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    className="button secondary small"
                    disabled={!pagination?.next}
                    onClick={() => changeFilter('page', String(page + 1))}
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Empty
              title={
                filterCount
                  ? 'No matches this time'
                  : `A fresh start for your ${resource.replaceAll('-', ' ')}`
              }
              description={
                filterCount
                  ? 'Try a different search or clear your filters to see more.'
                  : `Add your first ${config.singular} to get things moving.`
              }
              action={
                filterCount ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setParams({});
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  allowCreate && (
                    <Button
                      variant="secondary"
                      onClick={() => setModal({ type: 'edit', row: null })}
                    >
                      <Plus size={16} />
                      Add {config.singular}
                    </Button>
                  )
                )
              }
            />
          ))
        )}
      </section>
      {modal?.type === 'edit' && (
        <EditModal
          resource={resource}
          config={config}
          row={modal.row}
          lookup={lookup}
          user={user}
          onClose={() => setModal(null)}
          onSave={refreshed}
        />
      )}
      {modal?.type === 'detail' && (
        <DetailModal
          resource={resource}
          row={modal.row}
          onClose={() => setModal(null)}
          name={name}
        />
      )}
      {modal && !['detail', 'edit'].includes(modal.type) && (
        <ActionModal
          resource={resource}
          config={config}
          action={modal.type}
          row={modal.row}
          lookup={lookup}
          user={user}
          onClose={() => setModal(null)}
          onSave={refreshed}
        />
      )}
    </>
  );
}

function EditModal({ resource, config, row, lookup, user, onClose, onSave }) {
  const fields = config.fields.filter((f) => !f.adminOnly || user.is_superuser);
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [f.key, f.type === 'file' ? null : (row?.[f.key] ?? f.default ?? '')]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileField = fields.find((field) => field.type === 'file');
  const selectedImage = fileField ? values[fileField.key] : null;
  useEffect(() => {
    if (!selectedImage) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(selectedImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);
  const currentTenant = values.tenant || values.tenant_id || user.tenant_id;
  function options(field) {
    if (field.options) return field.options.map((value) => ({ id: value, name: titleCase(value) }));
    let items = lookup.data[field.source] || [];
    if (['brands', 'categories'].includes(field.source) && currentTenant)
      items = items.filter((item) => String(item.tenant_id) === String(currentTenant));
    if (resource === 'product-lines' && field.source === 'brands' && values.category_id) {
      const cat = lookup.data.categories?.find(
        (item) => String(item.id) === String(values.category_id),
      );
      if (cat) items = items.filter((item) => String(item.tenant_id) === String(cat.tenant_id));
    }
    if (field.source === 'product-lines')
      items = items.filter(
        (item) =>
          String(item.category_id) === String(values.category) &&
          String(item.brand_id) === String(values.brand),
      );
    if (resource === 'role-requests') items = items.filter((item) => item.id !== user.role_id);
    return items.map((item) => ({
      ...item,
      name:
        user.is_superuser && item.tenant_id && !currentTenant
          ? `${item.name} · ${lookup.data.tenants?.find((shop) => String(shop.id) === String(item.tenant_id))?.name || `Shop #${item.tenant_id}`}`
          : item.name,
    }));
  }
  function update(field, value) {
    setValues((old) => {
      const next = { ...old, [field.key]: value };
      if (
        ['tenant', 'tenant_id'].includes(field.key) &&
        ['products', 'brands', 'categories'].includes(resource)
      ) {
        if ('category' in next) next.category = '';
        if ('brand' in next) next.brand = '';
        if ('product_line' in next) next.product_line = '';
      }
      if (['category', 'brand'].includes(field.key)) next.product_line = '';
      if (resource === 'product-lines' && field.key === 'category_id') next.brand_id = '';
      if (
        resource === 'categories' &&
        field.key === 'name' &&
        !row &&
        (!old.slug ||
          old.slug ===
            String(old.name)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''))
      )
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      return next;
    });
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = {};
      for (const field of fields) {
        if (field.immutable && row) continue;
        let value = values[field.key];
        if (field.type === 'file') {
          if (value) {
            if (value.size > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
            data[field.key] = value;
          } else if (removeImage) data[field.key] = null;
          continue;
        }
        if (field.type === 'select' && !field.required && value === '') value = null;
        if (field.type === 'number') value = value === '' ? null : Number(value);
        data[field.key] = value;
      }
      let body = data;
      if (Object.values(data).some((value) => value instanceof File)) {
        body = new FormData();
        Object.entries(data).forEach(([key, value]) =>
          body.append(key, value === null ? '' : value),
        );
      }
      await api(`${resource}${row ? '/' + row.id : ''}`, { method: row ? 'PATCH' : 'POST', body });
      onSave(
        `${titleCase(config.singular)} ${row ? 'updated' : resource === 'role-requests' ? 'submitted' : 'added'} successfully.`,
      );
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${row ? 'Edit' : resource === 'role-requests' ? 'New' : 'Add'} ${config.singular}`}
      description={
        row
          ? 'A few thoughtful updates. Everything stays in sync.'
          : 'The details that keep your workspace organized.'
      }
      onClose={onClose}
      busy={busy}
      wide
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <ErrorBox error={error || lookup.error} />
          {lookup.loading ? (
            <Loading label="Preparing your options…" />
          ) : (
            <div className="form-grid">
              {fields.map((field) =>
                field.type === 'checkbox' ? (
                  <label key={field.key} className="check-card full-width">
                    <input
                      type="checkbox"
                      checked={!!values[field.key]}
                      onChange={(e) => update(field, e.target.checked)}
                    />
                    <span>
                      <strong>{field.label}</strong>
                      <small>{field.hint}</small>
                    </span>
                  </label>
                ) : field.type === 'file' ? (
                  <div className="field full-width" key={field.key}>
                    <label htmlFor={field.key}>{field.label}</label>
                    {!removeImage && (preview || row?.[field.key]) && (
                      <ProductImage
                        className="upload-preview"
                        src={preview || row[field.key]}
                        name="Image preview"
                      />
                    )}
                    <div className="upload-field">
                      <ImagePlus size={25} />
                      <div>
                        <strong>{values[field.key]?.name || 'Choose an image'}</strong>
                        <small>PNG, JPG or WebP. Up to 5 MB.</small>
                      </div>
                      <input
                        id={field.key}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          update(field, e.target.files[0] || null);
                          setRemoveImage(false);
                        }}
                      />
                    </div>
                    {error?.fields?.[field.key] && (
                      <small className="field-error">{error.fields[field.key].join(' ')}</small>
                    )}
                    {row?.[field.key] && (
                      <label className="inline-check">
                        <input
                          type="checkbox"
                          checked={removeImage}
                          onChange={(e) => {
                            setRemoveImage(e.target.checked);
                            if (e.target.checked) update(field, null);
                          }}
                        />
                        Remove current image
                      </label>
                    )}
                  </div>
                ) : (
                  <div key={field.key} className={field.wide ? 'full-width' : ''}>
                    <Field
                      label={field.label}
                      type={field.type}
                      required={field.required}
                      maxLength={field.maxLength}
                      minLength={field.minLength}
                      pattern={field.pattern}
                      min={field.min}
                      step={field.step}
                      autoComplete={field.autoComplete}
                      hint={
                        field.immutable && row
                          ? 'Shop ownership stays with the original shop.'
                          : field.hint
                      }
                      error={error?.fields?.[field.key]}
                      value={values[field.key]}
                      disabled={field.immutable && !!row}
                      onChange={(e) => update(field, e.target.value)}
                    >
                      {field.type === 'select' ? (
                        <>
                          <option value="">
                            {field.required ? `Choose ${field.label.toLowerCase()}` : 'None'}
                          </option>
                          {options(field).map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </>
                      ) : undefined}
                    </Field>
                    {field.source && !options(field).length && (
                      <small className="field-note">
                        {field.source === 'product-lines'
                          ? 'Choose a category and brand to see matching lines. This field is optional.'
                          : `No ${field.source.replaceAll('-', ' ')} available. ${user.is_superuser ? 'Create one in the workspace first.' : 'Ask your administrator for help.'}`}
                      </small>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={busy} disabled={lookup.loading || !!lookup.error}>
            {row
              ? 'Save changes'
              : resource === 'role-requests'
                ? 'Submit request'
                : `Add ${config.singular}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ActionModal({ resource, config, action, row, lookup, user, onClose, onSave }) {
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(row.role_id || '');
  const [tenant, setTenant] = useState(row.tenant_id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const needsPassword = user.is_superuser && ['delete', 'ban', 'change-role'].includes(action);
  const destructive = ['delete', 'ban', 'reject'].includes(action);
  const label = action === 'change-role' ? 'Change role' : titleCase(action);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = {
        ...(needsPassword ? { admin_password: password } : {}),
        ...(action === 'change-role' ? { role_id: role, tenant_id: tenant } : {}),
      };
      await api(`${resource}/${row.id}${action === 'delete' ? '' : '/' + action}`, {
        method: action === 'delete' ? 'DELETE' : 'POST',
        body,
      });
      onSave(
        action === 'delete'
          ? `${titleCase(config.singular)} deleted.`
          : action === 'approve'
            ? 'Request approved. The new role is now assigned.'
            : action === 'reject'
              ? 'Request rejected.'
              : action === 'change-role'
                ? 'Shop and role assignment updated.'
                : action === 'ban'
                  ? 'User banned and signed out.'
                  : 'User access restored.',
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${label} ${action === 'change-role' ? 'assignment' : config.singular}?`}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <div className={`action-notice ${destructive ? 'warning' : ''}`}>
            <ShieldCheck size={23} />
            <div>
              <strong>{row.name || row.username || row.role_name}</strong>
              <p>
                {action === 'delete'
                  ? 'This permanently removes the record. Records with protected dependencies cannot be deleted.'
                  : action === 'ban'
                    ? 'This person will lose access and their current API session will end.'
                    : action === 'change-role'
                      ? 'Update this person’s shop and catalog role. They will need to sign in again.'
                      : action === 'approve'
                        ? 'Assign the requested role and end the user’s current API session.'
                        : action === 'reject'
                          ? 'Keep the current role. This review decision is final.'
                          : 'This person can sign in again with their existing credentials.'}
              </p>
            </div>
          </div>
          <ErrorBox error={error} />
          {action === 'change-role' && (
            <>
              <Field
                label="Shop"
                required
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
              >
                <option value="">Choose a shop</option>
                {(lookup.data.tenants || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Field>
              <Field label="Role" required value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">Choose a role</option>
                {(lookup.data['available-roles'] || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Field>
            </>
          )}
          {needsPassword && (
            <Field
              label="Confirm your admin password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Enter your own password to confirm this action."
            />
          )}
        </div>
        <div className="modal-footer">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={destructive ? 'danger' : 'primary'} busy={busy}>
            {label}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DetailModal({ resource, row, onClose, name }) {
  const labels = {
    tenant_id: 'Shop',
    tenant: 'Shop',
    category_id: 'Category',
    category: 'Category',
    brand_id: 'Brand',
    brand: 'Brand',
    role_id: 'Role',
    role: 'Role',
    product_line: 'Product line',
  };
  function value(key, item) {
    if (item === null || item === '') return '—';
    if (typeof item === 'boolean') return item ? 'Yes' : 'No';
    if (key.endsWith('_at')) return formatDate(item);
    if (labels[key]) {
      const source = key.startsWith('tenant')
        ? 'tenants'
        : key.startsWith('category')
          ? 'categories'
          : key.startsWith('brand')
            ? 'brands'
            : key.startsWith('role')
              ? 'available-roles'
              : 'product-lines';
      return row[`${key.replace('_id', '')}_name`] || name(source, item);
    }
    return String(item);
  }
  return (
    <Modal
      title={row.name || row.username || `Request #${row.id}`}
      description={`${titleCase(resources[resource].singular)} details`}
      onClose={onClose}
    >
      <div className="modal-body">
        {(row.image || row.logo_url) && (
          <ProductImage className="detail-image" src={row.image || row.logo_url} name={row.name} />
        )}
        <dl className="detail-list">
          {Object.entries(row)
            .filter(
              ([key]) =>
                ![
                  'image',
                  'logo_url',
                  'password',
                  'category_name',
                  'brand_name',
                  'tenant_name',
                  'role_name',
                ].includes(key),
            )
            .map(([key, item]) => (
              <div key={key}>
                <dt>{labels[key] || titleCase(key.replaceAll('_', ' '))}</dt>
                <dd>{key === 'status' ? <Badge value={item} /> : value(key, item)}</dd>
              </div>
            ))}
        </dl>
      </div>
      <div className="modal-footer">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
