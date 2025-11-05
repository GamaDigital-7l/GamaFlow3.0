import { Goal } from "./goals";

export type FileType = 'pdf' | 'epub' | 'mobi';
export type ReadingStatus = 'Lido' | 'Lendo' | 'Quero Ler';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  file_url: string;
  file_type: FileType;
  description?: string;
  page_count: number;
  tags: string[];
  category: string;
  rating: number;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  reading_status: ReadingStatus;
  last_read_at: string;
  reading_time_seconds: number;
  settings: ReadingSettings;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  text_content: string;
  note?: string;
  color: string;
  created_at: string;
}

export interface ReadingSettings {
  theme: 'light' | 'dark' | 'sepia' | 'high-contrast';
  fontSize: number; // 12-24
  fontFamily: string; // 'serif', 'sans-serif', 'monospace'
  lineSpacing: number; // 1.0 - 2.0
  margins: number; // 10-50
  scrollMode: 'page' | 'scroll';
  autoNightMode: boolean;
}

// Tipos para Coleções (Simulado, pois não criamos a tabela collections ainda)
export interface Collection {
    id: string;
    user_id: string;
    name: string;
    bookIds: string[];
    isPublic: boolean;
}