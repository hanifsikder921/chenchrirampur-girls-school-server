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
// MongoDB Connection
const uri = process.env.DB_URI;
if (!uri) {
  console.error(
    "MongoDB URI is not set. Please set the DB_URI environment variable."
  );
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
    try {
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } finally {
        await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('School Server is running!');
});

app.listen(port, () => {
  // console.log(`School Server is listening on port ${port}`);
}); 