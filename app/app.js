const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

const initDb = () => {
    pool.query('SELECT 1', (err) => {
        if (err) {
            console.log('Menunggu database siap... coba lagi dalam 3 detik. Error:', err.message);
            setTimeout(initDb, 3000);
            return;
        }
        console.log('Database terhubung dengan sukses!');
        pool.query(`CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE
        )`);
    });
};
initDb();

app.get('/users', (req, res) => {
    pool.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name dan Email wajib diisi!' });

    pool.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: results.insertId, name, email });
    });
});

app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    
    pool.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ message: 'Data user berhasil diperbarui', id, name, email });
    });
});

app.delete('/users/:id', (req, res) => {
    const { id } = req.params;
    
    pool.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ message: `User dengan ID ${id} berhasil dihapus` });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server User Service berjalan pada port ${PORT}`);
});