// useKalkyler.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

export const useKalkyler = () => {
  const { user } = useAuth();
  const [kalkyler, setKalkyler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Hämta alla kalkyler för användaren
  const fetchKalkyler = useCallback(async () => {
    if (!user) {
      // Om inte inloggad, ladda från localStorage
      const localData = localStorage.getItem('fastighetskalkyl_saved_v2');
      if (localData) {
        const parsed = JSON.parse(localData);
        setKalkyler(parsed.calcs || []);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kalkyler')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Konvertera från databas-format till app-format
      const formatted = data.map(k => ({
        id: k.id,
        name: k.name,
        data: k.data,
        renoveringar: k.renoveringar || [],
        renoveringBelastarDrift: k.renovering_belastar_drift || false,
        fordelar: k.fordelar || [],
        nackdelar: k.nackdelar || [],
        timestamp: k.updated_at,
        synced: true
      }));

      setKalkyler(formatted);

      // Spara också lokalt som backup
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: formatted }));

    } catch (err) {
      console.error('Fel vid hämtning av kalkyler:', err);
      // Fallback till localStorage vid fel
      const localData = localStorage.getItem('fastighetskalkyl_saved_v2');
      if (localData) {
        setKalkyler(JSON.parse(localData).calcs || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Ladda kalkyler vid mount och när användare ändras
  useEffect(() => {
    fetchKalkyler();
  }, [fetchKalkyler]);

  // Spara ny kalkyl
  const saveKalkyl = async (kalkyl) => {
    if (!user) {
      // Spara lokalt om inte inloggad
      const newKalkyl = {
        ...kalkyl,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        synced: false
      };
      const updated = [...kalkyler, newKalkyl];
      setKalkyler(updated);
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: updated }));
      return { data: newKalkyl, error: null };
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('kalkyler')
        .insert({
          user_id: user.id,
          name: kalkyl.name,
          data: kalkyl.data,
          renoveringar: kalkyl.renoveringar || [],
          renovering_belastar_drift: kalkyl.renoveringBelastarDrift || false,
          fordelar: kalkyl.fordelar || [],
          nackdelar: kalkyl.nackdelar || []
        })
        .select()
        .single();

      if (error) throw error;

      const newKalkyl = {
        id: data.id,
        name: data.name,
        data: data.data,
        renoveringar: data.renoveringar || [],
        renoveringBelastarDrift: data.renovering_belastar_drift || false,
        fordelar: data.fordelar || [],
        nackdelar: data.nackdelar || [],
        timestamp: data.updated_at,
        synced: true
      };

      const updated = [...kalkyler, newKalkyl];
      setKalkyler(updated);
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: updated }));

      return { data: newKalkyl, error: null };
    } catch (err) {
      console.error('Fel vid sparande:', err);
      return { data: null, error: err };
    } finally {
      setSyncing(false);
    }
  };

  // Uppdatera befintlig kalkyl
  const updateKalkyl = async (id, updates) => {
    if (!user) {
      // Uppdatera lokalt
      const updated = kalkyler.map(k => 
        k.id === id ? { ...k, ...updates, timestamp: new Date().toISOString() } : k
      );
      setKalkyler(updated);
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: updated }));
      return { error: null };
    }

    setSyncing(true);
    try {
      const { error } = await supabase
        .from('kalkyler')
        .update({
          name: updates.name,
          data: updates.data,
          renoveringar: updates.renoveringar || [],
          renovering_belastar_drift: updates.renoveringBelastarDrift || false,
          fordelar: updates.fordelar || [],
          nackdelar: updates.nackdelar || []
        })
        .eq('id', id);

      if (error) throw error;

      const updated = kalkyler.map(k => 
        k.id === id ? { ...k, ...updates, timestamp: new Date().toISOString(), synced: true } : k
      );
      setKalkyler(updated);
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: updated }));

      return { error: null };
    } catch (err) {
      console.error('Fel vid uppdatering:', err);
      return { error: err };
    } finally {
      setSyncing(false);
    }
  };

  // Ta bort kalkyl
  const deleteKalkyl = async (id) => {
    if (!user) {
      const updated = kalkyler.filter(k => k.id !== id);
      setKalkyler(updated);
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: updated }));
      return { error: null };
    }

    setSyncing(true);
    try {
      const { error } = await supabase
        .from('kalkyler')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const updated = kalkyler.filter(k => k.id !== id);
      setKalkyler(updated);
      localStorage.setItem('fastighetskalkyl_saved_v2', JSON.stringify({ calcs: updated }));

      return { error: null };
    } catch (err) {
      console.error('Fel vid borttagning:', err);
      return { error: err };
    } finally {
      setSyncing(false);
    }
  };

  // Synka lokala kalkyler till molnet (efter inloggning)
  const syncLocalToCloud = async () => {
    if (!user) return;

    const localData = localStorage.getItem('fastighetskalkyl_saved_v2');
    if (!localData) return;

    const localCalcs = JSON.parse(localData).calcs || [];
    const unsyncedCalcs = localCalcs.filter(c => !c.synced && c.id !== 'demo');

    if (unsyncedCalcs.length === 0) return;

    setSyncing(true);
    try {
      for (const calc of unsyncedCalcs) {
        await supabase
          .from('kalkyler')
          .insert({
            user_id: user.id,
            name: calc.name,
            data: calc.data,
            renoveringar: calc.renoveringar || [],
            renovering_belastar_drift: calc.renoveringBelastarDrift || false,
            fordelar: calc.fordelar || [],
            nackdelar: calc.nackdelar || []
          });
      }

      // Hämta alla kalkyler igen efter synk
      await fetchKalkyler();
    } catch (err) {
      console.error('Fel vid synkronisering:', err);
    } finally {
      setSyncing(false);
    }
  };

  return {
    kalkyler,
    loading,
    syncing,
    saveKalkyl,
    updateKalkyl,
    deleteKalkyl,
    fetchKalkyler,
    syncLocalToCloud
  };
};
