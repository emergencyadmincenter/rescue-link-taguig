import { useState, useEffect } from 'react';
import { MOCK_PERSONNEL_GROUPS } from '../constants/personnel-mock-data';
import { PersonnelGroup, PersonnelStatus } from '../types/personnel.types';

const USE_MOCK = true;

interface UsePersonnelParams {
  search?: string;
  status?: PersonnelStatus | '';
}

export const usePersonnel = (params?: UsePersonnelParams) => {
  const [groups, setGroups] = useState<PersonnelGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPersonnel = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (USE_MOCK) {
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          let filteredGroups = JSON.parse(JSON.stringify(MOCK_PERSONNEL_GROUPS)) as PersonnelGroup[];
          
          if (params?.search || params?.status) {
            filteredGroups = filteredGroups.map(group => {
              const filteredPersonnel = group.personnel.filter(person => {
                const matchesSearch = params.search 
                  ? person.name.toLowerCase().includes(params.search.toLowerCase()) || 
                    person.email.toLowerCase().includes(params.search.toLowerCase())
                  : true;
                  
                const matchesStatus = params.status
                  ? person.status === params.status
                  : true;
                  
                return matchesSearch && matchesStatus;
              });
              
              return {
                ...group,
                personnel: filteredPersonnel,
                count: filteredPersonnel.length
              };
            });
          }
          
          if (isMounted) {
            setGroups(filteredGroups);
          }
        } else {
          // Future real API call goes here
          // const response = await getPersonnel(params);
          // if (isMounted) setGroups(response.groups);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch personnel'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPersonnel();
    
    return () => {
      isMounted = false;
    };
  }, [params?.search, params?.status]);

  return { groups, isLoading, error };
};
