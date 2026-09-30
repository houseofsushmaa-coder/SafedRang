require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// 1. CASHFREE PAYMENT INTEGRATION
// ==========================================
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { order_id, order_amount, customer_details } = req.body;

    // Cashfree API Endpoint and Headers
    // Documentation: https://docs.cashfree.com/reference/createorder
    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/orders', // Use https://api.cashfree.com/pg/orders for production
      {
        order_id: order_id,
        order_amount: order_amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: customer_details.customer_id,
          customer_email: customer_details.email,
          customer_phone: customer_details.phone,
        },
        order_meta: {
          return_url: `http://localhost:5173/payment-success?order_id={order_id}`
        }
      },
      {
        headers: {
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01', // Important for Cashfree
          'Content-Type': 'application/json',
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Cashfree Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});


// ==========================================
// 2. SHIPROCKET SHIPPING INTEGRATION
// ==========================================

// Helper function to get Shiprocket Auth Token
const getShiprocketToken = async () => {
  try {
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    return response.data.token;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error.message);
    throw new Error('Could not authenticate with Shiprocket');
  }
};

app.post('/api/shipping/create-order', async (req, res) => {
  try {
    const { order_id, order_date, pickup_location, billing_customer_name, billing_last_name, billing_address, billing_city, billing_pincode, billing_state, billing_country, billing_email, billing_phone, order_items, sub_total, length, breadth, height, weight } = req.body;

    const token = await getShiprocketToken();

    // Create Custom Order in Shiprocket
    const response = await axios.post(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      {
        order_id: order_id,
        order_date: order_date,
        pickup_location: pickup_location, // Needs to match a pickup location saved in your Shiprocket account
        billing_customer_name: billing_customer_name,
        billing_last_name: billing_last_name,
        billing_address: billing_address,
        billing_city: billing_city,
        billing_pincode: billing_pincode,
        billing_state: billing_state,
        billing_country: billing_country,
        billing_email: billing_email,
        billing_phone: billing_phone,
        shipping_is_billing: true,
        order_items: order_items, // Array of products {name, sku, units, selling_price}
        payment_method: 'Prepaid', // Since we use Cashfree
        sub_total: sub_total,
        length: length,
        breadth: breadth,
        height: height,
        weight: weight,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Shiprocket Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to create shipment order' });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});
