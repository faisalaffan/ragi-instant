export interface Document {
  id: string;
  title: string;
  source_type: 'pdf' | 'docx' | 'url' | 'text';
  source_path: string;
  status: 'pending' | 'parsing' | 'chunking' | 'indexing' | 'ready' | 'error';
  error_message: string | null;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  sequence: number;
  content: string;
  section: string | null;
  page: number | null;
  meta: Record<string, unknown>;
}

export interface Citation {
  chunk_id: string;
  document_title: string;
  page: number | null;
  section: string | null;
  quote: string;
}

export interface AnswerResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
  related_regulations: string[];
}

export interface RegulationChange {
  category: 'new_addition' | 'modification' | 'removal' | 'renumbering';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
  old_text: string | null;
  new_text: string | null;
  affected_sections: string[];
}

export interface ChangeReport {
  old_document_title: string;
  new_document_title: string;
  summary: string;
  changes: RegulationChange[];
  unchanged_core: string | null;
}

export type StatusFilter = 'all' | 'ready' | 'indexing' | 'error' | 'pending';
