from celery import shared_task
from django.core.cache import cache
from .models import StockMovement, Stock, AuditLog, User

@shared_task
def process_stock_movement(movement_id, user_id=None):
    """
    Process a stock movement and update the corresponding stock.
    This task is executed asynchronously by Celery.
    
    Args:
        movement_id: ID of the StockMovement to process
        user_id: Optional ID of the user who created the movement
    """
    try:
        # Get the movement
        movement = StockMovement.objects.get(id=movement_id)
        
        # Get the user if user_id is provided
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Check if this movement has already been processed
        if movement.processed:
            print(f"Movement {movement_id} already processed. Skipping.")
            return f"Movement {movement_id} already processed. Skipping."
        
        # Clear any cache
        cache_key = f"stock_{movement.store.id}_{movement.product.id}"
        cache.delete(cache_key)
        
        # Get or create the stock object
        stock, created = Stock.objects.get_or_create(
            store=movement.store, 
            product=movement.product,
            defaults={'quantity': 0}
        )
        
        # Update the stock quantity based on movement type
        if movement.movement_type == 'IN':
            # For stock in, add the quantity
            stock.quantity += movement.quantity
        elif movement.movement_type in ('OUT', 'REM'):
            # For stock out or removal, subtract the quantity
            if stock.quantity >= movement.quantity:
                stock.quantity -= movement.quantity
            else:
                # Not enough stock available
                stock.quantity = 0
        
        # Save the updated stock
        stock.save()
        
        # Mark this movement as processed to prevent double-processing
        movement.processed = True
        movement.save(update_fields=['processed'])
        
        # Create an audit log
        AuditLog.objects.create(
            action=f'stock_{movement.movement_type.lower()}',
            store=movement.store,
            product=movement.product,
            user=user,  # Add the user to the audit log
            details={
                'movement_id': movement.id,
                'quantity': movement.quantity,
                'timestamp': movement.timestamp.isoformat()
            }
        )
        
        return f"Processed movement {movement_id}: {movement.movement_type} - {movement.quantity} units"
    except Exception as e:
        # Log the error
        print(f"Error processing stock movement {movement_id}: {str(e)}")
        # Re-raise the exception to mark the task as failed
        raise