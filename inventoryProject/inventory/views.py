import json
import random
from datetime import datetime, timedelta
from django.core.cache import cache
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.db import models
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from celery import Celery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth.decorators import login_required
from celery import Celery
from django.http import JsonResponse

from .models import (
    Product, 
    StockMovement, 
    Store, 
    Supplier, 
    Stock, 
    User, 
    AuditLog
)
from .serializers import (
    ProductSerializer, 
    StockMovementSerializer, 
    StoreSerializer, 
    SupplierSerializer, 
    StockSerializer,
    UserSerializer, 
    AuditLogSerializer
)
from .tasks import process_stock_movement



@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Handle user registration.
    
    GET: Return information about the registration endpoint.
    POST: Create a new user account.
    """
    if request.method == 'GET':
        return Response(
            {'message': 'Please use POST method to register with email, password, and other user information.'},
            status=status.HTTP_200_OK
        )
        
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        role = data.get('role', 'staff')
        phone_number = data.get('phone_number', '')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {'error': 'User with this email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create(
            email=email,
            password=password,  
            is_active=True,
            first_name=first_name,
            last_name=last_name,
            role=role,
            phone_number=phone_number
        )

        login(request, user)
        
        # Create token
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'message': 'Registration successful',
            'token': token.key,
            'user_id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role
        }, status=status.HTTP_201_CREATED)
        
    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return Response(
            {'error': 'An error occurred during registration'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt  
def login_view(request):
    
    """
    Handle user login.
    
    GET: Return information about the login endpoint.
    POST: Authenticate user credentials and return a token.
    """

    print("\n=== Login Process Started ===")
    print(f"Request Method: {request.method}")
    
    if request.method == 'GET':
        print("Received GET request to login, returning JSON response")
        return Response(
            {'message': 'Please use POST method to login with email and password'},
            status=status.HTTP_200_OK
        )
        
    try:
        print("\nRequest Headers:")
        for header, value in request.headers.items():
            print(f"{header}: {value}")
            
        print("\nRequest Body:", request.body.decode('utf-8'))
        
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            data = request.POST

        print(f"Parsed data: {data}")
        
        email = data.get('email')
        password = data.get('password')
        
        print(f"\nAttempting login with email: {email}")
        
        if not email or not password:
            print("Error: Missing email or password")
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email, password=password)
            print(f"Found user with matching credentials")
            
            login(request, user)
            
            token, created = Token.objects.get_or_create(user=user)
            print(f"Token {'created' if created else 'retrieved'}: {token.key}")
            
            response_data = {
                'token': token.key,
                'user_id': user.id,
                'email': user.email
            }
            print("\nSending successful response:", response_data)
            return Response(response_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            print("Invalid credentials")
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
    except json.JSONDecodeError as e:
        print(f"\nJSON Decode Error: {str(e)}")
        return Response(
            {'error': 'Invalid JSON format'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print(f"\nUnexpected Error: {str(e)}")
        print("Error type:", type(e).__name__)
        import traceback
        print("Traceback:", traceback.format_exc())
        return Response(
            {'error': 'An error occurred during login'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        print("\n=== Login Process Ended ===\n")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Handle user logout.
    
    Deletes the user's authentication token and logs them out.
    """
    request.user.auth_token.delete()
    logout(request)
    return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)



# Model ViewSets
class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on Products.
    
    Provides list, create, retrieve, update, and delete functionality.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class StoreViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on Stores.
    
    Provides list, create, retrieve, update, and delete functionality.
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on Suppliers.
    
    Provides list, create, retrieve, update, and delete functionality.
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer


class StockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for read-only operations on Stock.
    
    Provides list and retrieve functionality with filtering, searching, and ordering capabilities.
    """
    queryset = Stock.objects.select_related('product', 'store').all()
    serializer_class = StockSerializer
    filterset_fields = ['store', 'product']
    search_fields = ['product__name', 'product__sku', 'store__name']
    ordering_fields = ['quantity', 'product__name', 'store__name']

    def get_queryset(self):
        """
        Customize the returned queryset based on request parameters.
        
        Supports filtering by search, status, date range, supplier, and custom sorting.
        """
        queryset = super().get_queryset()
        
        # Get search parameter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(product__name__icontains=search) |
                models.Q(product__sku__icontains=search) |
                models.Q(store__name__icontains=search)
            )
        
        # Status filtering
        status = self.request.query_params.get('status')
        if status:
            if status == 'out_of_stock':
                queryset = queryset.filter(quantity=0)
            elif status == 'low_stock':
                queryset = queryset.filter(quantity__gt=0, quantity__lt=20)
            elif status == 'in_stock':
                queryset = queryset.filter(quantity__gte=20)

        # Date filtering based on related stock movements
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date or end_date:
            # Start with all stock movement product and store combinations
            stock_movements_query = StockMovement.objects.all()
            
            if start_date:
                try:
                    # Convert to timezone-aware datetime
                    start_date_aware = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                    stock_movements_query = stock_movements_query.filter(timestamp__gte=start_date_aware)
                except (ValueError, TypeError):
                    pass
                    
            if end_date:
                try:
                    # Convert to timezone-aware datetime and set to end of day
                    end_date_aware = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                    end_date_aware = end_date_aware.replace(hour=23, minute=59, second=59)
                    stock_movements_query = stock_movements_query.filter(timestamp__lte=end_date_aware)
                except (ValueError, TypeError):
                    pass
            
            # Get the product-store combinations from filtered movements
            if start_date or end_date:  
                product_store_pairs = stock_movements_query.values('product_id', 'store_id').distinct()
                
                # If there are no movements in the date range, return empty queryset
                if not product_store_pairs.exists():
                    return Stock.objects.none()
                    
                stock_filters = models.Q()
                for pair in product_store_pairs:
                    stock_filters |= models.Q(product_id=pair['product_id'], store_id=pair['store_id'])
                
                if stock_filters:  # Only apply if we have at least one pair
                    queryset = queryset.filter(stock_filters)

        # Supplier filtering
        supplier_id = self.request.query_params.get('supplier')
        if supplier_id:
            # Get all stock movements for the supplier
            supplier_movements = StockMovement.objects.filter(supplier_id=supplier_id).values_list('product_id', flat=True).distinct()
            
            if not supplier_movements.exists():
                return Stock.objects.none()
                
            queryset = queryset.filter(product_id__in=supplier_movements)

        sort_field = self.request.query_params.get('sort')
        sort_order = self.request.query_params.get('order', 'asc')
        
        if sort_field:
            # Map frontend field names to model field names
            field_mapping = {
                'product_name': 'product__name',
                'sku': 'product__sku',
                'store_name': 'store__name',
                'quantity': 'quantity',
                'updated_at': 'id'  
            }
            
            sort_field = field_mapping.get(sort_field, sort_field)
            if sort_order == 'desc':
                sort_field = f'-{sort_field}'
            queryset = queryset.order_by(sort_field)

        return queryset

class StockMovementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for CRUD operations on Stock Movements.
    
    Provides list, create, retrieve, update, and delete functionality
    with filtering, searching, and ordering capabilities.
    """
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    filterset_fields = ['store', 'movement_type', 'supplier']
    search_fields = ['product__name', 'product__sku']
    ordering_fields = ['timestamp']

    def perform_create(self, serializer):
        """
        Process the stock movement after saving, using Celery if available.
        
        Falls back to direct processing if Celery task fails.
        """
        instance = serializer.save()
        try:
            user_id = self.request.user.id if self.request.user.is_authenticated else None
            process_stock_movement.delay(instance.id, user_id=user_id)

        except Exception as e:
            print(f"Celery task failed: {str(e)}")
            print("Processing stock movement directly...")
            self.process_stock_movement_directly(instance)
    
    def process_stock_movement_directly(self, movement):
        """
        Process a stock movement directly without using Celery.
        
        Updates stock quantities and creates audit logs.
        """
        try:
            # Check if this movement has already been processed
            if movement.processed:
                print(f"Movement {movement.id} already processed. Skipping.")
                return
                
            stock, created = Stock.objects.get_or_create(
                store=movement.store, 
                product=movement.product,
                defaults={'quantity': 0}
            )
            
            # Update the stock quantity based on movement type
            if movement.movement_type == 'IN':
                stock.quantity += movement.quantity
            elif movement.movement_type in ('OUT', 'REM'):
                if stock.quantity >= movement.quantity:
                    stock.quantity -= movement.quantity
                else:
                    # Not enough stock available
                    stock.quantity = 0
            
            stock.save()
            
            # Mark this movement as processed to prevent double processing
            movement.processed = True
            movement.save(update_fields=['processed'])
            
            try:
                cache_key = f"stock_{movement.store.id}_{movement.product.id}"
                cache.delete(cache_key)
            except Exception as cache_error:
                print(f"Cache operation failed (non-critical): {str(cache_error)}")
            
            # Create an audit log
            try:
                user = self.request.user if hasattr(self, 'request') and self.request.user.is_authenticated else None
                
                AuditLog.objects.create(
                    action=f'stock_{movement.movement_type.lower()}',
                    store=movement.store,
                    product=movement.product,
                    user=user,  
                    details={
                        'movement_id': movement.id,
                        'quantity': movement.quantity,
                        'timestamp': movement.timestamp.isoformat()
                    }
                )
            except Exception as audit_error:
                print(f"Audit log creation failed (non-critical): {str(audit_error)}")
            
            print(f"Stock movement processed: {movement.movement_type} - {movement.quantity} units of {movement.product.name} at {movement.store.name}")
        except Exception as e:
            print(f"Error processing stock movement: {str(e)}")

