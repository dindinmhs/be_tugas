const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());

// Dummy data
const data = [
  {
    img: 'https://images.unsplash.com/photo-1753735880239-d2213c79d1e4?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  },
  {
    img: 'https://images.unsplash.com/photo-1753945080372-ddfecde08723?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  },
  {
    img: 'https://plus.unsplash.com/premium_photo-1754068211025-c06675711a3d?q=80&w=784&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
  }
];

// GET endpoint
app.get('/api/images', (req, res) => {
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
