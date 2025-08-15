const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Client
const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db('school'); // বা তুমি চাইলে অন্য DB name দিতে পারো
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
}

// Call connectDB to establish connection before routes
connectDB();

// Routes
app.get('/', (req, res) => {
  res.send('Express server with CORS and MongoDB');
});

app.get('/items', async (req, res) => {
  try {
    const items = await db.collection('items').find().toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
