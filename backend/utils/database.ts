/**
 * Database Module
 * Gerenciamento de conexão com PostgreSQL
 * Implementa pool de conexão, migrations e seeds
 */

import pg from 'pg';
import Logger from '../utils/logger.js';

const logger = new Logger('Database');
const { Pool } = pg;

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number | null;
}

let pool: pg.Pool | null = null;

/**
 * Inicializa pool de conexão PostgreSQL
 */
export async function initializeDatabase(): Promise<pg.Pool | null> {
  try {
    const {
      POSTGRES_USER = 'postgres',
      POSTGRES_PASSWORD = 'postgres',
      POSTGRES_DB = 'labgrandisol',
      POSTGRES_HOST = 'postgres',
      POSTGRES_PORT = 5432,
      NODE_ENV = 'development'
    } = process.env;

    pool = new Pool({
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      host: POSTGRES_HOST,
      port: parseInt(POSTGRES_PORT as string) || 5432,
      database: POSTGRES_DB,
      ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Testa conexão
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info('PostgreSQL connected successfully', {
      host: POSTGRES_HOST,
      port: POSTGRES_PORT,
      database: POSTGRES_DB,
      time: result.rows[0].now
    });

    // Executa migrations
    await runMigrations();

    return pool;
  } catch (error) {
    logger.warn('PostgreSQL not available - using Mock Database for development', {
      error: (error as Error).message
    });
    // Retorna null em desenvolvimento para usar Mock Database
    return null;
  }
}

/**
 * Executa migrations do banco de dados
 */
async function runMigrations(): Promise<void> {
  try {
    logger.info('Running migrations...');

    // Migration 001: Create users table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `);

    logger.debug('Migration 001: users table created/updated');

    // Migration 002: Create notes table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
    `);

    logger.debug('Migration 002: notes table created/updated');

    // Migration 003: Library schema - Authors table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        biography TEXT,
        birth_date DATE,
        nationality VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
    `);

    logger.debug('Migration 003: authors table created');

    // Migration 004: Categories table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
    `);

    logger.debug('Migration 004: categories table created');

    // Migration 005: Books table (core library table)
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE RESTRICT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        isbn VARCHAR(20) UNIQUE,
        description TEXT,
        publication_year INTEGER,
        publisher VARCHAR(255),
        pages INTEGER,
        language VARCHAR(50) DEFAULT 'English',
        cover_url VARCHAR(500),
        total_copies INTEGER DEFAULT 1,
        available_copies INTEGER DEFAULT 1,
        average_rating DECIMAL(3,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
      CREATE INDEX IF NOT EXISTS idx_books_author_id ON books(author_id);
      CREATE INDEX IF NOT EXISTS idx_books_category_id ON books(category_id);
      CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
      CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
    `);

    logger.debug('Migration 005: books table created');

    // Migration 006: Loans table (empréstimos)
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
        loan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NOT NULL,
        return_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        renewal_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
      CREATE INDEX IF NOT EXISTS idx_loans_book_id ON loans(book_id);
      CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
      CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
    `);

    logger.debug('Migration 006: loans table created');

    // Migration 007: Ratings table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, book_id)
      );

      CREATE INDEX IF NOT EXISTS idx_ratings_book_id ON ratings(book_id);
      CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
    `);

    logger.debug('Migration 007: ratings table created');

    // Migration 008: Reading lists
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS reading_lists (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        list_type VARCHAR(50) DEFAULT 'want_to_read',
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        position INTEGER,
        UNIQUE(user_id, book_id)
      );

      CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON reading_lists(user_id);
      CREATE INDEX IF NOT EXISTS idx_reading_lists_book_id ON reading_lists(book_id);
    `);

    logger.debug('Migration 008: reading_lists table created');

    // Migration 009: Audit logs
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        resource VARCHAR(100),
        resource_id INTEGER,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    `);

    logger.debug('Migration 009: audit_logs table created');

    // Migration 010: Sessions table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        refresh_token_hash VARCHAR(255) UNIQUE,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);

    logger.debug('Migration 010: sessions table created');

    logger.info('All migrations executed successfully');
  } catch (error) {
    logger.error('Error running migrations', error as Error);
    throw error;
  }
}

