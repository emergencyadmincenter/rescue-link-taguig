// Replace with actual environment variable in real app
const API_URL = 'http://localhost:3001';

export interface PersonnelItem {
  id: string;
  name: string;
  email: string;
  status: 'pending_activation' | 'active' | 'inactive';
  createdAt: string;
}

export interface PersonnelGroup {
  role: string;
  count: number;
  personnel: PersonnelItem[];
}

export interface GetPersonnelResponse {
  groups: PersonnelGroup[];
}

export const getPersonnel = async (
  search?: string,
  status?: string
): Promise<GetPersonnelResponse> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (status) params.append('status', status);

  const queryString = params.toString();
  const url = `${API_URL}/personnel${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  
  return response.json();
};
