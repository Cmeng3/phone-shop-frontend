import { Building2, ClipboardCheck, Layers3, ShieldCheck, Smartphone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context';
import { PageHeading } from '../components';

export default function Help() {
  const { user } = useAuth();
  const steps = user.is_superuser
    ? [
        [
          Building2,
          '01',
          'Make room for your shops',
          'Create a shop, choose its type, and keep its status active when it is ready to operate.',
          '/tenants',
          'Manage shops',
        ],
        [
          ShieldCheck,
          '02',
          'Give everyone the right access',
          'Create a role with catalog permission, then add team members and assign their shop and role.',
          '/roles',
          'Set up roles',
        ],
        [
          Layers3,
          '03',
          'Build a home for your products',
          'Add categories and brands for each shop, then group related items into optional product lines.',
          '/categories',
          'Organize categories',
        ],
        [
          Smartphone,
          '04',
          'Bring your catalog to life',
          'Add products with their SKU, price, stock and image. All relationships must belong to the same shop.',
          '/products',
          'Explore products',
        ],
      ]
    : [
        [
          Layers3,
          '01',
          'Start with a little structure',
          'Add categories and brands to keep your shop organized. Your shop is assigned automatically.',
          '/categories',
          'View categories',
        ],
        [
          Smartphone,
          '02',
          'Make your catalog your own',
          'Add products, keep stock current, and use search and filters to find what you need.',
          '/products',
          'Explore products',
        ],
        [
          ClipboardCheck,
          '03',
          'Ask for the access you need',
          'Submit a role request with a short reason. Your administrator will review it.',
          '/role-requests',
          'View role requests',
        ],
      ];
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE GUIDANCE"
        title="Make yourself at home"
        description="Everything you need to get your workspace moving."
      />
      <div className="guide-grid">
        {steps
          .filter((step) => user.can_manage_catalog || step[4] === '/role-requests')
          .map(([Icon, number, title, description, path, label]) => (
            <section className="panel guide-card" key={number}>
              <div>
                <span className="guide-icon">
                  <Icon size={23} />
                </span>
                <span className="step-number">{number}</span>
              </div>
              <h2>{title}</h2>
              <p>{description}</p>
              <Link className="text-link" to={path}>
                {label} →
              </Link>
            </section>
          ))}
      </div>
      <section className="panel faq">
        <h2>A few useful things to know</h2>
        {[
          [
            'How do I export my products?',
            'Open Products, choose your shop, search or filters, then select Export products. The CSV includes every matching product across all pages, in the selected sort order.',
          ],
          [
            'Why can’t I delete a record?',
            'Products protect the brands, categories and product lines they reference. Remove those dependencies first. Assigned or requested roles are protected too. Admin deletions also require your current password.',
          ],
          [
            'What happens when a role changes?',
            'The affected person’s API session ends and they sign in again. A catalog role controls catalog access in the assigned shop; it never grants Super Admin privileges.',
          ],
          [
            'What does low stock mean?',
            'Products with 5 units or fewer are flagged for attention, excluding archived products. The dashboard uses the same rule as the product filter.',
          ],
          [
            'What does inventory value show?',
            'Inventory value is the sum of each product’s listed price multiplied by stock. It is not sales revenue. Use one consistent currency when entering prices.',
          ],
          [
            'How do I reset a forgotten password?',
            'Contact your administrator for help. If you know your current password, you can change it under My account → Password & security.',
          ],
          [
            'Who can see my shop?',
            'Shop owners can manage only their assigned shop. Super admins can manage all shops. An inactive shop’s catalog is unavailable to its owners.',
          ],
        ].map(([title, description]) => (
          <details key={title}>
            <summary>{title}</summary>
            <p>{description}</p>
          </details>
        ))}
      </section>
    </>
  );
}
