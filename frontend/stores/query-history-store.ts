import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueryHistoryItem {
  id: string;
  question: string;
  confidence: number;
  timestamp: number;
}

interface QueryHistoryState {
  history: QueryHistoryItem[];
  addQuery: (question: string, confidence: number) => void;
  removeQuery: (id: string) => void;
  clearHistory: () => void;
  exportHistoryJson: () => string;
}

export const useQueryHistoryStore = create<QueryHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      
      addQuery: (question, confidence) => {
        const newItem: QueryHistoryItem = {
          id: Math.random().toString(36).substring(2, 11),
          question,
          confidence,
          timestamp: Date.now(),
        };

        set((state) => {
          // Remove duplicate if user asks the same question, or limit to max 50 items (FIFO)
          const filteredHistory = state.history.filter(
            (item) => item.question.toLowerCase() !== question.toLowerCase()
          );
          
          const updatedHistory = [newItem, ...filteredHistory];
          if (updatedHistory.length > 50) {
            updatedHistory.pop(); // Remove the oldest item (FIFO)
          }

          return { history: updatedHistory };
        });
      },

      removeQuery: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      clearHistory: () => set({ history: [] }),

      exportHistoryJson: () => {
        const data = get().history;
        return JSON.stringify(data, null, 2);
      },
    }),
    {
      name: 'ragi-instant.query-history',
    }
  )
);
