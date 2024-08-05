
export type ChatMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

export type IndexFormat = {
  index: string;
  aliases?: string[];
  return?: number; // Assuming a default or provided via another property if necessary.
  fields: Array<[string, string, 'sortable' | 'unsortable', string]>;
};

export type APIErrorResponse = {
  status: 'error';
  message: string;
  output: any;  // Use 'any' to allow any type of data. Consider using a more specific type if possible.
  timestamp: number;
};

export type APIResponse = {
  status: 'success' | 'error';
  prose?: string;
  ft_query?: string[];
  timestamp: number;
};
