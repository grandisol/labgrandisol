/**
 * Mock Database - Para desenvolvimento sem PostgreSQL
 * Fornece dados de teste em memória
 */

import Logger from './logger.js';

const logger = new Logger('MockDB');

// ==================== TIPOS ====================
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  created_at: Date;
}

export interface Book {
  id: number;
  title: string;
  author_id: number;
  category_id: number;
  isbn: string;
  description: string;
  cover_url: string;
  pages: number;
  published_year: number;
  available_copies: number;
  total_copies: number;
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  created_at: Date;
}

export interface Author {
  id: number;
  name: string;
  biography: string;
  created_at: Date;
}

export interface Loan {
  id: number;
  user_id: number;
  book_id: number;
  borrow_date: Date;
  due_date: Date;
  return_date: Date | null;
  status: 'active' | 'returned';
}

export interface Rating {
  id: number;
  user_id: number;
  book_id: number;
  rating: number;
  review: string | null;
  created_at: Date;
}

export interface ReadingList {
  id: number;
  user_id: number;
  book_id: number;
  status: 'want_to_read' | 'reading' | 'finished';
  created_at: Date;
}

// ==================== DADOS ====================
const users: User[] = [
  {
    id: 1,
    email: 'admin@library.local',
    password_hash: '$2b$10$qPXnzKsRjUKQQqPNvBoq6ecW.d7jvRtjLMKXKKJCE/Cq2ywD9VgJ2', // password: admin123
    name: 'Administrador',
    role: 'admin',
    status: 'active',
    created_at: new Date('2026-01-01'),
  },
  {
    id: 2,
    email: 'usuario@library.local',
    password_hash: '$2b$10$qPXnzKsRjUKQQqPNvBoq6ecW.d7jvRtjLMKXKKJCE/Cq2ywD9VgJ2', // password: user123
    name: 'Usuário Teste',
    role: 'user',
    status: 'active',
    created_at: new Date('2026-01-15'),
  },
];

const authors: Author[] = [
  {
    id: 1,
    name: 'George Orwell',
    biography: 'Escritor e jornalista inglês, conhecido por seus romances de ficção científica.',
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'J.R.R. Tolkien',
    biography: 'Filólogo e escritor britânico, criador do mundo de Middle-earth.',
    created_at: new Date(),
  },
  {
    id: 3,
    name: 'Stephen Hawking',
    biography: 'Físico teórico e cosmólogo inglês, especialista em buracos negros.',
    created_at: new Date(),
  },
  {
    id: 4,
    name: 'Yuval Noah Harari',
    biography: 'Historiador israelense, autor de best-sellers sobre história da humanidade.',
    created_at: new Date(),
  },
];

const categories: Category[] = [
  {
    id: 1,
    name: 'Ficção',
    icon: '📖',
    color: '#FF6B6B',
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'Ciência',
    icon: '🔬',
    color: '#4ECDC4',
    created_at: new Date(),
  },
  {
    id: 3,
    name: 'História',
    icon: '📜',
    color: '#FFE66D',
    created_at: new Date(),
  },
  {
    id: 4,
    name: 'Tecnologia',
    icon: '💻',
    color: '#95E1D3',
    created_at: new Date(),
  },
  {
    id: 5,
    name: 'Auto-ajuda',
    icon: '🌱',
    color: '#C7CEEA',
    created_at: new Date(),
  },
];

const books: Book[] = [
  {
    id: 1,
    title: '1984',
    author_id: 1,
    category_id: 1,
    isbn: '978-0451524935',
    description: 'Um romance distópico sobre um regime totalitário que controla todos os aspectos da vida.',
    cover_url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400',
    pages: 328,
    published_year: 1949,
    available_copies: 3,
    total_copies: 5,
    created_at: new Date(),
  },
  {
    id: 2,
    title: 'O Senhor dos Anéis',
    author_id: 2,
    category_id: 1,
    isbn: '978-0544003415',
    description: 'Uma jornada épica através de um mundo mágico para destruir um artefato de poder absoluto.',
    cover_url: 'https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=400',
    pages: 1216,
    published_year: 1954,
    available_copies: 2,
    total_copies: 4,
    created_at: new Date(),
  },
  {
    id: 3,
    title: 'Uma Breve História do Tempo',
    author_id: 3,
    category_id: 2,
    isbn: '978-0553380163',
    description: 'Uma exploração dos buracos negros, do Big Bang e da natureza do tempo e do universo.',
    cover_url: 'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=400',
    pages: 256,
    published_year: 1988,
    available_copies: 4,
    total_copies: 5,
    created_at: new Date(),
  },
  {
    id: 4,
    title: 'Sapiens',
    author_id: 4,
    category_id: 3,
    isbn: '978-0062316097',
    description: 'Uma história da humanidade desde o surgimento dos Homo sapiens até os dias atuais.',
    cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    pages: 498,
    published_year: 2014,
    available_copies: 5,
    total_copies: 6,
    created_at: new Date(),
  },
];

