import { getDb } from '../db/connect.js';

const getAllBooks = async () => {
  const db = getDb();
  const collection = db.collection('books');
  const books = await collection.find({}, { projection: { _id: 0 } }).toArray();
  return books;
};

const getBookById = async (bookId) => {
  const db = getDb();
  const collection = db.collection('books');
  const book = await collection.findOne({ id: bookId }, { projection: { _id: 0 } });
  return book;
};

const createBook = async (book) => {
  const db = getDb();
  const collection = db.collection('books');
  return collection.insertOne(book);
};

const updateBook = async (bookId, book) => {
  const db = getDb();
  const collection = db.collection('books');
  return collection.updateOne({ id: bookId }, { $set: book });
};

const deleteBook = async (bookId) => {
  const db = getDb();
  const collection = db.collection('books');
  return collection.deleteOne({ id: bookId });
};

export {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};