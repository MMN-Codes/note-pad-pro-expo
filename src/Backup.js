// BackupRestoreActivity (local part): JSON backup (optionally password-encrypted), Markdown ZIP,
// restore/merge from file or paste, and the 3 rotating automatic snapshots.
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, ScrollView, Switch, TextInput, View } from 'react-native';
import { copyText, pasteText } from './clip';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, S, T, alpha } from './theme';
import { Glass, GlassDialog, GoldButton, IconBtn, Txt, haptic, useToast } from './ui';
import { backupFileName, buildBackupJson, restoreFromJsonText } from './backupCore';
import { decryptWithPassword, encryptWithPassword, envelopeMode, isEncryptedEnvelope } from './crypto';
import { pickTextFile, shareFile } from './files';
import { buildMarkdownZip } from './exporter';
import { getAllNotes, getTrashNotes } from './db';
import { listSnapshots, readSnapshot } from './snapshots';
import { fmtDateTime } from './utils';

const tick = () => new Promise((r) => setTimeout(r, 60));
const Sw = ({ value, onChange }) => (
  <Switch value={value} onValueChange={(v) => { haptic(); onChange(v); }}
    trackColor={{ true: alpha(C.gold, 0.55), false: C.pill }} thumbColor={value ? C.gold : '#9a9a9a'} />
);
const Field = (p) => (
  <TextInput {...p} placeholderTextColor={C.textSecondary} autoCapitalize="none" autoCorrect={false}
    style={{ height: 48, borderRadius: R.m, paddingHorizontal: S.m, color: C.textPrimary, backgroundColor: C.soft,
      fontFamily: F.regular, fontSize: T.body, marginBottom: S.s }} />
);

