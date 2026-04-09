export interface ContentProduct {
  id: string;
  name: string;
  description: string | null;
  type: string;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
  course_id: string | null;
  saas_url: string | null;
  category_name?: string;
  category_names?: string[];
  lesson_count: number;
  enrollment_count: number;
  progress?: number; // 0-100 percentage of completed lessons
}
