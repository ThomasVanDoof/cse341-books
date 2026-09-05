import { MongoClient } from 'mongodb';

let database;

const connectToDb = async () => {
  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

  const client = new MongoClient(connectionString);
  await client.connect();
  database = client.db(process.env.MONGODB_DB_NAME || 'practice');

  // TEMPORARY DEBUG
  console.log('Connected to database:', database.databaseName);
  const collections = await database.listCollections().toArray();
  console.log('Collections found:', collections.map(c => {return c.name}));

  return database;
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return database;
};

export { connectToDb, getDb };