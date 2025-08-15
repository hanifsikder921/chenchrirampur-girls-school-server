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
  console.error('MongoDB URI is not set. Please set the DB_URI environment variable.');
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
    const db = client.db('ChenchriGirls'); // Connect to the ChenchriGirls database
    const studentCollection = db.collection('students'); // শিক্ষার্থীদের তথ্য
    const staffCollection = db.collection('staff'); // teaching staff/non-teaching staff
    const classCollection = db.collection('classes'); // ক্লাস ও সেকশন
    const subjectCollection = db.collection('subjects'); // বিষয় সমূহ
    const examCollection = db.collection('exams'); // পরীক্ষার তথ্য
    const marksCollection = db.collection('marks'); // শিক্ষার্থীদের মার্কস / রেজাল্ট
    const attendanceCollection = db.collection('attendance'); // উপস্থিতি
    const noticeCollection = db.collection('notices'); // নোটিশ / ঘোষণা
    const feesCollection = db.collection('fees'); // ফি সংক্রান্ত তথ্য
    const scrollNoticeCollection = db.collection('scrollNotices'); // স্ক্রল নোটিশ

    //=================================================================================================================

    // Post Student in Database
    app.post('/students', async (req, res) => {
      const { roll, className } = req.body;

      // Check if student with same roll and class already exists
      const userExists = await studentCollection.findOne({
        roll: roll,
        className: className,
      });

      if (userExists) {
        return res.status(400).send({
          message: 'Student with this roll number already exists in this class',
          inserted: false,
        });
      }

      const user = req.body;
      const result = await studentCollection.insertOne(user);
      res.send(result);
    });

    //=================================================================================================================

    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('School Server is running!');
});

app.listen(port, () => {
  // console.log(`School Server is listening on port ${port}`);
});
