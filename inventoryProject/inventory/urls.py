from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (ProductViewSet, StockMovementViewSet, StoreViewSet, 
                   SupplierViewSet, StockViewSet,
                   generate_dummy_data, test_celery_connection, login_view, logout_view,
             register_view, stock_api, logs_api)

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'stock-movements', StockMovementViewSet)
router.register(r'stores', StoreViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'stocks', StockViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/generate-dummy-data/', generate_dummy_data, name='generate_dummy_data'),
    path('api/test-celery/', test_celery_connection, name='test_celery_connection'),
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('api/logout/', logout_view, name='logout'),
    path('api/stock/', stock_api, name='stock_api'),
    path('api/logs/', logs_api, name='logs_api'),
]