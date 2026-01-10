require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const apiRoutes = require('./routes/api');

const app = express();

app.use(express.json());
app.use(cors());

// Use the variable from .env
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error("❌ FATAL: MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch((err) => console.log('❌ MongoDB Connection Error:', err));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('ElClasico Server Running!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});