export type BlockType =
  | 'text'
  | 'title'
  | 'subtitle'
  | 'button'
  | 'checkbox'
  | 'multipleChoice'
  | 'video'
  | 'image'
  | 'login'
  | 'links'
  | 'number'
  | 'clientLogin'
  | 'upload';

export interface Block {
  id: string;
  type: BlockType;
  data: any;
}

export interface TextBlockData {
  text: string;
}

export interface TitleBlockData {
  title: string;
}

export interface SubtitleBlockData {
  subtitle: string;
}

export interface ButtonBlockData {
  label: string;
  url: string;
}

export interface CheckboxBlockData {
  label: string;
}

export interface MultipleChoiceBlockData {
  question: string;
  options: string[];
  type: 'radio' | 'select';
}

export interface VideoBlockData {
  url: string;
  upload?: File;
}

export interface ImageBlockData {
  url: string;
  upload?: File;
}

export interface LoginBlockData {
  // No specific data needed, handled by auth system
}

export interface LinksBlockData {
  links: { title: string; url: string; }[];
}

export interface NumberBlockData {
  label: string;
  placeholder?: string;
}

export interface ClientLoginBlockData {
  // Similar to LoginBlockData, handled separately
}

export interface UploadBlockData {
  label: string;
  allowedTypes?: string[];
}