# Utility API Endpoints
@api_view(['GET'])
@permission_classes([AllowAny])
def generate_dummy_data(request):
    """
    Generate sample data for testing the application.
    
    Creates stores, suppliers, products, stock entries, movements and log entries.
    """
    # Create Stores
    stores = [
        Store(name=f"Store {i}", location=f"Location {i}")
        for i in range(1, 6)  # 5 stores
    ]
    Store.objects.bulk_create(stores)

    # Create Suppliers
    suppliers = [
        Supplier(name=f"Supplier {i}", contact_info=f"contact{i}@bazaartech.com")
        for i in range(1, 4)  # 3 suppliers
    ]
    Supplier.objects.bulk_create(suppliers)

    # Create Products
    products = [
        Product(name=f"Product {i}", sku=f"SKU{i:03d}")
        for i in range(1, 11)  # 10 products
    ]
    Product.objects.bulk_create(products)

    # Create Initial Stock
    stock_entries = []
    for store in Store.objects.all():
        for product in Product.objects.all():
            stock_entries.append(
                Stock(store=store, product=product, quantity=random.randint(50, 200))
            )
    Stock.objects.bulk_create(stock_entries)

    # Create Stock Movements
    movement_types = ['IN', 'OUT', 'REM']
    movements = []
    for _ in range(50):  # 50 random movements
        store = random.choice(stores)
        product = random.choice(products)
        supplier = random.choice(suppliers) if random.choice([True, False]) else None
        movement_type = random.choice(movement_types)
        quantity = random.randint(1, 50)
        timestamp = datetime.now() - timedelta(days=random.randint(0, 30))

        movement = StockMovement(
            product=product,
            store=store,
            supplier=supplier,
            movement_type=movement_type,
            quantity=quantity,
            timestamp=timestamp
        )
        movements.append(movement)

        stock, _ = Stock.objects.get_or_create(store=store, product=product, defaults={'quantity': 0})
        if movement_type == 'IN':
            stock.quantity += quantity
        elif movement_type in ('OUT', 'REM') and stock.quantity >= quantity:
            stock.quantity -= quantity
        stock.save()

    StockMovement.objects.bulk_create(movements)
    
    # Create sample log entries
    log_actions = ['LOGIN', 'LOGOUT', 'CREATE_PRODUCT', 'UPDATE_STOCK', 'DELETE_PRODUCT', 'STOCK_IN', 'STOCK_OUT']
    log_entries = []
    
    try:
        # get the first user from the database
        log_user = User.objects.first()
        if not log_user:
            # If no user exists, create a default admin
            log_user = User.objects.create(
                email="admin@example.com",
                first_name="Admin",
                last_name="User",
                is_active=True,
                role="admin",
            )
            print("Created default admin user for logs")
    except Exception as e:
        log_user = None
        print(f"Error getting/creating user for logs: {str(e)}")
    
    for _ in range(30):  
        action = random.choice(log_actions)
        store = random.choice(stores) if random.choice([True, False]) else None
        product = random.choice(products) if random.choice([True, False]) else None
        timestamp = datetime.now() - timedelta(days=random.randint(0, 30), 
                                             hours=random.randint(0, 23),
                                             minutes=random.randint(0, 59))
        
        if action == 'LOGIN':
            details = {'ip_address': f'192.168.1.{random.randint(1, 255)}'}
        elif action == 'LOGOUT':
            details = {'duration': f'{random.randint(1, 120)} minutes'}
        elif action in ['CREATE_PRODUCT', 'UPDATE_STOCK', 'DELETE_PRODUCT']:
            details = {'product_name': product.name if product else 'Unknown', 
                      'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        else:  
            details = {'quantity': random.randint(1, 100),
                     'store': store.name if store else 'Unknown',
                     'product': product.name if product else 'Unknown'}
            
        log_entry = AuditLog(
            action=action,
            timestamp=timestamp,
            store=store,
            product=product,
            user=log_user,  
            details=details
        )
        log_entries.append(log_entry)
    
    AuditLog.objects.bulk_create(log_entries)

    return Response({"message": "Dummy data generated successfully"}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def test_celery_connection(request):
    """
    Test the connection to Celery/Redis.
    
    Returns success or error message depending on connection status.
    """
    try:
        app = Celery('inventory_project', broker='redis://localhost:6379/0')
        connection = app.connection()
        connection.connect()
        connection.release()
        return Response({"message": "Connected to Memurai successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# API Endpoints for Frontend
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stock_api(request):
    """
    API endpoint for filtering stocks data for AJAX requests.
    
    Provides filtering by store, status, date, supplier, product name, and search term.
    Supports custom sorting and ordering of results.
    """
    # Get query parameters for filtering
    store_id = request.GET.get('store')
    status = request.GET.get('status')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    supplier_id = request.GET.get('supplier')
    product_name = request.GET.get('product_name')
    search = request.GET.get('search')
    sort_field = request.GET.get('sort', 'product__name')
    sort_order = request.GET.get('order', 'asc')

    # Map frontend field names to model field names
    field_mapping = {
        'product_name': 'product__name',
        'sku': 'product__sku',
        'store_name': 'store__name',
        'quantity': 'quantity',
        'updated_at': 'id'  
    }
    
    # Map the sort field if it's in our mapping
    if sort_field in field_mapping:
        sort_field = field_mapping[sort_field]

    # Base queryset with related data
    stocks = Stock.objects.select_related('product', 'store').all()

    # Apply filters
    if store_id:
        stocks = stocks.filter(store_id=store_id)
    
    if status:
        if status == 'out_of_stock':
            stocks = stocks.filter(quantity=0)
        elif status == 'low_stock':
            stocks = stocks.filter(quantity__gt=0, quantity__lt=20)
        elif status == 'in_stock':
            stocks = stocks.filter(quantity__gte=20)
    
    if start_date or end_date:
        stock_movements_query = StockMovement.objects.all()
        
        if start_date:
            try:
                start_date_aware = timezone.make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                stock_movements_query = stock_movements_query.filter(timestamp__gte=start_date_aware)
            except (ValueError, TypeError):
                pass
                
        if end_date:
            try:
                end_date_aware = timezone.make_aware(datetime.strptime(end_date, '%Y-%m-%d'))
                end_date_aware = end_date_aware.replace(hour=23, minute=59, second=59)
                stock_movements_query = stock_movements_query.filter(timestamp__lte=end_date_aware)
            except (ValueError, TypeError):
                pass
        
        if start_date or end_date:  
            product_store_pairs = stock_movements_query.values('product_id', 'store_id').distinct()
            stock_filters = models.Q()
            for pair in product_store_pairs:
                stock_filters |= models.Q(product_id=pair['product_id'], store_id=pair['store_id'])
            
            if stock_filters:  # Only apply if we have at least one pair
                stocks = stocks.filter(stock_filters)
    
    if supplier_id:
        supplier_movements = StockMovement.objects.filter(supplier_id=supplier_id).values_list('product_id', flat=True).distinct()
        stocks = stocks.filter(product_id__in=supplier_movements)
    
    if product_name:
        stocks = stocks.filter(product__name__icontains=product_name)
    
    if search:
        stocks = stocks.filter(
            models.Q(product__name__icontains=search) |
            models.Q(product__sku__icontains=search) |
            models.Q(store__name__icontains=search)
        )

    # Apply sorting
    sort_prefix = '-' if sort_order == 'desc' else ''
    stocks = stocks.order_by(f'{sort_prefix}{sort_field}')

    # Serialize the results
    serializer = StockSerializer(stocks, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def logs_api(request):
    """
    API endpoint to get system logs with filtering options.
    
    Provides filtering by action, date range, and user.
    Returns the 100 most recent logs matching the filters.
    """
    try:
        action_filter = request.GET.get('action')
        date_from = request.GET.get('start_date')
        date_to = request.GET.get('end_date')
        user_id = request.GET.get('user')
        
        logs = AuditLog.objects.all().order_by('-timestamp')
        
        if action_filter:
            logs = logs.filter(action__icontains=action_filter)
            
        if date_from:
            try:
                date_from_aware = timezone.make_aware(datetime.strptime(date_from, '%Y-%m-%d'))
                logs = logs.filter(timestamp__gte=date_from_aware)
            except (ValueError, TypeError):
                pass
                
        if date_to:
            try:
                date_to_aware = timezone.make_aware(datetime.strptime(date_to, '%Y-%m-%d'))
                date_to_aware = date_to_aware.replace(hour=23, minute=59, second=59)
                logs = logs.filter(timestamp__lte=date_to_aware)
            except (ValueError, TypeError):
                pass
                
        if user_id:
            logs = logs.filter(user_id=user_id)
        
        logs = logs[:100]
        
        serializer = AuditLogSerializer(logs, many=True)
        
        return Response(serializer.data)
        
    except Exception as e:
        print(f"Error fetching logs: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)