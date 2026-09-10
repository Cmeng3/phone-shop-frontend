const text = (key, label, extra = {}) => ({ key, label, type: 'text', required: true, ...extra });
const relation = (key, label, source, extra = {}) => ({
  key,
  label,
  type: 'select',
  source,
  required: true,
  ...extra,
});
const status = (values = ['ACTIVE', 'INACTIVE']) => ({
  key: 'status',
  label: 'Status',
  type: 'select',
  options: values,
  required: true,
  default: values[0],
});
const description = { key: 'description', label: 'Description', type: 'textarea', wide: true };
const shop = (key) => relation(key, 'Shop', 'tenants', { adminOnly: true, immutable: true });
export const resources = {
  products: {
    title: 'Your product catalog',
    singular: 'product',
    description: 'A place for every phone, tablet, and next big thing.',
    fields: [
      text('name', 'Product name', { maxLength: 150, wide: true }),
      text('sku', 'SKU', { maxLength: 80 }),
      shop('tenant'),
      relation('category', 'Category', 'categories'),
      relation('brand', 'Brand', 'brands'),
      relation('product_line', 'Product line', 'product-lines', { required: false }),
      text('price', 'Listed price', { type: 'number', min: 0, step: '0.01' }),
      text('stock', 'Stock quantity', { type: 'number', min: 0, step: 1, default: 0 }),
      status(['AVAILABLE', 'UNAVAILABLE', 'ARCHIVED']),
      description,
      { key: 'image', label: 'Product image', type: 'file', wide: true },
    ],
    filters: ['tenant_id', 'category_id', 'brand_id', 'status'],
    statuses: ['AVAILABLE', 'UNAVAILABLE', 'ARCHIVED'],
  },
  'product-lines': {
    title: 'Product lines',
    singular: 'product line',
    description: 'Bring related products together. Keep your catalog easy to explore.',
    fields: [
      text('name', 'Product line name', { maxLength: 50, wide: true }),
      relation('category_id', 'Category', 'categories'),
      relation('brand_id', 'Brand', 'brands'),
    ],
    filters: ['tenant_id', 'category_id', 'brand_id'],
  },
  categories: {
    title: 'Categories',
    singular: 'category',
    description: 'Give every product a place to belong.',
    fields: [
      text('name', 'Category name', { maxLength: 50 }),
      text('slug', 'Slug', {
        maxLength: 50,
        pattern: '[-a-zA-Z0-9_]+',
        hint: 'Letters, numbers, hyphens and underscores.',
      }),
      shop('tenant_id'),
      description,
    ],
    filters: ['tenant_id'],
  },
  brands: {
    title: 'Brands',
    singular: 'brand',
    description: 'The names your customers know, beautifully organized.',
    fields: [
      text('name', 'Brand name', { maxLength: 50 }),
      shop('tenant_id'),
      status(),
      description,
      { key: 'logo_url', label: 'Brand logo', type: 'file', wide: true },
    ],
    filters: ['tenant_id', 'status'],
    statuses: ['ACTIVE', 'INACTIVE'],
  },
  tenants: {
    title: 'Shops & tenants',
    singular: 'shop',
    description: 'Every location. Every possibility. One connected workspace.',
    fields: [
      text('name', 'Shop name', { maxLength: 50 }),
      text('type', 'Shop type', { maxLength: 30, default: 'PHONE' }),
      status(),
    ],
    filters: ['status', 'type'],
    statuses: ['ACTIVE', 'INACTIVE'],
  },
  roles: {
    title: 'Roles & permissions',
    singular: 'role',
    description: 'Give your team the right tools to do their best work.',
    fields: [
      text('name', 'Role name', { maxLength: 80, wide: true }),
      description,
      {
        key: 'can_manage_catalog',
        label: 'Manage shop catalog',
        hint: 'Allow this role to create, edit and delete products, product lines, categories and brands in its assigned shop.',
        type: 'checkbox',
        wide: true,
        default: false,
      },
    ],
    filters: [],
  },
  users: {
    title: 'Your team',
    singular: 'team member',
    description: 'Good people make a great business. Bring your team together.',
    fields: [
      text('username', 'Username', { maxLength: 150 }),
      text('email', 'Email address', { type: 'email' }),
      text('phone', 'Phone number', {
        type: 'tel',
        required: false,
        hint: 'Use international format, e.g. +85512345678.',
      }),
      text('password', 'Temporary password', {
        type: 'password',
        autoComplete: 'new-password',
        minLength: 8,
      }),
      relation('tenant_id', 'Shop', 'tenants'),
      relation('role_id', 'Role', 'available-roles'),
    ],
    filters: ['role_id', 'status'],
    statuses: ['ACTIVE', 'BANNED'],
  },
  'role-requests': {
    title: 'Role requests',
    singular: 'role request',
    description: 'A thoughtful approach to team access. Review what’s next.',
    fields: [
      relation('role', 'Requested role', 'available-roles', { wide: true }),
      {
        key: 'reason',
        label: 'Reason for this request',
        type: 'textarea',
        wide: true,
        hint: 'Help your administrator understand the access you need.',
      },
    ],
    filters: ['status'],
    statuses: ['PENDING', 'APPROVED', 'REJECTED'],
    noSearch: true,
  },
};
export const filterSources = {
  tenant_id: ['Shop', 'tenants'],
  category_id: ['Category', 'categories'],
  brand_id: ['Brand', 'brands'],
  role_id: ['Role', 'available-roles'],
};
export const titleCase = (text) =>
  String(text)
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
