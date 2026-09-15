import {
  getAllBooks,
  getBookById,
  createBook as createBookInDb,
  updateBook as updateBookInDb,
  deleteBook as deleteBookFromDb,
} from '../models/books.js';
import { getAuthorById } from '../models/authors.js';

const createFields = ['id', 'authorId', 'title', 'publicationDate'];
const updateFields = ['authorId', 'title', 'publicationDate'];

const validateBook = (book, fields) => {
  const input = book || {};
  const unknownField = Object.keys(input).find((field) => {
    return !fields.includes(field);
  });

  if (unknownField) {
    return `${unknownField} is not allowed.`;
  }

  for (const field of fields) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      return `${field} must be a non-empty string.`;
    }
  }

  if (input.id && input.id.trim().length > 50) {
    return 'id must be 50 characters or fewer.';
  }

  if (input.title && input.title.trim().length > 200) {
    return 'title must be 200 characters or fewer.';
  }

  if (input.publicationDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.publicationDate.trim())) {
    return 'publicationDate must be in YYYY-MM-DD format.';
  }

  if (input.publicationDate) {
    const date = new Date(`${input.publicationDate.trim()}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.publicationDate.trim()) {
      return 'publicationDate must be a valid calendar date.';
    }
  }

  return null;
};

const getBooksHandler = async (req, res) => {
  try {
    const books = await getAllBooks();
    return res.status(200).json(books);
  } catch (error) {
    console.error('GET /books failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getBookByIdHandler = async (req, res) => {
  const requestedId = req.params.id;

  try {
    const book = await getBookById(requestedId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error('GET /books/:id failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createBookHandler = async (req, res) => {
  const validationError = validateBook(req.body, createFields);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const book = Object.fromEntries(createFields.map((field) => {
    return [field, req.body[field].trim()];
  }));

  try {
    if (!await getAuthorById(book.authorId)) {
      return res.status(400).json({ message: 'authorId must reference an existing author.' });
    }

    await createBookInDb(book);
    return res.location(`/books/${book.id}`).status(201).json(book);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Book id already exists.' });
    }

    return res.status(500).json({ message: 'Unable to create book.' });
  }
};

const updateBookHandler = async (req, res) => {
  const validationError = validateBook(req.body, updateFields);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const book = Object.fromEntries(updateFields.map((field) => {
    return [field, req.body[field].trim()];
  }));

  try {
    const existingBook = await getBookById(req.params.id);

    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    if (!await getAuthorById(book.authorId)) {
      return res.status(400).json({ message: 'authorId must reference an existing author.' });
    }

    await updateBookInDb(req.params.id, book);
    return res.status(200).json({ id: req.params.id, ...book });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update book.' });
  }
};

const deleteBookHandler = async (req, res) => {
  try {
    const existingBook = await getBookById(req.params.id);

    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    await deleteBookFromDb(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete book.' });
  }
};

export {
  getBooksHandler,
  getBookByIdHandler,
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
};