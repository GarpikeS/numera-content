export interface Channel {
  id: number;
  username: string;
  title: string;
  rsshub_route: string;
  is_active: number;
  created_at: string;
}

export interface CollectedMessage {
  id: number;
  channel_id: number;
  external_id: string;
  content: string;
  pub_date: string;
  used_in_digest_id: number | null;
  created_at: string;
}

export interface Digest {
  id: number;
  summary: string;
  message_count: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

export type PostStatus = 'draft' | 'pending' | 'approved' | 'scheduled' | 'published' | 'rejected';
export type SourceType = 'digest' | 'idea' | 'manual' | 'mixed';

export interface Post {
  id: number;
  content: string;
  image_url: string | null;
  status: PostStatus;
  source_type: SourceType;
  digest_id: number | null;
  scheduled_at: string | null;
  published_at: string | null;
  tg_message_id: number | null;
  created_at: string;
}

export type IdeaStatus = 'active' | 'used' | 'archived';

export interface Idea {
  id: number;
  text: string;
  status: IdeaStatus;
  used_in_post_id: number | null;
  created_at: string;
}

export interface InputState {
  mode: 'edit_post' | 'add_idea' | null;
  postId?: number;
}
