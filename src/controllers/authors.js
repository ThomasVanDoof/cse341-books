import {
  getAllAuthors as getAllAuthorsFromDb,
  getAuthorById as getAuthorByIdFromDb,
  createAuthor as createAuthorInDb,
  updateAuthor as updateAuthorInDb,
  deleteAuthor as deleteAuthorFromDb,
  authorHasBooks,
} from '../models/authors.js';

const validateAuthor = (author, includeId) => {
  const input = author || {};
  const requiredFields = includeId
    ? ['id', 'name', 'birthYear']
    : ['name', 'birthYear'];

  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null) {
      return `${field} is required.`;
    }
  }

  if (includeId && (typeof input.id !== 'string' || !input.id.trim())) {
    return 'id must be a non-empty string.';
  }

  if (typeof input.name !== 'string' || !input.name.trim()) {
    return 'name must be a non-empty string.';
  }

  if (!Number.isInteger(input.birthYear)) {
    return 'birthYear must be an integer.';
  }

  return null;
};

const getAllAuthors = async (req, res) => {
  try {
    const authors = await getAllAuthorsFromDb();
    return res.status(200).json(authors);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve authors.' });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const author = await getAuthorByIdFromDb(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    return res.status(200).json(author);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to retrieve author.' });
  }
};

const createAuthor = async (req, res) => {
  const validationError = validateAuthor(req.body, true);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const author = {
    id: req.body.id.trim(),
    name: req.body.name.trim(),
    birthYear: req.body.birthYear,
  };

  try {
    await createAuthorInDb(author);
    return res.status(201).json(author);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Author id already exists.' });
    }

    return res.status(500).json({ message: 'Unable to create author.' });
  }
};

const updateAuthor = async (req, res) => {
  const validationError = validateAuthor(req.body, false);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const author = {
    name: req.body.name.trim(),
    birthYear: req.body.birthYear,
  };

  try {
    const existingAuthor = await getAuthorByIdFromDb(req.params.id);

    if (!existingAuthor) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    await updateAuthorInDb(req.params.id, author);
    return res.status(200).json({ ...existingAuthor, ...author });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update author.' });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const existingAuthor = await getAuthorByIdFromDb(req.params.id);

    if (!existingAuthor) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    if (await authorHasBooks(req.params.id)) {
      return res.status(409).json({ message: 'Author still has books.' });
    }

    await deleteAuthorFromDb(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete author.' });
  }
};

export {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
};