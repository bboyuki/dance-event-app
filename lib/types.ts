export type Genre = 'Breaking' | 'Hip Hop' | 'Locking' | 'Popping' | 'House' | 'Waacking' | 'その他';

export type EventCategory = 'バトル' | 'コンテスト' | 'ワークショップ' | 'その他';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  prefecture: string;
  genre: Genre[];
  category: EventCategory;
  description: string;
  capacity: number;
  organizerName: string;
  organizerContact: string;
  imageBase64?: string;
  createdAt: string;
  userId?: string;
}

export interface Entry {
  id: string;
  eventId: string;
  name: string;
  genre: Genre;
  email: string;
  instagramHandle: string;
  comment: string;
  createdAt: string;
}
