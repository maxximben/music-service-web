export type SearchItem = {
  cover: string | null;
  name: string;
  type: string;
  author: string;
  id: number;
};

export type SearchResponse = {
  items: SearchItem[];
};
