const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
    // await client.connect();
    // await client.db('admin').command({ ping: 1 });
    const db = client.db('ChenchriGirls'); // Connect to the ChenchriGirls database
    const studentCollection = db.collection('students'); // শিক্ষার্থীদের তথ্য
    const admissionCollection = db.collection('admissions'); // ভর্তি তথ্য
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

    // ===============================================================================================

    // ================================================================================================ School Overview Stats Code start>>

    // Add these endpoints to your existing backend code (before the final app.listen())

    // ================================================================================================ Overview Stats Operation Start>>>

    // Get Teacher Statistics
    app.get('/stats/teachers', async (req, res) => {
      try {
        // Teachers have subjects (not "N/A")
        const totalTeachers = await staffCollection.countDocuments({
          status: 'active',
          subject: { $ne: 'N/A' },
        });

        const maleTeachers = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Male',
          subject: { $ne: 'N/A' },
        });

        const femaleTeachers = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Female',
          subject: { $ne: 'N/A' },
        });

        // Subject-wise teacher count
        const subjectWiseTeachers = await staffCollection
          .aggregate([
            {
              $match: {
                status: 'active',
                subject: { $ne: 'N/A' },
              },
            },
            {
              $group: {
                _id: '$subject',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        res.status(200).json({
          success: true,
          data: {
            totalTeachers,
            maleTeachers,
            femaleTeachers,
            subjectWise: subjectWiseTeachers.map((item) => ({
              subject: item._id,
              count: item.count,
            })),
          },
        });
      } catch (error) {
        console.error('Error fetching teacher stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch teacher statistics',
          error: error.message,
        });
      }
    });

    // Get Staff Statistics (Non-teaching staff)
    app.get('/stats/staff', async (req, res) => {
      try {
        // Staff have subject as "N/A"
        const totalStaff = await staffCollection.countDocuments({
          status: 'active',
          subject: 'N/A',
        });

        const maleStaff = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Male',
          subject: 'N/A',
        });

        const femaleStaff = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Female',
          subject: 'N/A',
        });

        // Designation-wise staff count
        const designationWiseStaff = await staffCollection
          .aggregate([
            {
              $match: {
                status: 'active',
                subject: 'N/A',
              },
            },
            {
              $group: {
                _id: '$designation',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        res.status(200).json({
          success: true,
          data: {
            totalStaff,
            maleStaff,
            femaleStaff,
            designationWise: designationWiseStaff.map((item) => ({
              designation: item._id,
              count: item.count,
            })),
          },
        });
      } catch (error) {
        console.error('Error fetching staff stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch staff statistics',
          error: error.message,
        });
      }
    });

    // Get Student Religion and Class Statistics
    app.get('/stats/students/detailed', async (req, res) => {
      try {
        // Overall student stats
        const totalStudents = await studentCollection.countDocuments({ status: 'active' });
        const maleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Male',
        });
        const femaleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Female',
        });

        // Religion-wise stats
        const religionStats = await studentCollection
          .aggregate([
            {
              $match: { status: 'active' },
            },
            {
              $group: {
                _id: '$religion',
                total: { $sum: 1 },
                male: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
                female: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        // Class and Religion wise stats
        const classReligionStats = await studentCollection
          .aggregate([
            {
              $match: { status: 'active' },
            },
            {
              $group: {
                _id: {
                  className: '$dclassName',
                  religion: '$religion',
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: { '_id.className': 1, '_id.religion': 1 },
            },
          ])
          .toArray();

        // Blood group stats
        const bloodGroupStats = await studentCollection
          .aggregate([
            {
              $match: { status: 'active' },
            },
            {
              $group: {
                _id: '$bloodGroup',
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        // Class-wise stats
        const classStats = await studentCollection
          .aggregate([
            {
              $match: { status: 'active' },
            },
            {
              $group: {
                _id: '$dclassName',
                total: { $sum: 1 },
                male: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
                female: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray();

        res.status(200).json({
          success: true,
          data: {
            overview: {
              totalStudents,
              maleStudents,
              femaleStudents,
            },
            religionStats: religionStats.map((item) => ({
              religion: item._id,
              total: item.total,
              male: item.male,
              female: item.female,
            })),
            classReligionStats: classReligionStats.map((item) => ({
              className: item._id.className,
              religion: item._id.religion,
              count: item.count,
            })),
            bloodGroupStats: bloodGroupStats.map((item) => ({
              bloodGroup: item._id,
              count: item.count,
            })),
            classStats: classStats.map((item) => ({
              className: item._id,
              total: item.total,
              male: item.male,
              female: item.female,
            })),
          },
        });
      } catch (error) {
        console.error('Error fetching detailed student stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch detailed student statistics',
          error: error.message,
        });
      }
    });

    // Get Complete Overview Stats
    app.get('/stats/overview', async (req, res) => {
      try {
        // Teacher Stats
        const totalTeachers = await staffCollection.countDocuments({
          status: 'active',
          subject: { $ne: 'N/A' },
        });
        const maleTeachers = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Male',
          subject: { $ne: 'N/A' },
        });
        const femaleTeachers = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Female',
          subject: { $ne: 'N/A' },
        });

        // Staff Stats
        const totalStaff = await staffCollection.countDocuments({
          status: 'active',
          subject: 'N/A',
        });
        const maleStaff = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Male',
          subject: 'N/A',
        });
        const femaleStaff = await staffCollection.countDocuments({
          status: 'active',
          gender: 'Female',
          subject: 'N/A',
        });

        // Student Stats
        const totalStudents = await studentCollection.countDocuments({ status: 'active' });
        const maleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Male',
        });
        const femaleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Female',
        });

        // Religion-wise student stats
        const muslimStudents = await studentCollection.countDocuments({
          status: 'active',
          religion: 'Islam',
        });
        const hinduStudents = await studentCollection.countDocuments({
          status: 'active',
          religion: 'Hindu',
        });

        res.status(200).json({
          success: true,
          data: {
            teachers: {
              total: totalTeachers,
              male: maleTeachers,
              female: femaleTeachers,
            },
            staff: {
              total: totalStaff,
              male: maleStaff,
              female: femaleStaff,
            },
            students: {
              total: totalStudents,
              male: maleStudents,
              female: femaleStudents,
              muslim: muslimStudents,
              hindu: hinduStudents,
            },
          },
        });
      } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch overview statistics',
          error: error.message,
        });
      }
    });

    // ================================================================================================ Overview Stats Operation End>>>
    // ================================================================================================ School Overview Code End>>

    // ================================================================================================ Student Admission Operation start>>
    // add admission data
    app.post('/admissionsPost', async (req, res) => {
      try {
        const admissionData = req.body;
        const result = await admissionCollection.insertOne(admissionData);

        res.send({ insertedId: result.insertedId });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to submit admission form' });
      }
    });
    // সব Admission ডেটা গেট করা
    app.get('/admissions', async (req, res) => {
      try {
        const result = await admissionCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to fetch admission data' });
      }
    });

    // নির্দিষ্ট Admission ডেটা ডিলিট করা
    app.delete('/admissions/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await admissionCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.send({ success: true, message: 'Admission deleted successfully' });
        } else {
          res.status(404).send({ success: false, message: 'Admission not found' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to delete admission' });
      }
    });

    // Update admission status
    app.patch('/admissions/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await admissionCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        if (result.modifiedCount === 1) {
          res.send({ success: true, message: 'Admission status updated successfully' });
        } else {
          res.status(404).send({ success: false, message: 'Admission not found' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to update admission status' });
      }
    });

    // ================================================================================================ Student Admission Operation End>>

    // ================================================================================================ Student Operation start>>

    // Get Student Name by Roll and Class
    app.get('/student-name', async (req, res) => {
      try {
        const { roll, dclassName } = req.query;

        if (!roll || !dclassName) {
          return res.status(400).json({
            success: false,
            message: 'Roll number and class name are required',
          });
        }

        const student = await studentCollection.findOne({
          roll: roll.toString(),
          dclassName: dclassName,
        });

        if (!student) {
          return res.status(404).json({
            success: false,
            message: 'Student not found',
          });
        }

        res.status(200).json({
          success: true,
          data: {
            name: student.name,
            fatherName: student.fatherName,
            motherName: student.motherName,
            dob: student.dob,
          },
        });
      } catch (error) {
        console.error('Error fetching student name:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch student name',
          error: error.message,
        });
      }
    });
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
            id: student._id.toHexString(),
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

    // Add this endpoint to your backend (before the Student Operation End>> comment)
    // Bulk update students' class (promotion/migration)
    // Student Migration Endpoint
    app.patch('/students/migrate', async (req, res) => {
      try {
        const { studentIds, newClass, newAcademicYear } = req.body;

        // Validate input
        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No students selected for migration',
          });
        }

        if (!newClass || !newAcademicYear) {
          return res.status(400).json({
            success: false,
            message: 'New class and academic year are required',
          });
        }

        // Validate each ID is a valid ObjectId
        const invalidIds = studentIds.filter((id) => !ObjectId.isValid(id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid student IDs format',
            invalidIds,
          });
        }

        const objectIds = studentIds.map((id) => new ObjectId(id));

        // Check if students exist
        const existingStudents = await studentCollection
          .find({
            _id: { $in: objectIds },
          })
          .toArray();

        if (existingStudents.length !== studentIds.length) {
          const foundIds = existingStudents.map((s) => s._id.toString());
          const missingIds = studentIds.filter((id) => !foundIds.includes(id));

          return res.status(404).json({
            success: false,
            message: 'Some students not found',
            missingIds,
          });
        }

        // Perform the migration
        const result = await studentCollection.updateMany(
          { _id: { $in: objectIds } },
          {
            $set: {
              dclassName: newClass,
              academicYear: newAcademicYear,
              updatedAt: new Date(),
            },
          }
        );

        res.status(200).json({
          success: true,
          message: `${result.modifiedCount} students migrated to class ${newClass}`,
          data: {
            migratedCount: result.modifiedCount,
            newClass,
            newAcademicYear,
          },
        });
      } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to migrate students',
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
      }
    });

    // Student Statistics Endpoint
    // Add these endpoints to your existing backend code (after Student Operation End>>> comment)

    // ================================================================================================ Student Statistics Operation Start>>>

    // Get overall student statistics
    app.get('/students/stats/overview', async (req, res) => {
      try {
        // Total students
        const totalStudents = await studentCollection.countDocuments({ status: 'active' });

        // Total male students
        const totalMaleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Male',
        });

        // Total female students
        const totalFemaleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Female',
        });

        res.status(200).json({
          success: true,
          data: {
            totalStudents,
            totalMaleStudents,
            totalFemaleStudents,
          },
        });
      } catch (error) {
        console.error('Error fetching student overview stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch student statistics',
          error: error.message,
        });
      }
    });

    // Get class-wise student statistics
    app.get('/students/stats/class-wise', async (req, res) => {
      try {
        const classStats = await studentCollection
          .aggregate([
            {
              $match: { status: 'active' },
            },
            {
              $group: {
                _id: '$dclassName',
                totalStudents: { $sum: 1 },
                maleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] },
                },
                femaleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] },
                },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ])
          .toArray();

        res.status(200).json({
          success: true,
          data: classStats.map((stat) => ({
            className: stat._id,
            totalStudents: stat.totalStudents,
            maleStudents: stat.maleStudents,
            femaleStudents: stat.femaleStudents,
          })),
        });
      } catch (error) {
        console.error('Error fetching class-wise stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch class-wise statistics',
          error: error.message,
        });
      }
    });

    // Get section-wise statistics for classes 9 and 10
    app.get('/students/stats/section-wise', async (req, res) => {
      try {
        const sectionStats = await studentCollection
          .aggregate([
            {
              $match: {
                status: 'active',
                dclassName: { $in: ['9', '10'] },
              },
            },
            {
              $group: {
                _id: {
                  className: '$dclassName',
                  section: '$section',
                },
                totalStudents: { $sum: 1 },
                maleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] },
                },
                femaleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] },
                },
              },
            },
            {
              $sort: { '_id.className': 1, '_id.section': 1 },
            },
          ])
          .toArray();

        res.status(200).json({
          success: true,
          data: sectionStats.map((stat) => ({
            className: stat._id.className,
            section: stat._id.section,
            totalStudents: stat.totalStudents,
            maleStudents: stat.maleStudents,
            femaleStudents: stat.femaleStudents,
          })),
        });
      } catch (error) {
        console.error('Error fetching section-wise stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch section-wise statistics',
          error: error.message,
        });
      }
    });

    // Get detailed statistics with all breakdowns
    app.get('/students/stats/detailed', async (req, res) => {
      try {
        // Overall stats
        const totalStudents = await studentCollection.countDocuments({ status: 'active' });
        const totalMaleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Male',
        });
        const totalFemaleStudents = await studentCollection.countDocuments({
          status: 'active',
          gender: 'Female',
        });

        // Class-wise stats
        const classStats = await studentCollection
          .aggregate([
            {
              $match: { status: 'active' },
            },
            {
              $group: {
                _id: '$dclassName',
                totalStudents: { $sum: 1 },
                maleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] },
                },
                femaleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] },
                },
              },
            },
            {
              $sort: { _id: 1 },
            },
          ])
          .toArray();

        // Section-wise stats for classes 9 and 10
        const sectionStats = await studentCollection
          .aggregate([
            {
              $match: {
                status: 'active',
                dclassName: { $in: ['9', '10'] },
              },
            },
            {
              $group: {
                _id: {
                  className: '$dclassName',
                  section: '$section',
                },
                totalStudents: { $sum: 1 },
                maleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] },
                },
                femaleStudents: {
                  $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] },
                },
              },
            },
            {
              $sort: { '_id.className': 1, '_id.section': 1 },
            },
          ])
          .toArray();

        res.status(200).json({
          success: true,
          data: {
            overview: {
              totalStudents,
              totalMaleStudents,
              totalFemaleStudents,
            },
            classWise: classStats.map((stat) => ({
              className: stat._id,
              totalStudents: stat.totalStudents,
              maleStudents: stat.maleStudents,
              femaleStudents: stat.femaleStudents,
            })),
            sectionWise: sectionStats.map((stat) => ({
              className: stat._id.className,
              section: stat._id.section,
              totalStudents: stat.totalStudents,
              maleStudents: stat.maleStudents,
              femaleStudents: stat.femaleStudents,
            })),
          },
        });
      } catch (error) {
        console.error('Error fetching detailed stats:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch detailed statistics',
          error: error.message,
        });
      }
    });

    // ================================================================================================ Student Statistics Operation End>>>

    // Add these endpoints to your existing backend code

    // ================================================================================================ Student Migration Start>>>

    // ================================================================================================ Student Migration End>>>
    // ================================================================================================ Student Operation End>>>

    //==>
    //==>
    //==>

    // ================================================================================================ Marks Operation Start>>>

    // Post Marks in Database
    app.post('/marks', async (req, res) => {
      const { examType, classesName, roll, examYear } = req.body;

      try {
        // Check if marks for same student, class & exam already exists
        const marksExists = await marksCollection.findOne({
          examType: examType,
          classesName: classesName,
          roll: roll,
          examYear: examYear,
        });

        if (marksExists) {
          return res.status(400).send({
            message: 'This Student already has marks for this class and exam ',
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

    // Update marks by ID
    app.put('/marks/:id', async (req, res) => {
      const { id } = req.params;
      const updated = req.body;
      const result = await marksCollection.updateOne({ _id: new ObjectId(id) }, { $set: updated });
      if (result.modifiedCount === 0) return res.status(400).json({ message: 'Update failed' });
      res.json({ message: 'Marks updated successfully' });
    });

    // Get mark by ID
    app.get('/marks/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const marks = await marksCollection.findOne({ _id: new ObjectId(id) });

        if (!marks) {
          return res.status(404).send({ message: 'Mark not found' });
        }

        res.send(marks);
      } catch (error) {
        console.error('Error fetching mark:', error);
        res.status(500).send({ message: 'Internal server error' });
      }
    });
    // ================================================================================================ Marks Operation End>>>
    // ==>
    // ==>
    // ==>
    // ==>
    // ================================================================================================ Teacher Operation Start>>>
    // Post Teacher in Database
    app.post('/teachers', async (req, res) => {
      const { indexno } = req.body;

      // Check if teacher with same indexx already exists
      const userExists = await staffCollection.findOne({
        indexno: indexno,
      });

      if (userExists) {
        return res.status(400).send({
          message: 'Teacher with this index  already exists',
          inserted: false,
        });
      }

      const user = req.body;
      const result = await staffCollection.insertOne(user);
      res.send(result);
    });

    // Get Teachers in Database
    app.get('/teachers', async (req, res) => {
      try {
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Get total count for pagination
        const total = await staffCollection.countDocuments();

        // Fetch teachers with pagination
        const teachers = await staffCollection
          .find({})
          .sort({ dclassName: 1, roll: 1 }) // Default sorting
          .skip(skip)
          .limit(limitNumber)
          .toArray();

        res.status(200).json({
          success: true,
          total,
          page: pageNumber,
          pages: Math.ceil(total / limitNumber),
          data: teachers.map((teacher) => ({
            id: teacher._id,
            fullName: teacher.fullName,
            designation: teacher.designation || '-',
            indexno: teacher.indexno,
            gender: teacher.gender,
            phone: teacher.phone || '-',
            image: teacher.image || '/default-avatar.png',
          })),
        });
      } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch teachers',
          error: error.message,
        });
      }
    });

    // Get Single Teacher
    app.get('/teachers/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const teacher = await staffCollection.findOne({ _id: new ObjectId(id) });

        if (!teacher) {
          return res.status(404).json({
            success: false,
            message: 'Teacher not found',
          });
        }

        res.status(200).json({
          success: true,
          data: teacher,
        });
      } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch teacher',
          error: error.message,
        });
      }
    });

    // Update Teacher
    app.put('/teachers/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        // First get the existing teacher data
        const existingTeacher = await staffCollection.findOne({ _id: new ObjectId(id) });

        if (!existingTeacher) {
          return res.status(404).json({
            success: false,
            message: 'Teacher not found',
          });
        }

        // Merge existing data with updated data
        const finalData = {
          ...existingTeacher,
          ...updatedData,
          updatedAt: new Date(), // Add update timestamp
        };

        // Remove the _id field to prevent modification
        delete finalData._id;

        const result = await staffCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: finalData }
        );

        res.status(200).json({
          success: true,
          message: 'Teacher updated successfully',
          data: finalData,
        });
      } catch (error) {
        console.error('Error updating teacher:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update teacher',
          error: error.message,
        });
      }
    });

    // Delete Student
    app.delete('/teachers/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await staffCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Teacher not found',
          });
        }

        res.status(200).json({
          success: true,
          message: 'Teacher deleted successfully',
          data: result,
        });
      } catch (error) {
        console.error('Error deleting teacher:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete teacher',
          error: error.message,
        });
      }
    });

    //=================================================================================================================

    // console.log('Pinged your deployment. You successfully connected to MongoDB!');
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
