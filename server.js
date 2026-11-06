const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'library.json');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SESSION_SECRET || 'change-this-library-secret', resave: false, saveUninitialized: false, cookie: { httpOnly: true } }));
app.use(express.static(path.join(__dirname, 'public')));

function initialData() {
  return {
    books: [
      { id: 1, title: 'Introduction to Java', author: 'Herbert Schildt', available: true },
      { id: 2, title: 'Operating System Concepts', author: 'Abraham Silberschatz', available: true },
      { id: 3, title: 'Clean Code', author: 'Robert C. Martin', available: true }
    ],
    students: [],
    issues: [],
    nextBookId: 4,
    nextStudentId: 1,
    nextIssueId: 1
  };
}
function loadData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(initialData(), null, 2));
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
let db = loadData();
function save() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
function adminOnly(req, res, next) {
  if (!req.session.isAdmin) return res.status(401).json({ error: 'Please login as admin first.' });
  next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ message: 'Login successful' });
  }
  res.status(401).json({ error: 'Invalid username or password' });
});
app.post('/api/logout', (req, res) => { req.session.destroy(() => res.json({ message: 'Logged out' })); });
app.get('/api/books', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  res.json(db.books.filter(b => `${b.title} ${b.author}`.toLowerCase().includes(q)));
});
app.post('/api/books', adminOnly, (req, res) => {
  const title = String(req.body.title || '').trim();
  const author = String(req.body.author || '').trim();
  if (!title || !author) return res.status(400).json({ error: 'Book title and author are required.' });
  const book = { id: db.nextBookId++, title, author, available: true };
  db.books.push(book); save(); res.status(201).json(book);
});
app.put('/api/books/:id', adminOnly, (req, res) => {
  const book = db.books.find(b => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  book.title = String(req.body.title || book.title).trim();
  book.author = String(req.body.author || book.author).trim();
  save(); res.json(book);
});
app.delete('/api/books/:id', adminOnly, (req, res) => {
  const book = db.books.find(b => b.id === Number(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (db.issues.some(i => i.bookId === book.id && !i.returnedAt)) return res.status(400).json({ error: 'Return this book before deleting it.' });
  db.books = db.books.filter(b => b.id !== book.id); save(); res.json({ message: 'Book deleted' });
});
app.get('/api/students', adminOnly, (req, res) => res.json(db.students));
app.post('/api/students', adminOnly, (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  if (!name || !email) return res.status(400).json({ error: 'Student name and email are required.' });
  if (db.students.some(s => s.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'A student with this email already exists.' });
  const student = { id: db.nextStudentId++, name, email };
  db.students.push(student); save(); res.status(201).json(student);
});
app.get('/api/issues', adminOnly, (req, res) => res.json(db.issues.map(i => ({ ...i, book: db.books.find(b => b.id === i.bookId), student: db.students.find(s => s.id === i.studentId), fine: fineFor(i) }))));
function fineFor(issue) {
  const end = issue.returnedAt ? new Date(issue.returnedAt) : new Date();
  const days = Math.max(0, Math.ceil((end - new Date(issue.dueDate)) / 86400000));
  return days * 5;
}
app.post('/api/issues', adminOnly, (req, res) => {
  const book = db.books.find(b => b.id === Number(req.body.bookId));
  const student = db.students.find(s => s.id === Number(req.body.studentId));
  if (!book || !student) return res.status(404).json({ error: 'Select a valid book and student.' });
  if (!book.available) return res.status(409).json({ error: 'This book is not available.' });
  const issue = { id: db.nextIssueId++, bookId: book.id, studentId: student.id, issuedAt: new Date().toISOString(), dueDate: req.body.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), returnedAt: null };
  db.issues.push(issue); book.available = false; save(); res.status(201).json(issue);
});
app.post('/api/issues/:id/return', adminOnly, (req, res) => {
  const issue = db.issues.find(i => i.id === Number(req.params.id));
  if (!issue) return res.status(404).json({ error: 'Issue record not found.' });
  if (issue.returnedAt) return res.status(400).json({ error: 'This book has already been returned.' });
  issue.returnedAt = new Date().toISOString();
  const book = db.books.find(b => b.id === issue.bookId); if (book) book.available = true;
  save(); res.json({ message: 'Book returned', fine: fineFor(issue) });
});
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.listen(PORT, '0.0.0.0', () => console.log(`Library Management System running on http://localhost:${PORT}`));
