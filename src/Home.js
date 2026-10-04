import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Share, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, F, R, S, T } from './theme';
import { Glass, GlassDialog, GlassSheet, GoldButton, IconBtn, SheetRow, Txt, haptic, useToast } from './ui';
import NoteCard from './NoteCard';
import { SORTS, applySort, filterNotes } from './rules';
import { moveToTrash, setNoteLocked, setNotePinned } from './db';
import { authenticate } from './lock';

const SORT_LABELS = [
  [SORTS.NEWEST, 'Newest first', 'arrow-down'], [SORTS.OLDEST, 'Oldest first', 'arrow-up'],
  [SORTS.TITLE_AZ, 'Title A → Z', 'text'], [SORTS.TITLE_ZA, 'Title Z → A', 'text'],
];

export default function Home({ notes, loading, onChanged, onOpen, onNew, unlockThen, selecting, setSelecting, onSettings }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(SORTS.NEWEST);
  const [grid, setGrid] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [actionNote, setActionNote] = useState(null);
  const [confirmTrash, setConfirmTrash] = useState(null); // note | 'batch'
  const [selected, setSelected] = useState([]);

  useEffect(() => { AsyncStorage.getItem('view_mode').then((v) => v === 'grid' && setGrid(true)).catch(() => {}); }, []);
  const toggleGrid = () => { setGrid((g) => { AsyncStorage.setItem('view_mode', g ? 'list' : 'grid').catch(() => {}); return !g; }); };
  useEffect(() => { if (!selecting) setSelected([]); }, [selecting]);

  const data = useMemo(() => applySort(filterNotes(notes, query), sort), [notes, query, sort]);
  const empty = notes.length === 0;

  const press = (n) => {
    if (selecting) return toggleSelect(n);
    onOpen(n);
  };
  const toggleSelect = (n) => {
    const on = selected.includes(n.id);
    const apply = () => setSelected((s) => (on ? s.filter((x) => x !== n.id) : [...s, n.id]));
    if (!on && n.isLocked) unlockThen(n, apply); else apply();
  };
  const longPress = (n) => {
    haptic('medium');
    if (selecting) return toggleSelect(n);
    if (n.isLocked) unlockThen(n, () => setActionNote(n)); else setActionNote(n);
  };

  const togglePin = async (n) => { await setNotePinned(n.id, !n.isPinned); onChanged(); toast(n.isPinned ? 'Unpinned' : 'Pinned', 'success'); };
  const toggleLock = async (n) => {
    if (!n.isLocked) {
      const r = await authenticate('Lock note', n.title);
      if (r === 'unavailable') return toast('Set up a screen lock or biometrics first', 'error');
      if (r !== 'ok') return;
    }
    await setNoteLocked(n.id, !n.isLocked); onChanged(); toast(n.isLocked ? 'Note unlocked' : 'Note locked', 'success');
  };
  const share = async (n) => {
    try { await Share.share({ title: n.title, message: `${n.title}\n\n${n.content || ''}`.trim() }); } catch {}
  };
  const doTrash = async () => {
    const ids = confirmTrash === 'batch' ? selected : [confirmTrash.id];
    for (const id of ids) await moveToTrash(id);
    setConfirmTrash(null); setSelecting(false); onChanged();
    toast(ids.length > 1 ? `${ids.length} notes moved to Trash` : 'Moved to Trash', 'success');
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.l, marginBottom: S.m }}>
        <Txt bold style={{ flex: 1, fontSize: T.headline }}>Note Pad</Txt>
        {!empty && <IconBtn name="swap-vertical" onPress={() => setSortOpen(true)} />}
        {!empty && <IconBtn name={grid ? 'list' : 'grid-outline'} onPress={toggleGrid} />}
        <IconBtn name="settings-outline" onPress={onSettings} />
      </View>

      {selecting ? (
        <View style={{ paddingHorizontal: S.l, marginBottom: S.m }}>
          <Glass radius={R.pill} contentStyle={{ flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: S.s }}>
            <IconBtn name="close" onPress={() => setSelecting(false)} />
            <Txt medium style={{ flex: 1, fontSize: T.title }}>{selected.length} selected</Txt>
            <IconBtn name="checkmark-done" onPress={() => setSelected(data.filter((n) => !n.isLocked).map((n) => n.id))} />
            <IconBtn name="trash" color={C.danger} onPress={() => selected.length && setConfirmTrash('batch')} />
          </Glass>
        </View>
      ) : !empty && (
        <View style={{ paddingHorizontal: S.l, marginBottom: S.m }}>
          <Glass radius={R.pill} contentStyle={{ flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: S.l }}>
            <Ionicons name="search" size={18} color={C.textSecondary} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search notes…" placeholderTextColor={C.textSecondary}
              autoCorrect={false} style={{ flex: 1, marginHorizontal: S.s, color: C.textPrimary, fontFamily: F.regular, fontSize: T.body, outlineStyle: 'none' }} />
            {query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={C.textSecondary} /></Pressable> : null}
          </Glass>
        </View>
      )}

      {empty || data.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.x3, paddingBottom: 120 }}>
          <Glass radius={R.l} contentStyle={{ padding: S.xxl, alignItems: 'center' }}>
            <Ionicons name={empty ? 'document-text-outline' : 'search-outline'} size={44} color={C.gold} />
            <Txt bold style={{ fontSize: T.title, marginTop: S.m }}>{empty ? 'No notes yet' : 'No results found'}</Txt>
            <Txt style={{ color: C.textSecondary, textAlign: 'center', marginVertical: S.s }}>
              {empty ? 'Capture your first idea — it lives on your device.' : 'Try a different word or clear the search.'}
            </Txt>
            {empty && <GoldButton icon="add" label="New note" onPress={onNew} style={{ marginTop: S.s }} />}
          </Glass>
        </View>
      ) : (
        <FlatList
          key={grid ? 'grid' : 'list'} numColumns={grid ? 2 : 1} data={data} keyExtractor={(n) => n.id}
          refreshing={loading} onRefresh={onChanged}
          contentContainerStyle={{ paddingHorizontal: grid ? S.l - S.xs : S.l, paddingBottom: 130 }}
          renderItem={({ item }) => (
            <NoteCard note={item} grid={grid} query={query} selected={selected.includes(item.id)}
              onPress={() => press(item)} onLongPress={() => longPress(item)} />
          )}
        />
      )}

      <GlassSheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort notes">
        {(close) => SORT_LABELS.map(([k, label, icon]) => (
          <SheetRow key={k} icon={icon} label={label} onPress={() => { setSort(k); close(); }}
            trailing={sort === k ? <Ionicons name="checkmark" size={20} color={C.gold} /> : null} />
        ))}
      </GlassSheet>

      <GlassSheet visible={!!actionNote} onClose={() => setActionNote(null)} title={actionNote?.title || 'Note'}>
        {(close) => actionNote && (
          <>
            <SheetRow icon="create-outline" label="Open / edit" onPress={() => { close(); setTimeout(() => onOpen(actionNote, true), 220); }} />
            <SheetRow icon={actionNote.isPinned ? 'pin-outline' : 'pin'} label={actionNote.isPinned ? 'Unpin' : 'Pin to top'} onPress={() => { close(); togglePin(actionNote); }} />
            <SheetRow icon={actionNote.isLocked ? 'lock-open-outline' : 'lock-closed-outline'} label={actionNote.isLocked ? 'Remove lock' : 'Lock note'} onPress={() => { close(); toggleLock(actionNote); }} />
            <SheetRow icon="share-outline" label="Share" onPress={() => { close(); share(actionNote); }} />
            <SheetRow icon="checkbox-outline" label="Select multiple" onPress={() => { const id = actionNote.id; close(); setSelecting(true); setSelected([id]); }} />
            <SheetRow icon="trash-outline" danger label="Move to Trash" onPress={() => { const n = actionNote; close(); setTimeout(() => setConfirmTrash(n), 220); }} />
          </>
        )}
      </GlassSheet>

      <GlassDialog visible={!!confirmTrash} danger title="Move to Trash?" confirmLabel="Move"
        message="Notes stay in the Trash Bin for 30 days before they are deleted forever."
        onCancel={() => setConfirmTrash(null)} onConfirm={doTrash} />
    </View>
  );
}
