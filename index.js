const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'mydatabase';

app.use(cors());
app.use(express.json());

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });

// Example route
app.get('/', (req, res) => {
    res.send('Express server with CORS and MongoDB');
});

// Example: Get all documents from "items" collection
app.get('/items', async (req, res) => {
    try {
        const items = await db.collection('items').find().toArray();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});