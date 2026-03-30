import { supabase } from './supabase';
import { Event, Entry } from './types';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toEvent);
}

export async function saveEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      prefecture: event.prefecture,
      genre: event.genre,
      category: event.category,
      description: event.description,
      capacity: event.capacity,
      organizer_name: event.organizerName,
      organizer_contact: event.organizerContact,
      image_base64: event.imageBase64 ?? null,
      user_id: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toEvent(data);
}

export async function getMyEvents(): Promise<Event[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toEvent);
}

export async function getEntries(eventId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toEntry);
}

export async function saveEntry(entry: Omit<Entry, 'id' | 'createdAt'>): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries')
    .insert({
      event_id: entry.eventId,
      name: entry.name,
      genre: entry.genre,
      instagram_handle: entry.instagramHandle,
      comment: entry.comment,
    })
    .select()
    .single();
  if (error) throw error;
  return toEntry(data);
}

export async function updateEvent(id: string, event: Omit<Event, 'id' | 'createdAt' | 'userId'>): Promise<Event> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('認証が必要です');
  const { data, error } = await supabase
    .from('events')
    .update({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      prefecture: event.prefecture,
      genre: event.genre,
      category: event.category,
      description: event.description,
      capacity: event.capacity,
      organizer_name: event.organizerName,
      organizer_contact: event.organizerContact,
      image_base64: event.imageBase64 ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toEvent(data);
}

export async function deleteEvent(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('認証が必要です');
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', entryId);
  if (error) throw error;
}

// DB行 → アプリの型に変換
function toEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    time: row.time as string,
    location: row.location as string,
    prefecture: row.prefecture as string,
    genre: row.genre as Event['genre'],
    category: row.category as Event['category'],
    description: row.description as string,
    capacity: row.capacity as number,
    organizerName: row.organizer_name as string,
    organizerContact: row.organizer_contact as string,
    imageBase64: row.image_base64 as string | undefined,
    createdAt: row.created_at as string,
    userId: row.user_id as string | undefined,
  };
}

function toEntry(row: Record<string, unknown>): Entry {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    name: row.name as string,
    genre: row.genre as Entry['genre'],
    instagramHandle: row.instagram_handle as string,
    comment: row.comment as string,
    createdAt: row.created_at as string,
  };
}
