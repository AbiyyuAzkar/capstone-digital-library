CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    category VARCHAR(60) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    student_nis VARCHAR(30) NOT NULL,
    loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BORROWED',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data awal katalog buku perpustakaan sekolah
INSERT INTO books (title, author, category, stock) VALUES
('Laskar Pelangi', 'Andrea Hirata', 'Fiksi', 5),
('Matematika Diskrit dan Aplikasinya', 'Rinaldi Munir', 'Sains & Teknologi', 3),
('Sejarah Nasional Indonesia', 'Marwati Djoened', 'Sejarah', 4),
('Fisika Dasar untuk SMA/MA', 'Marthen Kanginan', 'Pelajaran', 6)
ON CONFLICT DO NOTHING;