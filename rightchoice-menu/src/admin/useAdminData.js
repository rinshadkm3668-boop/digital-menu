import { useCallback, useEffect, useState } from 'react';
import { fetchAllAdmin } from '../lib/data';

export default function useAdminData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setData(await fetchAllAdmin());
      setError('');
    } catch (e) {
      setError(e.message || 'Could not load data.');
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}
