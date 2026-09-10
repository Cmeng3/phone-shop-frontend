import { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Inbox,
  LoaderCircle,
  Smartphone,
  X,
} from 'lucide-react';
import { imageUrl } from './api';

export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'light' : ''}`}>
      <span className="logo-mark">
        <Smartphone size={23} strokeWidth={2.2} />
      </span>
      <span>
        Phone<span className="logo-soft">Shop</span>
        <span className="logo-dot">.</span>
      </span>
    </span>
  );
}
export function Button({ children, variant = 'primary', busy, className = '', ...props }) {
  return (
    <button
      className={`button ${variant} ${className}`}
      {...props}
      disabled={busy || props.disabled}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Loading({ label = 'Loading your workspace…' }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  );
}
export function ErrorBox({ error, retry }) {
  return error ? (
    <div className="error-box" role="alert">
      <AlertCircle size={18} />
      <span>{typeof error === 'string' ? error : error.message}</span>
      {retry && <button onClick={retry}>Try again</button>}
    </div>
  ) : null;
}
export function Empty({
  title = 'Nothing here yet',
  description = 'Your records will appear here when you add them.',
  action,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Inbox size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Badge({ value }) {
  const text = typeof value === 'boolean' ? (value ? 'Active' : 'Banned') : value || 'Unknown';
  return (
    <span className={`badge ${String(text).toLowerCase()}`}>
      <i />
      {String(text).replaceAll('_', ' ').toLowerCase()}
    </span>
  );
}
export function ProductImage({ src, name, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span className={`product-image ${className}`}>
      {imageUrl(src) && !failed ? (
        <img src={imageUrl(src)} alt={name || ''} onError={() => setFailed(true)} />
      ) : (
        <Smartphone size={22} strokeWidth={1.5} />
      )}
    </span>
  );
}
export function Field({ label, hint, error, type = 'text', children, ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={`field ${props.className || ''}`}>
      <label htmlFor={id}>
        {label}
        {props.required && (
          <span className="required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className={type === 'password' ? 'password-input' : ''}>
        {children ? (
          <select
            id={id}
            {...props}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error || hint ? `${id}-help` : undefined}
          >
            {children}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={id}
            {...props}
            aria-label={label}
            aria-invalid={!!error}
            aria-describedby={error || hint ? `${id}-help` : undefined}
          />
        ) : (
          <input
            id={id}
            {...props}
            aria-label={label}
            type={type === 'password' && visible ? 'text' : type}
            aria-invalid={!!error}
            aria-describedby={error || hint ? `${id}-help` : undefined}
          />
        )}
        {type === 'password' && (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <small id={`${id}-help`} className={error ? 'field-error' : ''}>
          {Array.isArray(error) ? error.join(' ') : error || hint}
        </small>
      )}
    </div>
  );
}
export function Modal({ title, description, children, onClose, busy = false, wide = false }) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (!busy && e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <div>
          <h2 id={id}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function TextLink({ children, ...props }) {
  return (
    <button className="text-link" {...props}>
      {children}
      <ArrowRight size={15} />
    </button>
  );
}
