import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { loadReadIds, saveReadIds } from './readState';

const READ_KEY = ['notices', 'read'] as const;

export function useReadNoticeIds() {
  return useQuery({ queryKey: READ_KEY, queryFn: loadReadIds, staleTime: Infinity });
}

/** お知らせ詳細を開いたら既読にする */
export function useMarkNoticeRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const current = await loadReadIds();
      if (current.includes(id)) return current;
      const next = [...current, id];
      await saveReadIds(next);
      return next;
    },
    onSuccess: (next) => queryClient.setQueryData(READ_KEY, next),
  });
}
