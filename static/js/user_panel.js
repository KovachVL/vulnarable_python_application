async function claimBonus() {
    try {
        const response = await fetch('/api/claim_bonus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.balance) {
                document.getElementById('balanceAmount').textContent = data.balance.toFixed(2);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function purchaseService(serviceName, price) {
    try {
        const response = await fetch('/api/purchase_service', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service: serviceName,
                price: price
            })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.balance) {
                document.getElementById('balanceAmount').textContent = data.balance.toFixed(2);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
} 