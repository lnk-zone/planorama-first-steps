
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MindmapStructure } from '@/components/mindmap/MindmapVisualization';

export const useMindmap = (mindmapId?: string | null, initial?: MindmapStructure | null) => {
  const [mindmap, setMindmap] = useState<MindmapStructure | null>(initial ?? null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!mindmapId) {
      setLoading(false);
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchMindmap = async () => {
      try {
        const { data, error } = await supabase
          .from('mindmaps')
          .select('data')
          .eq('id', mindmapId)
          .single();

        if (!error && data && data.data) {
          // Safely cast the Json type to MindmapStructure
          const mindmapData = data.data as unknown as MindmapStructure;
          setMindmap(mindmapData);
        }
      } catch (error) {
        console.error('Error fetching mindmap:', error);
      }
      setLoading(false);
    };

    fetchMindmap();

    channel = supabase
      .channel(`mindmaps-${mindmapId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mindmaps', filter: `id=eq.${mindmapId}` },
        payload => {
          if (payload.new?.data) {
            const newMap = payload.new.data as unknown as MindmapStructure;
            setMindmap(newMap);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [mindmapId]);

  return { mindmap, loading };
};
