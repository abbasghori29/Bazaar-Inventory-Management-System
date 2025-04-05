from rest_framework import serializers
from .models import Product, StockMovement, Store, Supplier, Stock, User, AuditLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'phone_number']
        read_only_fields = ['id']

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_info']

class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'location']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku']

class StockSerializer(serializers.ModelSerializer):
    store = StoreSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    location = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = ['id', 'store', 'product', 'quantity', 'location']
    
    def get_location(self, obj):
        return obj.store.location if obj.store and obj.store.location else 'N/A'

class StockMovementSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    store = StoreSerializer(read_only=True)
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), source='store', write_only=True
    )
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True, required=False
    )

    class Meta:
        model = StockMovement
        fields = ['id', 'product', 'product_id', 'store', 'store_id', 
                 'supplier', 'supplier_id', 'movement_type', 'quantity', 'timestamp']

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    store_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'timestamp', 'user_email', 'store_name', 'product_name', 'details']
    
    def get_user_email(self, obj):
        return obj.user.email if obj.user else 'System'
    
    def get_store_name(self, obj):
        return obj.store.name if obj.store else None
    
    def get_product_name(self, obj):
        return obj.product.name if obj.product else None