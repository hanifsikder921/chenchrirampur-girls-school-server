const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');

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
      const { roll, dclassName } = req.body;

      // Check if student with same roll and class already exists
      const userExists = await studentCollection.findOne({
        roll: roll,
        dclassName: dclassName,
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

    // ===============================================================================================

    // Enhanced Student Endpoints for your data structure

    app.get('/students', async (req, res) => {
      try {
        const {
          class: className,
          section,
          roll,
          search,
          status,
          gender,
          religion,
          bloodGroup,
          sort = 'dclassName,roll',
          page = 1,
          limit = 10,
        } = req.query;

        // Build filter object
        const filter = {};

        // Exact match filters
        if (className) filter.dclassName = className;
        if (section) filter.section = section;
        if (roll) filter.roll = roll.toString();
        if (status) filter.status = status;
        if (gender) filter.gender = gender;
        if (religion) filter.religion = religion;
        if (bloodGroup) filter.bloodGroup = bloodGroup;

        // Search across multiple fields
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { roll: { $regex: search, $options: 'i' } },
            { fatherName: { $regex: search, $options: 'i' } },
            { motherName: { $regex: search, $options: 'i' } },
            { village: { $regex: search, $options: 'i' } },
            { upazila: { $regex: search, $options: 'i' } },
            { district: { $regex: search, $options: 'i' } },
          ];
        }

        // Sorting
        const sortOptions = sort.split(',').map((field) => {
          const [key, order] = field.startsWith('-') ? [field.substring(1), -1] : [field, 1];
          return [key, order];
        });

        const sortCriteria = {};
        sortOptions.forEach(([key, order]) => {
          sortCriteria[key] = order;
        });

        // Pagination
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Get total count for pagination
        const total = await studentCollection.countDocuments(filter);

        // Execute query
        const students = await studentCollection
          .find(filter)
          .sort(sortCriteria)
          .skip(skip)
          .limit(limitNumber)
          .toArray();

        res.status(200).json({
          success: true,
          count: students.length,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
          data: students.map((student) => ({
            id: student._id,
            name: student.name,
            gender: student.gender,
            dob: student.dob,
            bloodGroup: student.bloodGroup,
            religion: student.religion,
            dclassName: student.dclassName,
            roll: student.roll,
            section: student.section,
            admissionDate: student.admissionDate,
            fatherName: student.fatherName,
            motherName: student.motherName,
            parentContact: student.parentContact,
            image: student.image || '/default-avatar.png',
            status: student.status,
            createdAt: student.createdAt,
          })),
        });
      } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch students',
          error: error.message,
        });
      }
    });

    // Delete Student
    app.delete('/students/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await studentCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Student not found',
          });
        }

        res.status(200).json({
          success: true,
          message: 'Student deleted successfully',
          data: result,
        });
      } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete student',
          error: error.message,
        });
      }
    });

    // Get Single Student
    app.get('/students/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const student = await studentCollection.findOne({ _id: new ObjectId(id) });
        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found',
          });
        }
        res.status(200).json({
          success: true,
          data: student,
        });
      } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch student',
          error: error.message,
        });
      }
    });

    // Update Student
    app.put('/students/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        // First get the existing student data
        const existingStudent = await studentCollection.findOne({ _id: new ObjectId(id) });

        if (!existingStudent) {
          return res.status(404).json({
            success: false,
            message: 'Student not found',
          });
        }

        // Check if roll or class is being updated
        const isRollChanging = updatedData.roll && updatedData.roll !== existingStudent.roll;
        const isClassChanging =
          updatedData.dclassName && updatedData.dclassName !== existingStudent.dclassName;

        // If either roll or class is being changed, check for duplicates
        if (isRollChanging || isClassChanging) {
          const newRoll = updatedData.roll || existingStudent.roll;
          const newClass = updatedData.dclassName || existingStudent.dclassName;

          const duplicateStudent = await studentCollection.findOne({
            _id: { $ne: new ObjectId(id) }, // Exclude current student
            roll: newRoll,
            dclassName: newClass,
          });

          if (duplicateStudent) {
            return res.status(400).json({
              success: false,
              message: 'Another student already has this roll number in the same class',
            });
          }
        }

        // Merge existing data with updated data
        const finalData = {
          ...existingStudent,
          ...updatedData,
          updatedAt: new Date(), // Add update timestamp
        };

        // Remove the _id field to prevent modification
        delete finalData._id;

        const result = await studentCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: finalData }
        );

        res.status(200).json({
          success: true,
          message: 'Student updated successfully',
          data: finalData,
        });
      } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update student',
          error: error.message,
        });
      }
    });
    //=================================================================================================================

    // POST endpoint to save student marks
    // Post Marks in Database
    app.post('/marks', async (req, res) => {
      const { examType, classesName, roll } = req.body;

      try {
        // Check if marks for same student, class & exam already exists
        const marksExists = await marksCollection.findOne({
          examType: examType,
          classesName: classesName,
          roll: roll,
        });

        if (marksExists) {
          return res.status(400).send({
            message: 'This Student already has marks for this class and exam',
            inserted: false,
          });
        }

        // Insert marks if not exists
        const result = await marksCollection.insertOne(req.body);
        res.send({
          message: 'Marks inserted successfully',
          inserted: true,
          result,
        });
      } catch (error) {
        console.error('Error inserting marks:', error);
        res.status(500).send({
          message: 'Internal server error',
          inserted: false,
        });
      }
    });

    // Get marks with filters
    // Get Marks in Database
    app.get('/marks', async (req, res) => {
      try {
        const { examType, examYear, classesName, roll } = req.query;

        const filter = {};
        if (examType) filter.examType = examType;
        if (examYear) filter.examYear = examYear;
        if (classesName) filter.classesName = classesName;
        if (roll) filter.roll = roll;

        const result = await marksCollection.find(filter).toArray();

        res.send(result);
      } catch (error) {
        console.error('Error fetching marks:', error);
        res.status(500).send({
          message: 'Internal server error',
        });
      }
    });

    // DELETE Marks by ID
    app.delete('/marks/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await marksCollection.deleteOne(query);

        if (result.deletedCount === 1) {
          res.send({ success: true, message: 'Marks deleted successfully' });
        } else {
          res.status(404).send({ success: false, message: 'Marks not found' });
        }
      } catch (error) {
        console.error('Error deleting marks:', error);
        res.status(500).send({ success: false, message: 'Internal server error' });
      }
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
