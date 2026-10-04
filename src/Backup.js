// BackupRestoreActivity (local part): JSON export / import-merge, same schema as the Android app.
import React, { useState } from 'react';
import { Platform, ScrollView, Share, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, S, T } from './theme';
import { Glass, GoldButton, IconBtn, Txt, useToast } from './ui';
import { exportAllRows, importRows } from './db';
import { rescheduleAll } from './notify';
import { getNotesWithReminders } from './db';
import { fmtDateTime } from './utils';

const SCHEMA_VERSION = 1;

export async function buildBackupJson() {
  const notes = await exportAllRows();
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return JSON.stringify({
    app_name: 'Note Pad Pro', schema_version: SCHEMA_VERSION,
    backup_date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`,
    note_count: notes.length, notes, images: {}, tombstones: [],
  }, null, 2);
}

export default function Backup({ onClose, onChanged }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const stamp = () => AsyncStorage.setItem('last_local_backup', fmtDateTime(new Date())).catch(() => {});

  const doShare = async () => {
    try { setBusy(true); const json = await buildBackupJson(); await Share.share({ title: 'NotePadPro_Backup.json', message: json }); await stamp(); }
    catch (e) { toast(`Export failed: ${e.message}`, 'error'); } finally { setBusy(false); }
  };
  const doCopy = async () => {
    try { const json = await buildBackupJson(); await Clipboard.setStringAsync(json); await stamp(); toast('Backup copied to clipboard', 'success'); }
    catch (e) { toast(`Copy failed: ${e.message}`, 'error'); }
  };
  const paste = async () => { try { setText(await Clipboard.getStringAsync()); } catch {} };
  const doImport = async () => {
    try {
      setBusy(true);
      const data = JSON.parse(text.trim());
      if (!data || !Array.isArray(data.notes)) throw new Error('Not a Note Pad Pro backup');
      const r = await importRows(data.notes);
      await rescheduleAll(await getNotesWithReminders());
      onChanged(); setText('');
      toast(`Restored: ${r.added} added, ${r.updated} updated, ${r.skipped} unchanged`, 'success');
    } catch (e) { toast(`Import failed: ${e.message}`, 'error'); } finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s }}>Backup & Restore</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Glass contentStyle={{ padding: S.l, marginBottom: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>Export</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
            Saves all notes (including Trash) as a JSON backup — the same format the Android app uses. Share it to Drive, WhatsApp, e-mail or keep it in a file.
          </Txt>
          <View style={{ flexDirection: 'row', gap: S.m }}>
            <GoldButton icon="share-outline" label="Share" onPress={doShare} style={{ flex: 1 }} />
            <GoldButton subtle icon="copy-outline" label="Copy" onPress={doCopy} style={{ flex: 1 }} />
          </View>
        </Glass>
        <Glass contentStyle={{ padding: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>Restore</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
            Paste backup JSON below. Existing notes are merged: new notes are added and the newer version of a note wins.
          </Txt>
          <TextInput value={text} onChangeText={setText} multiline placeholder="Paste backup JSON here…" placeholderTextColor={C.textSecondary}
            autoCapitalize="none" autoCorrect={false}
            style={{ minHeight: 120, maxHeight: 220, borderRadius: R.m, padding: S.m, color: C.textPrimary, backgroundColor: C.soft,
              fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: S.m, marginTop: S.m }}>
            <GoldButton subtle icon="clipboard-outline" label="Paste" onPress={paste} style={{ flex: 1 }} />
            <GoldButton icon="download-outline" label={busy ? 'Working…' : 'Restore'} onPress={() => text.trim() && !busy && doImport()} style={{ flex: 1 }} />
          </View>
        </Glass>
      </ScrollView>
    </View>
  );
}
