document.addEventListener('DOMContentLoaded', () => {
    const stockForm = document.getElementById('stockForm');
    const stockTable = document.getElementById('stockTable').querySelector('tbody');
    const movementTable = document.getElementById('movementTable').querySelector('tbody');
    const storeSelect = document.getElementById('store');
    const productSelect = document.getElementById('product');
    const supplierSelect = document.getElementById('supplier');

    // Fetch stores, products, and suppliers
    fetch('/api/stores/')
        .then(response => response.json())
        .then(data => data.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = store.name;
            storeSelect.appendChild(option);
        }));

    fetch('/api/products/')
        .then(response => response.json())
        .then(data => data.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            productSelect.appendChild(option);
        }));

    fetch('/api/suppliers/')
        .then(response => response.json())
        .then(data => data.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            supplierSelect.appendChild(option);
        }));

    // Load stock levels
    function loadStockLevels() {
        fetch('/api/stocks/')
            .then(response => response.json())
            .then(data => {
                stockTable.innerHTML = '';
                data.forEach(stock => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${stock.store.name}</td>
                        <td>${stock.product.name}</td>
                        <td>${stock.quantity}</td>
                    `;
                    stockTable.appendChild(row);
                });
            });
    }
    loadStockLevels();

    // Load stock movements
    function loadStockMovements() {
        fetch('/api/stock-movements/')
            .then(response => response.json())
            .then(data => {
                movementTable.innerHTML = '';
                data.forEach(movement => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${movement.store.name}</td>
                        <td>${movement.product.name}</td>
                        <td>${movement.supplier ? movement.supplier.name : 'N/A'}</td>
                        <td>${movement.movement_type}</td>
                        <td>${movement.quantity}</td>
                        <td>${new Date(movement.timestamp).toLocaleString()}</td>
                    `;
                    movementTable.appendChild(row);
                });
            });
    }
    loadStockMovements();

    // Handle form submission
    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const storeId = storeSelect.value;
        const productId = productSelect.value;
        const supplierId = supplierSelect.value || null;
        const movementType = document.getElementById('movementType').value;
        const quantity = document.getElementById('quantity').value;

        fetch('/api/stock-movements/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
            },
            body: JSON.stringify({
                store_id: storeId,
                product_id: productId,
                supplier_id: supplierId,
                movement_type: movementType,
                quantity: quantity
            })
        })
        .then(response => response.json())
        .then(() => {
            loadStockLevels();
            loadStockMovements();
            stockForm.reset();
        })
        .catch(error => console.error('Error:', error));
    });
});