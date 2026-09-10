"""Start Django with synthetic records in an isolated, disposable database."""
import os
import sys
import tempfile
from pathlib import Path

backend = Path(__file__).resolve().parents[2] / 'phone-shop-backend'
sys.path.insert(0, str(backend))
artifacts = Path(__file__).resolve().parents[1] / '.e2e'
artifacts.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='workspace-', dir=artifacts) as directory:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'ps_backend.e2e_settings'
    os.environ['PHONE_SHOP_E2E_DB'] = str(Path(directory) / 'database.sqlite3')
    os.environ['PHONE_SHOP_E2E_MEDIA'] = str(Path(directory) / 'media')
    import django
    django.setup()
    from django.core.management import call_command
    call_command('migrate', verbosity=0)
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    from accounts.models import Profile, Role, RoleRequest
    from brand.models import Brand
    from category.models import Category
    from product.models import Product, ProductLine
    from tenant.models import Tenant

    password = 'Workspace-Test-Password-2026!'
    User = get_user_model()
    User.objects.create_superuser('alex.morgan', 'admin@workspace.test', password)
    shop = Tenant.objects.create(name='Central Phone Store', type='PHONE')
    other = Tenant.objects.create(name='Riverside Mobile', type='PHONE')
    Tenant.objects.create(name='Northside Tech', type='PHONE', status='INACTIVE')
    role = Role.objects.create(name='Shop Owner', can_manage_catalog=True, description='Manage the assigned shop catalog')
    limited = Role.objects.create(name='Member', description='Profile and role requests')
    user = User.objects.create_user('jamie.lee', 'owner@workspace.test', password)
    Profile.objects.create(user=user, email=user.email, phone='+85512345678', role=role, tenant=shop)
    member = User.objects.create_user('sam.chen', 'member@workspace.test', password)
    Profile.objects.create(user=member, email=member.email, tenant=shop, role=limited)
    RoleRequest.objects.create(user=member, role=role, reason='Please give me access to update the shop catalog.')
    brands = [Brand.objects.create(name=name, tenant=shop) for name in ['Apple', 'Samsung', 'Google']]
    categories = [Category.objects.create(name=name, slug=name.lower(), tenant=shop) for name in ['Smartphones', 'Tablets', 'Accessories']]
    line = ProductLine.objects.create(name='iPhone', brand=brands[0], category=categories[0])
    items = [('iPhone 16 Pro', 0, 0, 999, 24), ('Galaxy S25 Ultra', 1, 0, 1199, 16), ('Pixel 9 Pro', 2, 0, 899, 4), ('iPad Air', 0, 1, 599, 12), ('Galaxy Tab S10', 1, 1, 799, 0), ('AirPods Pro', 0, 2, 249, 38), ('iPhone 15', 0, 0, 699, 17), ('Pixel 9', 2, 0, 699, 9), ('Galaxy A56', 1, 0, 449, 31)]
    for index, (name, brand_index, cat_index, price, stock) in enumerate(items):
        product = Product.objects.create(tenant=shop, brand=brands[brand_index], category=categories[cat_index], name=name, sku=f'DEMO-{index + 1:03}', price=price, stock=stock, status='UNAVAILABLE' if not stock else 'AVAILABLE', product_line=line if name.startswith('iPhone') else None)
        Product.objects.filter(pk=product.pk).update(created_at=timezone.now() - timedelta(days=(len(items) - index - 1) * 16))
    foreign_brand = Brand.objects.create(name='Apple', tenant=other)
    foreign_category = Category.objects.create(name='Smartphones', slug='smartphones', tenant=other)
    Product.objects.create(tenant=other, brand=foreign_brand, category=foreign_category, name='Riverside exclusive', sku='RIVER-001', price=500, stock=8)
    call_command('runserver', '127.0.0.1:8011', use_reloader=False)