/**
 * Executa seed (dados iniciais)
 */
export async function seedDatabase(): Promise<void> {
  try {
    logger.info('Starting database seed...');

    const client = await pool!.connect();
    await client.query('BEGIN');

    try {
      // Verifica se admin já existe
      const adminCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        ['admin@library.local']
      );

      if (adminCheck.rows.length === 0) {
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.default.hash('admin@123', 10);

        // Insere admin
        await client.query(
          'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
          ['admin@library.local', passwordHash, 'Library Admin', 'admin']
        );

        logger.info('Admin user created: admin@library.local');
      }

      // Seed de categorias
      const categories = [
        { name: 'Fiction', icon: '📖', color: '#667eea' },
        { name: 'Science', icon: '🔬', color: '#764ba2' },
        { name: 'History', icon: '📜', color: '#f093fb' },
        { name: 'Technology', icon: '💻', color: '#4facfe' },
        { name: 'Self-Help', icon: '🌟', color: '#43e97b' }
      ];

      for (const cat of categories) {
        await client.query(
          'INSERT INTO categories (name, icon, color) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [cat.name, cat.icon, cat.color]
        );
      }

      // Seed de autores
      const authors = [
        { name: 'George Orwell', biography: 'British novelist and political critic' },
        { name: 'J.R.R. Tolkien', biography: 'English writer and philologist' },
        { name: 'Stephen Hawking', biography: 'British theoretical physicist' },
        { name: 'Yuval Harari', biography: 'Israeli historian and author' }
      ];

      for (const author of authors) {
        await client.query(
          'INSERT INTO authors (name, biography) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [author.name, author.biography]
        );
      }

      // Seed de livros
      const booksToAdd = [
        { title: '1984', author: 'George Orwell', category: 'Fiction' },
        { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', category: 'Fiction' },
        { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science' },
        { title: 'Sapiens', author: 'Yuval Harari', category: 'History' }
      ];

      for (const book of booksToAdd) {
        const authorResult = await client.query('SELECT id FROM authors WHERE name = $1', [book.author]);
        const categoryResult = await client.query('SELECT id FROM categories WHERE name = $1', [book.category]);

        if (authorResult.rows.length > 0 && categoryResult.rows.length > 0) {
          await client.query(
            `INSERT INTO books (title, author_id, category_id, total_copies, available_copies) 
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
            [book.title, authorResult.rows[0].id, categoryResult.rows[0].id, 3, 3]
          );
        }
      }

      await client.query('COMMIT');
      logger.info('Database seed completed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error seeding database', error as Error);
    throw error;
  }
}

/**
 * Executa query no banco
 */
export async function query<T extends Record<string, any> = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
  try {
    const start = Date.now();
    const result = await pool!.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Query executed', {
      duration,
      rowCount: result.rows.length
    });

    return result;
  } catch (error) {
    logger.error('Query error', error as Error, { sql: text });
    throw error;
  }
}

/**
 * Executa transação
 */
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool!.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error', error as Error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fecha pool de conexão
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('PostgreSQL connection closed');
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string; error?: string; database?: string }> {
  try {
    if (pool) {
      await pool.query('SELECT 1');
      return { status: 'healthy', timestamp: new Date().toISOString(), database: 'PostgreSQL' };
    } else {
      return { status: 'healthy', timestamp: new Date().toISOString(), database: 'Mock Database' };
    }
  } catch (error: any) {
    return { status: 'unhealthy', timestamp: new Date().toISOString(), error: error.message };
  }
}

export default {
  initializeDatabase,
  seedDatabase,
  query,
  transaction,
  closeDatabase,
  healthCheck
};
