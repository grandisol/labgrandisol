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
  borrow_date: Date | string;
  due_date: Date | string;
  return_date: Date | string | null;
  status: 'active' | 'returned';
  renewal_count: number;
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
    email: 'admin@labgrandisol.com',
    password_hash: 'admin123', // Senha simples para desenvolvimento
    name: 'Administrador',
    role: 'admin',
    status: 'active',
    created_at: new Date('2026-01-01'),
  },
  {
    id: 2,
    email: 'usuario@labgrandisol.com',
    password_hash: 'user123', // Senha simples para desenvolvimento
    name: 'João Silva',
    role: 'user',
    status: 'active',
    created_at: new Date('2026-01-15'),
  },
  {
    id: 3,
    email: 'maria@labgrandisol.com',
    password_hash: 'maria123',
    name: 'Maria Santos',
    role: 'user',
    status: 'active',
    created_at: new Date('2026-02-01'),
  },
];

const authors: Author[] = [
  {
    id: 1,
    name: 'George Orwell',
    biography: 'Escritor e jornalista inglês, conhecido por seus romances de ficção científica distópica como 1984 e A Revolução dos Bichos.',
    created_at: new Date(),
  },
  {
    id: 2,
    name: 'J.R.R. Tolkien',
    biography: 'Filólogo e escritor britânico, criador do mundo de Middle-earth e autor de O Hobbit e O Senhor dos Anéis.',
    created_at: new Date(),
  },
  {
    id: 3,
    name: 'Stephen Hawking',
    biography: 'Físico teórico e cosmólogo inglês, especialista em buracos negros e autor de best-sellers científicos.',
    created_at: new Date(),
  },
  {
    id: 4,
    name: 'Yuval Noah Harari',
    biography: 'Historiador israelense, autor de best-sellers sobre história da humanidade como Sapiens e Homo Deus.',
    created_at: new Date(),
  },
  {
    id: 5,
    name: 'Miguel de Cervantes',
    biography: 'Escritor espanhol, autor de Don Quixote, considerada uma das obras fundamentais da literatura ocidental.',
    created_at: new Date(),
  },
  {
    id: 6,
    name: 'Gabriel García Márquez',
    biography: 'Escritor colombiano, premio Nobel de Literatura, mestre do realismo mágico.',
    created_at: new Date(),
  },
  {
    id: 7,
    name: 'Charles Darwin',
    biography: 'Naturalista inglês, formulou a teoria da evolução por seleção natural.',
    created_at: new Date(),
  },
  {
    id: 8,
    name: 'Richard Dawkins',
    biography: 'Biólogo evolucionista británico, autor de O Gene Egoísta e defensor do ateísmo.',
    created_at: new Date(),
  },
  {
    id: 9,
    name: 'Dan Brown',
    biography: 'Escritor americano, autor de best-sellers como O Código Da Vinci, Anjos e Demônios.',
    created_at: new Date(),
  },
  {
    id: 10,
    name: 'Walter Isaacson',
    biography: 'Jornalista americano, autor de biografias de Steve Jobs, Benjamin Franklin e Albert Einstein.',
    created_at: new Date(),
  },
  {
    id: 11,
    name: 'Napoleon Hill',
    biography: 'Escritor americano, autor de Pense e Enriqueça, um dos livros de autoajuda mais vendidos da história.',
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
    description: 'Um romance distópico sobre um regime totalitário que controla todos os aspectos da vida. Winston Smith trabalha no Ministério da Verdade, reescrevendo a história conforme as necessidades do Partido. Mas ele questiona o sistema e começa a elaborar um plano de resistência.',
    cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
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
    description: 'Uma jornada épica através de um mundo mágico para destruir um artefato de poder absoluto. Frodo Baggins herda o Um Anel e deve travelhar até a Montanha da Perdição para destruí-lo.',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
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
    description: 'Uma exploração acessível dos buracos negros, do Big Bang e da natureza do tempo e do universo. Stephen Hawking apresenta os conceitos fundamentais da cosmologia moderna.',
    cover_url: 'https://images.unsplash.com/photo-1462536943532-57a629f6cc60?w=400',
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
    description: 'Uma história da humanidade desde o surgimento dos Homo sapiens até os dias atuais. Yuval Noah Harari explora como a cognição, a agricultura e a religião moldaram nossa espécie.',
    cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    pages: 498,
    published_year: 2014,
    available_copies: 5,
    total_copies: 6,
    created_at: new Date(),
  },
  {
    id: 5,
    title: 'Dom Quixote',
    author_id: 5,
    category_id: 1,
    isbn: '978-0060934347',
    description: 'A história de umidalgo espanhol que enlouquece lendo romances de cavalaria e parte em aventuras com seu escudeiro Sancho Pança.',
    cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
    pages: 1023,
    published_year: 1605,
    available_copies: 3,
    total_copies: 4,
    created_at: new Date(),
  },
  {
    id: 6,
    title: 'Cem Anos de Solidão',
    author_id: 6,
    category_id: 1,
    isbn: '978-0060883287',
    description: 'A saga da família Buendía na cidade fictícia de Macondo, misturando realismo mágico com história latino-americana.',
    cover_url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400',
    pages: 417,
    published_year: 1967,
    available_copies: 4,
    total_copies: 5,
    created_at: new Date(),
  },
  {
    id: 7,
    title: 'A Origem das Espécies',
    author_id: 7,
    category_id: 2,
    isbn: '978-0451529060',
    description: 'A obra fundamental de Charles Darwin que estabeleceu a teoria da evolução por seleção natural.',
    cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    pages: 576,
    published_year: 1859,
    available_copies: 2,
    total_copies: 3,
    created_at: new Date(),
  },
  {
    id: 8,
    title: 'O Gene Egoísta',
    author_id: 8,
    category_id: 2,
    isbn: '978-0198788607',
    description: 'Richard Dawkins explora a evolução do ponto de vista dos genes, argumentando que somos máquinas de sobrevivência para o DNA.',
    cover_url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400',
    pages: 360,
    published_year: 1976,
    available_copies: 3,
    total_copies: 4,
    created_at: new Date(),
  },
  {
    id: 9,
    title: 'O Hobbit',
    author_id: 2,
    category_id: 1,
    isbn: '978-0547928227',
    description: 'A aventura de Bilbo Bolseiro que descobre um anel mágico e acompaña Gandalf e anões em uma missão para recuperar o Reino de Erebor.',
    cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
    pages: 310,
    published_year: 1937,
    available_copies: 5,
    total_copies: 6,
    created_at: new Date(),
  },
  {
    id: 10,
    title: 'O Código Da Vinci',
    author_id: 9,
    category_id: 1,
    isbn: '978-0307474278',
    description: 'Um thriller que segue Robert Langdon decifrando pistas deixadas por Leonardo da Vinci para revelar um segredo que poderia mudar a história da igreja.',
    cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    pages: 489,
    published_year: 2003,
    available_copies: 4,
    total_copies: 5,
    created_at: new Date(),
  },
  {
    id: 11,
    title: 'Steve Jobs',
    author_id: 10,
    category_id: 4,
    isbn: '978-1451648539',
    description: 'A biografia definitiva de Steve Jobs baseada em mais de quarenta entrevistas com Jobs realizadas ao longo de dois anos.',
    cover_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400',
    pages: 656,
    published_year: 2011,
    available_copies: 3,
    total_copies: 4,
    created_at: new Date(),
  },
  {
    id: 12,
    title: 'Pense e Enriqueça',
    author_id: 11,
    category_id: 5,
    isbn: '978-1585424337',
    description: 'Um dos livros de autoajuda mais vendidos de todos os tempos, apresentando treze princípios para alcançar o sucesso financeiro.',
    cover_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400',
    pages: 238,
    published_year: 1937,
    available_copies: 6,
    total_copies: 8,
    created_at: new Date(),
  },
];

