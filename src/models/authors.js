import { getAuthorsDb, getDb } from '../db/connect.js';

const getAllAuthors = async () => {
  const db = getAuthorsDb();
  const collection = db.collection('authors');
  const authors = await collection.find({}).toArray();

  return authors;
};

const getAuthorById = async (id) => {
  const db = getAuthorsDb();
  const collection = db.collection('authors');
  const author = await collection.findOne({ id });

  return author;
};

const createAuthor = async (author) => {
  const db = getAuthorsDb();
  const collection = db.collection('authors');
  const result = await collection.insertOne(author);

  return result;
};

const updateAuthor = async (id, author) => {
  const db = getAuthorsDb();
  const collection = db.collection('authors');
  const result = await collection.updateOne({ id }, { $set: author });

  return result;
};

const deleteAuthor = async (id) => {
  const db = getAuthorsDb();
  const collection = db.collection('authors');
  const result = await collection.deleteOne({ id });

  return result;
};

const authorHasBooks = async (id) => {
  const db = getDb();
  const collection = db.collection('books');
  const bookCount = await collection.countDocuments({ authorId: id });

  return bookCount > 0;
};

export {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  authorHasBooks,
};