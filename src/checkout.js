
async function getAndUsePriceId(currentUser) {
    try {
        // Create a product and default price
        const product = await stripe.products.create({
            name: 'Basic Dashboard',
            default_price_data: {
                unit_amount: 50,
                currency: 'usd',
                recurring: {
                    interval: 'month',
                },
            },
            expand: ['default_price'],
        });

        // Retrieve the price ID
        const priceId = product.default_price.id;

        // Use the priceId where needed
        const res = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: currentUser.uid, priceId: priceId })
        });

        if (!res.ok) {
            const t = await res.text();
            throw new Error(t || 'Failed to create session');
        }

        const session = await res.json();
        // Additional logic using session can be added here
        console.log('Session created:', session);
        
    } catch (error) {
        console.error('Error creating product or fetching priceId:', error);
    }
}

// Example call
getAndUsePriceId({uid: 'user-id'});
