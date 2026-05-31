const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// POST /api/stripe/create-checkout-session
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      return res.status(502).json({ error: 'Betalingssysteem niet geconfigureerd' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'ideal'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/?canceled=true`,
      metadata: {
        product: 'cv-scanner-unlimited'
      }
    });

    res.json({ url: session.url });
    
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(502).json({ error: 'Kon betaling niet opstarten - probeer opnieuw' });
  }
});

// POST /api/stripe/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment succeeded for session:', session.id);
      // Hier zou je in een echte app de gebruiker premium maken
      // Voor nu loggen we alleen
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;