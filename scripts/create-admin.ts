import bcrypt from 'bcryptjs';
import * as mariadb from 'mariadb';

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  const pool = mariadb.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'rootpassword',
    database: 'tpadel'
  });

  let conn;
  try {
    conn = await pool.getConnection();
    const id = require('crypto').randomUUID();
    const email = 'admin@tpadel.com';
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await conn.query(
      `INSERT IGNORE INTO User (id, email, password, name, lastName, role, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, 'Administrador', 'TPadel', 'ADMIN', 1, ?, ?)`,
      [id, email, passwordHash, now, now]
    );
    console.log("Admin creado: admin@tpadel.com / admin123");
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) conn.end();
    pool.end();
  }
}

main();
