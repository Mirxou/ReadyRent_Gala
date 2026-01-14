# Generated migration to add XXXL size option

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='size',
            field=models.CharField(
                choices=[
                    ('XS', 'XS'),
                    ('S', 'S'),
                    ('M', 'M'),
                    ('L', 'L'),
                    ('XL', 'XL'),
                    ('XXL', 'XXL'),
                    ('XXXL', 'XXXL'),
                ],
                max_length=10,
                verbose_name='size'
            ),
        ),
    ]

