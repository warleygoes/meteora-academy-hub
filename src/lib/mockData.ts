export interface Course {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  category: string;
  lessons: number;
  hours: number;
  students: number;
  progress?: number;
  rating: number;
  isNew?: boolean;
  isTrending?: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

const thumbnails = [
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop',
];

export const courses: Course[] = [
  { id: '1', title: 'Marketing Digital Avançado', instructor: 'Carlos Silva', thumbnail: thumbnails[0], category: 'Marketing', lessons: 42, hours: 18, students: 1240, progress: 65, rating: 4.8, isTrending: true },
  { id: '2', title: 'Python para Data Science', instructor: 'Ana Costa', thumbnail: thumbnails[1], category: 'Programação', lessons: 56, hours: 24, students: 980, progress: 30, rating: 4.9, isNew: true },
  { id: '3', title: 'Design UI/UX Completo', instructor: 'Maria Santos', thumbnail: thumbnails[2], category: 'Design', lessons: 38, hours: 16, students: 750, rating: 4.7 },
  { id: '4', title: 'Liderança e Gestão de Equipes', instructor: 'Pedro Oliveira', thumbnail: thumbnails[3], category: 'Negócios', lessons: 28, hours: 12, students: 620, rating: 4.6, isTrending: true },
  { id: '5', title: 'Fotografia Profissional', instructor: 'Julia Lima', thumbnail: thumbnails[4], category: 'Criativo', lessons: 35, hours: 15, students: 890, rating: 4.8, isNew: true },
  { id: '6', title: 'Desenvolvimento Web Full Stack', instructor: 'Rafael Mendes', thumbnail: thumbnails[5], category: 'Programação', lessons: 72, hours: 36, students: 1580, progress: 12, rating: 4.9, isTrending: true },
  { id: '7', title: 'Inteligência Artificial na Prática', instructor: 'Fernanda Alves', thumbnail: thumbnails[6], category: 'Tecnologia', lessons: 48, hours: 20, students: 1120, rating: 4.7, isNew: true },
  { id: '8', title: 'Copywriting que Converte', instructor: 'Lucas Ferreira', thumbnail: thumbnails[7], category: 'Marketing', lessons: 30, hours: 10, students: 670, rating: 4.5 },
];

export const communityPosts: CommunityPost[] = [
  { id: '1', author: 'Ana Costa', avatar: 'AC', content: 'Acabei de terminar o módulo 5 do curso de Data Science! As técnicas de Machine Learning são incríveis. Alguém mais está fazendo esse curso?', timestamp: '2h atrás', likes: 24, comments: 8 },
  { id: '2', author: 'Carlos Silva', avatar: 'CS', content: 'Compartilhando meu projeto final do curso de Marketing Digital. Consegui aumentar o ROI do meu cliente em 300%! 🚀', timestamp: '4h atrás', likes: 45, comments: 12 },
  { id: '3', author: 'Maria Santos', avatar: 'MS', content: 'Dica de design: Sempre testem suas interfaces com usuários reais. A teoria é importante, mas o feedback prático é ouro! 💡', timestamp: '6h atrás', likes: 38, comments: 15 },
  { id: '4', author: 'Pedro Oliveira', avatar: 'PO', content: 'Alguma recomendação de livros sobre liderança? Estou complementando o curso com leituras extras.', timestamp: '8h atrás', likes: 19, comments: 22 },
];