export default function Backup({ onClose, onChanged }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [inclLocked, setInclLocked] = useState(false);
  const [inclTrash, setInclTrash] = useState(false);
  const [pwd, setPwd] = useState(null);          // { kind: 'encrypt' | 'decrypt', payload }
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [info, setInfo] = useState('');
  const [snaps, setSnaps] = useState([]);
  const [last, setLast] = useState('');

  const loadMeta = useCallback(async () => {
    setSnaps(await listSnapshots());
    try { setLast((await AsyncStorage.getItem('last_local_backup')) || ''); } catch {}
  }, []);
  useEffect(() => { loadMeta(); }, [loadMeta]);
  const stamp = async () => { try { await AsyncStorage.setItem('last_local_backup', fmtDateTime(new Date())); } catch {} loadMeta(); };

  const openPwd = (kind, payload) => { setPw1(''); setPw2(''); setPwErr(''); setPwd({ kind, payload }); };
  const closePwd = () => { setPwd(null); setPw1(''); setPw2(''); setPwErr(''); };

  // ---------- export ----------
  const deliver = async (content, viaCopy) => {
    if (viaCopy) { await copyText(content); toast('Backup copied to clipboard', 'success'); }
    else { await shareFile(backupFileName(encrypt ? 'npbak' : 'json'), content, { mime: 'application/json' }); toast('Backup file ready', 'success'); }
    await stamp();
  };
  const exportJson = async (viaCopy) => {
    try {
      if (encrypt) { openPwd('encrypt', { viaCopy }); return; }
      setBusy('Preparing…');
      await deliver(await buildBackupJson(), viaCopy);
    } catch (e) { toast(`Export failed: ${e.message}`, 'error'); } finally { setBusy(''); }
  };

  const exportMarkdown = async () => {
    try {
      setBusy('Building ZIP…');
      const notes = [...(await getAllNotes()), ...(inclTrash ? await getTrashNotes() : [])];
      const r = await buildMarkdownZip(notes, inclLocked);
      if (!r.exported) { toast('No notes to export', 'error'); return; }
      await shareFile('NotePadPro_Notes.zip', r.base64, { base64: true, mime: 'application/zip' });
      toast(`Exported ${r.exported} note${r.exported > 1 ? 's' : ''}${r.skippedLocked ? ` (${r.skippedLocked} locked skipped)` : ''}`, 'success');
    } catch (e) { toast(`Export failed: ${e.message}`, 'error'); } finally { setBusy(''); }
  };

  // ---------- restore ----------
  const doRestore = async (plain) => {
    try {
      setBusy('Restoring…');
      const r = await restoreFromJsonText(plain);
      onChanged(); setText('');
      toast(`Restored: ${r.added} added, ${r.updated} updated, ${r.skipped} unchanged`, 'success');
    } catch (e) { toast(`Restore failed: ${e.message}`, 'error'); } finally { setBusy(''); }
  };
  const handleRestoreText = async (raw) => {
    const t = (raw || '').trim();
    if (!t) return;
    if (isEncryptedEnvelope(t)) {
      if (envelopeMode(t) === 'password') { openPwd('decrypt', { text: t }); return; }
      setInfo('This backup is locked to an Android device key, so it cannot be opened here.\n\nIn the Android app use “Secure Export” (password) and restore that file instead.');
      return;
    }
    await doRestore(t);
  };
  const chooseFile = async () => {
    try { const f = await pickTextFile(); if (f) await handleRestoreText(f.text); }
    catch (e) { toast(`Could not read file: ${e.message}`, 'error'); }
  };

  const confirmPwd = async () => {
    if (pw1.length < 4) { setPwErr('Password must be at least 4 characters'); return; }
    if (pwd.kind === 'encrypt') {
      if (pw1 !== pw2) { setPwErr('Passwords do not match'); return; }
      const payload = pwd.payload; closePwd();
      try {
        setBusy('Encrypting…'); await tick();
        const env = await encryptWithPassword(await buildBackupJson(), pw1);
        await deliver(env, payload.viaCopy);
      } catch (e) { toast(`Encryption failed: ${e.message}`, 'error'); } finally { setBusy(''); }
    } else {
      const payload = pwd.payload;
      setBusy('Decrypting…'); await tick();
      const plain = await decryptWithPassword(payload.text, pw1);
      setBusy('');
      if (plain == null) { setPwErr('Wrong password or corrupted file'); return; }
      closePwd(); await doRestore(plain);
    }
  };

  const restoreSnapshot = async (ts) => {
    const json = await readSnapshot(ts);
    if (!json) { toast('Snapshot is no longer available', 'error'); return; }
    await doRestore(json);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s, flex: 1 }}>Backup & Restore</Txt>
        {busy ? <Txt style={{ color: C.gold, marginRight: S.m, fontSize: T.caption }}>{busy}</Txt> : null}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Glass contentStyle={{ padding: S.l, marginBottom: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>Backup</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
            Saves all notes (including Trash) as a JSON file — the same format as the Android app.{last ? `\nLast backup: ${last}` : ''}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.m }}>
            <View style={{ flex: 1 }}>
              <Txt medium>Secure Export (password)</Txt>
              <Txt style={{ color: C.textSecondary, fontSize: T.micro }}>AES-256 encryption — needed to restore the file</Txt>
            </View>
            <Sw value={encrypt} onChange={setEncrypt} />
          </View>
          <View style={{ flexDirection: 'row', gap: S.m }}>
            <GoldButton icon={Platform.OS === 'web' ? 'download-outline' : 'share-outline'} label={Platform.OS === 'web' ? 'Download' : 'Share file'}
              onPress={() => !busy && exportJson(false)} style={{ flex: 1 }} />
            <GoldButton subtle icon="copy-outline" label="Copy" onPress={() => !busy && exportJson(true)} style={{ flex: 1 }} />
          </View>
        </Glass>

        <Glass contentStyle={{ padding: S.l, marginBottom: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>Restore</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
            Existing notes are merged: new notes are added and the newer version of a note wins.
          </Txt>
          <GoldButton icon="folder-open-outline" label="Choose backup file" onPress={() => !busy && chooseFile()} />
          <Txt style={{ color: C.textSecondary, marginVertical: S.m, fontSize: T.caption }}>…or paste the backup text:</Txt>
          <TextInput value={text} onChangeText={setText} multiline placeholder="Paste backup JSON here…" placeholderTextColor={C.textSecondary}
            autoCapitalize="none" autoCorrect={false}
            style={{ minHeight: 100, maxHeight: 200, borderRadius: R.m, padding: S.m, color: C.textPrimary, backgroundColor: C.soft,
              fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: S.m, marginTop: S.m }}>
            <GoldButton subtle icon="clipboard-outline" label="Paste" onPress={async () => { try { setText(await pasteText()); } catch {} }} style={{ flex: 1 }} />
            <GoldButton icon="download-outline" label="Restore" onPress={() => !busy && handleRestoreText(text)} style={{ flex: 1 }} />
          </View>
        </Glass>

        <Glass contentStyle={{ padding: S.l, marginBottom: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>Automatic snapshots</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
            The app keeps the 3 most recent snapshots on this device as a safety net.
          </Txt>
          {snaps.length === 0 ? <Txt style={{ color: C.textSecondary }}>No snapshots yet — they are created automatically as you write.</Txt> : snaps.map((s, i) => (
            <View key={s.ts} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: S.s }}>
              <View style={{ flex: 1 }}>
                <Txt medium>{i === 0 ? 'Newest' : `Snapshot ${i + 1}`} • {s.count} notes</Txt>
                <Txt style={{ color: C.textSecondary, fontSize: T.micro }}>{fmtDateTime(new Date(s.ts))}</Txt>
              </View>
              <GoldButton subtle label="Restore" onPress={() => !busy && restoreSnapshot(s.ts)} style={{ height: 38, paddingHorizontal: S.l }} />
            </View>
          ))}
        </Glass>

        <Glass contentStyle={{ padding: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>Export as Markdown</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
            One .md file per note, zipped. Opens in Obsidian, Notion (import) or any text editor.
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.s }}>
            <Txt medium style={{ flex: 1 }}>Include locked notes</Txt><Sw value={inclLocked} onChange={setInclLocked} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.m }}>
            <Txt medium style={{ flex: 1 }}>Include Trash</Txt><Sw value={inclTrash} onChange={setInclTrash} />
          </View>
          <GoldButton icon="document-text-outline" label="Export ZIP" onPress={() => !busy && exportMarkdown()} />
        </Glass>
      </ScrollView>

      <GlassDialog visible={!!pwd} title={pwd?.kind === 'encrypt' ? 'Set a backup password' : 'Enter backup password'}
        message={pwd?.kind === 'encrypt' ? 'You will need this password to restore the file. It cannot be recovered.' : 'This backup is password protected.'}
        confirmLabel={pwd?.kind === 'encrypt' ? 'Encrypt' : 'Unlock'} onCancel={closePwd} onConfirm={confirmPwd}>
        <Field value={pw1} onChangeText={(v) => { setPw1(v); setPwErr(''); }} placeholder="Password" secureTextEntry />
        {pwd?.kind === 'encrypt' && <Field value={pw2} onChangeText={(v) => { setPw2(v); setPwErr(''); }} placeholder="Confirm password" secureTextEntry />}
        {pwErr ? <Txt style={{ color: C.danger, fontSize: T.caption, marginBottom: S.s }}>{pwErr}</Txt> : null}
        {busy ? <Txt style={{ color: C.gold, fontSize: T.caption, marginBottom: S.s }}>{busy}</Txt> : null}
      </GlassDialog>
      <GlassDialog visible={!!info} title="Cannot open this backup" message={info} confirmLabel="OK" cancelLabel={null}
        onCancel={() => setInfo('')} onConfirm={() => setInfo('')} />
    </View>
  );
}