const loans: Loan[] = [
  {
    id: 1,
    user_id: 2,
    book_id: 1,
    borrow_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    due_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
    return_date: null,
    status: 'active',
    renewal_count: 0,
  },
];

const ratings: Rating[] = [
  {
    id: 1,
    user_id: 2,
    book_id: 1,
    rating: 5,
    review: 'Livro excelente, muito envolvente e perturbador. Uma leitura obrigatória para entender os perigos do totalitarismo.',
    created_at: new Date(),
  },
  {
    id: 2,
    user_id: 2,
    book_id: 4,
    rating: 5,
    review: 'Perspectiva fascinante sobre a história humana. Muito bem escrito e acessível.',
    created_at: new Date(),
  },
  {
    id: 3,
    user_id: 3,
    book_id: 2,
    rating: 5,
    review: 'Obra-prima da literatura fantástica. Tolkien criou um mundo inesquecível.',
    created_at: new Date(),
  },
  {
    id: 4,
    user_id: 3,
    book_id: 9,
    rating: 4,
    review: 'Uma aventura divertida, perfeita para introduzir o universo de Tolkien.',
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
  {
    id: 3,
    user_id: 3,
    book_id: 1,
    status: 'finished',
    created_at: new Date(),
  },
  {
    id: 4,
    user_id: 3,
    book_id: 4,
    status: 'reading',
    created_at: new Date(),
  },
  {
    id: 5,
    user_id: 3,
    book_id: 6,
    status: 'want_to_read',
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
      renewal_count: 0,
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
