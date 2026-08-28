export interface Room {
  id: string;
  title: string;
  instructions: string;
  html: string;
  css: string;
  javascript: string;
  capacity: number;
  is_demo: boolean;
  expires_at: number;
}

export interface Participant {
  id: string;
  name: string;
  status: 'joined' | 'ran' | 'done';
  joined_at: number;
  updated_at: number;
}

export interface Progress {
  participants: Array<Pick<Participant, 'name' | 'status'>>;
  counts: { joined: number; ran: number; done: number };
}

export class ApiFailure extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: { 'content-type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiFailure('offline', 'The room server cannot be reached. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiFailure(data.error ?? 'request_failed', data.message ?? 'The request failed. Try again.', response.status);
  }
  return data as T;
}