const loans: Loan[] = [];
const ratings: Rating[] = [
  {
    id: 1,
    user_id: 2,
    book_id: 1,
    rating: 5,
    review: 'Livro excelente, muito envolvente e perturbador.',
    created_at: new Date(),
  },
  {
    id: 2,
    user_id: 2,
    book_id: 4,
    rating: 5,
    review: 'Perspectiva fascinante sobre a história humana.',
    created_at: new Date(),
  },
];

const readingLists: ReadingList[] = [
  {
    id: 1,
    user_id: 2,
    book_id: 2,
    status: 'want_to_read',
    created_at: new Date(),
  },
  {
    id: 2,
    user_id: 2,
    book_id: 3,
    status: 'reading',
    created_at: new Date(),
  },
];

// ==================== QUERIES ====================
export const mockDB = {
  users,
  authors,
  categories,
  books,
  loans,
  ratings,
  readingLists,

  // User queries
  getUserByEmail(email: string): User | undefined {
    return users.find(u => u.email === email);
  },

  getUserById(id: number): User | undefined {
    return users.find(u => u.id === id);
  },

  // Book queries
  getAllBooks(limit: number = 20, offset: number = 0) {
    const enrichedBooks = books.slice(offset, offset + limit).map((book: any) => {
      const author = authors.find(a => a.id === book.author_id);
      const category = categories.find(c => c.id === book.category_id);
      const bookRating = ratings.find(r => r.book_id === book.id);
      
      return {
        ...book,
        author: author?.name || 'Desconhecido',
        genre: category?.name || 'Geral',
        rating: bookRating?.rating || 4,
      };
    });
    
    return {
      rows: enrichedBooks,
      rowCount: books.length,
    };
  },

  searchBooks(q: string, limit: number = 20, offset: number = 0) {
    const filtered = books.filter(
      b => b.title.toLowerCase().includes(q.toLowerCase()) ||
           b.description.toLowerCase().includes(q.toLowerCase())
    );
    return {
      rows: filtered.slice(offset, offset + limit),
      rowCount: filtered.length,
    };
  },

  getBookById(id: number) {
    const book = books.find(b => b.id === id);
    const author = book ? authors.find(a => a.id === book.author_id) : null;
    const category = book ? categories.find(c => c.id === book.category_id) : null;
    const bookRatings = book ? ratings.filter(r => r.book_id === book.id) : [];
    const avgRating = bookRatings.length > 0
      ? bookRatings.reduce((sum, r) => sum + r.rating, 0) / bookRatings.length
      : 0;

    if (!book) return null;

    return {
      ...book,
      author,
      category,
      ratings: bookRatings,
      average_rating: avgRating,
      ratings_count: bookRatings.length,
    };
  },

  // Category queries
  getAllCategories() {
    return {
      rows: categories,
      rowCount: categories.length,
    };
  },

  // Loan queries
  getUserLoans(userId: number) {
    return {
      rows: loans.filter(l => l.user_id === userId),
      rowCount: loans.filter(l => l.user_id === userId).length,
    };
  },

  createLoan(userId: number, bookId: number) {
    const loan: Loan = {
      id: loans.length + 1,
      user_id: userId,
      book_id: bookId,
      borrow_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      return_date: null,
      status: 'active',
    };
    loans.push(loan);
    return loan;
  },

  // Rating queries
  createRating(userId: number, bookId: number, rating: number, review?: string) {
    const newRating: Rating = {
      id: ratings.length + 1,
      user_id: userId,
      book_id: bookId,
      rating,
      review: review || null,
      created_at: new Date(),
    };
    ratings.push(newRating);
    return newRating;
  },

  // Reading list queries
  getUserReadingList(userId: number) {
    return {
      rows: readingLists.filter(rl => rl.user_id === userId),
      rowCount: readingLists.filter(rl => rl.user_id === userId).length,
    };
  },

  addToReadingList(userId: number, bookId: number, status: string) {
    const item: ReadingList = {
      id: readingLists.length + 1,
      user_id: userId,
      book_id: bookId,
      status: status as any,
      created_at: new Date(),
    };
    readingLists.push(item);
    return item;
  },

  removeFromReadingList(id: number) {
    const index = readingLists.findIndex(rl => rl.id === id);
    if (index !== -1) {
      readingLists.splice(index, 1);
    }
  },
};

logger.info('Mock database initialized with seed data');
