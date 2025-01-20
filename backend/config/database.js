const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI; // MongoDB Atlas connection string
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let db;

const connectDB = async () => {
    try {
        if (!db) {
            await client.connect();
            db = client.db('qrAttendance'); // Replace with your database name
            console.log('MongoDB Connected');
        }
        return db;
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = { connectDB };
