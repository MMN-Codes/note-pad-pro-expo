import React, { useState } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, T } from './theme';
import { Glass, GlassDialog, GlassSheet, IconBtn, SheetRow, Txt, useToast } from './ui';
import NoteCard from './NoteCard';
import { deleteNote, emptyTrash, restoreFromTrash } from './db';

export default function Trash({ notes, onChanged }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [sel, setSel] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'one' | 'all'

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.l, marginBottom: S.m }}>
        <Txt bold style={{ flex: 1, fontSize: T.headline }}>Trash Bin</Txt>
        {notes.length > 0 && <IconBtn name="trash-bin-outline" color={C.danger} onPress={() => setConfirm('all')} />}
      </View>
      <Txt style={{ color: C.textSecondary, fontSize: T.caption, paddingHorizontal: S.l, marginBottom: S.m }}>
        Notes are deleted forever after 30 days.
      </Txt>
      {notes.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
          <Txt style={{ color: C.textSecondary }}>Trash is empty</Txt>
        </View>
      ) : (
        <FlatList data={notes} keyExtractor={(n) => n.id} contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 130 }}
          renderItem={({ item }) => <NoteCard note={item} trash onPress={() => setSel(item)} onLongPress={() => setSel(item)} />} />
      )}
      <GlassSheet visible={!!sel} onClose={() => setSel(null)} title={sel?.title || 'Note'}>
        {(close) => (
          <>
            <SheetRow icon="arrow-undo-outline" label="Restore" onPress={async () => { const id = sel.id; close(); await restoreFromTrash(id); onChanged(); toast('Note restored', 'success'); }} />
            <SheetRow icon="close-circle-outline" danger label="Delete forever" onPress={() => { close(); setTimeout(() => setConfirm('one'), 220); }} />
          </>
        )}
      </GlassSheet>
      <GlassDialog visible={!!confirm} danger title={confirm === 'all' ? 'Empty Trash?' : 'Delete forever?'}
        message="This cannot be undone." confirmLabel="Delete" onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm === 'all') await emptyTrash(); else if (sel) await deleteNote(sel.id);
          setConfirm(null); setSel(null); onChanged(); toast('Deleted', 'success');
        }} />
    </View>
  );
}
