const router = require('express').Router();
const pool = require('../db');

// 1. READ: Menampilkan seluruh daftar katalog buku perpustakaan
router.get('/api/books', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, author, category, stock, created_at FROM books ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. READ (Tambahan untuk verifikasi demo): Menampilkan daftar peminjaman aktif
router.get('/api/loans', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.id, b.title AS book_title, l.student_name, l.student_nis,
              l.loan_date, l.due_date, l.status
       FROM loans l
       JOIN books b ON b.id = l.book_id
       ORDER BY l.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. WRITE: Mencatat peminjaman buku baru & mengurangi stok secara atomik
router.post('/api/loans', async (req, res) => {
  const { book_id, student_name, student_nis, due_date } = req.body;

  if (!book_id || !student_name || !student_nis || !due_date) {
    return res.status(400).json({
      error: 'Field book_id, student_name, student_nis, dan due_date wajib diisi'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Kunci baris buku (Row-Level Locking) mencegah race condition saat peminjaman serentak
    const bookCheck = await client.query(
      'SELECT id, title, stock FROM books WHERE id = $1 FOR UPDATE',
      [book_id]
    );

    if (bookCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Buku tidak ditemukan' });
    }

    if (bookCheck.rows[0].stock <= 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Stok buku sedang habis dipinjam' });
    }

    // Kurangi stok buku sebanyak 1
    await client.query(
      'UPDATE books SET stock = stock - 1 WHERE id = $1',
      [book_id]
    );

    // Simpan catatan transaksi peminjaman ke tabel loans
    const loanInsert = await client.query(
      `INSERT INTO loans (book_id, student_name, student_nis, due_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [book_id, student_name, student_nis, due_date]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Peminjaman buku berhasil dicatat',
      book_title: bookCheck.rows[0].title,
      remaining_stock: bookCheck.rows[0].stock - 1,
      loan: loanInsert.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;