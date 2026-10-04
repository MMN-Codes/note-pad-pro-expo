import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BG_STYLES, C, F, R, S, T } from './theme';
import { Chip, Glass, GlassDialog, GlassSheet, GoldButton, IconBtn, SheetRow, Txt, haptic, useToast } from './ui';
import { addNote, getNote, newNote, updateNote } from './db';
import { scheduleReminder, cancelReminder } from './notify';
import { checklistFromJson, checklistPlainSummary, checklistToJson, fmtDate, fmtDateTime, fmtTime,
  htmlToPlain, newItem, parseDateTime } from './utils';

const REPEATS = [['none', 'Once'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']];
const QUICK = [['In 1 hour', 60], ['In 3 hours', 180], ['Tomorrow 9:00', 'tm9'], ['Next week', 10080]];

export default function Editor({ note, onClose, onSaved, autoSave = true }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const isEdit = !!note;
  const savedRef = useRef(note || null);          // becomes set after first (silent) save
  const stampRef = useRef(note?.lastModified || 0);
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(htmlToPlain(note?.content));
  const [checklist, setChecklist] = useState(!!note?.isChecklist);
  const [items, setItems] = useState(() => (note?.isChecklist ? checklistFromJson(note.checklistJson) : []));
  const [bgStyle, setBgStyle] = useState(note?.bgStyle || 'none');
  const [pinned, setPinned] = useState(!!note?.isPinned);
  const [remOn, setRemOn] = useState(!!note?.hasReminder);
  const [remDate, setRemDate] = useState(() => parseDateTime(note?.reminderTime) || new Date(Date.now() + 3600000));
  const [repeat, setRepeat] = useState(note?.repeatInterval || 'none');
  const [remSheet, setRemSheet] = useState(false);
  const [bgSheet, setBgSheet] = useState(false);
  const [convert, setConvert] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [conflict, setConflict] = useState(false);
  const bg = BG_STYLES[bgStyle];
  const mark = (fn) => (v) => { setDirty(true); fn(v); };

  const words = useMemo(() => {
    const t = checklist ? checklistPlainSummary(items) : content;
    return t.trim() ? t.trim().split(/\s+/).length : 0;
  }, [content, items, checklist]);

  // Toggle checklist <-> text (AddEditNoteActivity convert logic)
  const doConvert = () => {
    setConvert(false); setDirty(true);
    if (!checklist) {
      const list = content.split('\n').filter((l) => l.trim()).map((l) => newItem(l.trim()));
      setItems(list.length ? list : [newItem('')]);
      setChecklist(true);
    } else {
      setContent(items.filter((i) => i.text.trim()).map((i) => i.text.trim()).join('\n'));
      setChecklist(false);
    }
  };
  const toggleMode = () => {
    const hasData = checklist ? items.some((i) => i.text.trim()) : content.trim();
    if (hasData) setConvert(true); else doConvert();
  };

  const setQuick = (v) => {
    const d = new Date();
    if (v === 'tm9') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    else d.setTime(Date.now() + v * 60000);
    setRemDate(d); setRemOn(true); setDirty(true);
  };
  const bump = (field, delta) => {
    const d = new Date(remDate);
    if (field === 'd') d.setDate(d.getDate() + delta);
    if (field === 'h') d.setHours(d.getHours() + delta);
    if (field === 'm') d.setMinutes(d.getMinutes() + delta);
    setRemDate(d); setDirty(true);
  };

  // mode: 'manual' (Save button) | 'auto' (back press, auto_save on) | 'silent' (app backgrounded)
  const save = async (force = false, mode = 'manual') => {
    let t = title.trim();
    if (!t) {
      if (mode === 'manual') { toast('Please enter a title', 'error'); return; }
      t = 'Untitled Note'; setTitle(t);               // AddEditNoteActivity.onBackPressed()
    }
    try {
      const base = savedRef.current;
      if (base && !force && mode !== 'silent') {
        const fresh = await getNote(base.id);
        if (fresh && fresh.lastModified > stampRef.current) { setConflict(true); return; } // sync-conflict guard
      }
      const now = new Date();
      const body = checklist ? checklistPlainSummary(items) : content;
      const n = base ? { ...base } : newNote(t, body, fmtDate(now), fmtTime(now));
      n.title = t; n.content = body; n.date = fmtDate(now); n.time = fmtTime(now);
      n.isChecklist = checklist; n.checklistJson = checklist ? checklistToJson(items) : null;
      n.bgStyle = bgStyle; n.isPinned = pinned;

      let remOk = false;
      if (mode !== 'silent') {
        if (base && base.hasReminder) await cancelReminder(base.id);
        if (remOn) {
          n.reminderTime = fmtDateTime(remDate); n.hasReminder = true; n.repeatInterval = repeat;
          const r = await scheduleReminder(n);
          remOk = r.ok;
          if (!r.ok) {
            n.hasReminder = r.reason === 'unsupported'; // keep the data on web, just no alarm
            if (r.reason === 'past') toast('Please select a future time', 'error');
            if (r.reason === 'permission') toast('Notification permission missing. Reminder NOT set.', 'error');
            if (!n.hasReminder) n.reminderTime = null;
          }
        } else { n.hasReminder = false; n.reminderTime = null; n.repeatInterval = 'none'; }
      }

      if (base) await updateNote(n); else await addNote(n);
      savedRef.current = n;
      const fresh2 = await getNote(n.id);
      stampRef.current = fresh2 ? fresh2.lastModified : Date.now();
      if (mode === 'silent') { setDirty(false); return; }
      haptic('success');
      toast(`${base ? 'Note updated' : 'Note saved'}${remOk ? ' with reminder' : ''}`, 'success');
      onSaved();
    } catch (e) { toast(`Error saving note: ${e.message}`, 'error'); }
  };

  // Back press rules from AddEditNoteActivity.onBackPressed()
  const isEmptyNew = () => !savedRef.current && !title.trim() && !(checklist ? items.some((i) => i.text.trim()) : content.trim());
  const close = () => {
    if (isEmptyNew() || !dirty) return onClose();
    if (autoSave) return save(false, 'auto');
    setDiscard(true);
  };
  const latest = useRef({});
  latest.current = { close, save, dirty, autoSave, isEmptyNew };
  useEffect(() => {
    // onPause() silent auto-save
    const sub = AppState.addEventListener('change', (st) => {
      const l = latest.current;
      if (st !== 'active' && l.autoSave && l.dirty && !l.isEmptyNew()) l.save(true, 'silent');
    });
    const back = Platform.OS === 'android'
      ? BackHandler.addEventListener('hardwareBackPress', () => { latest.current.close(); return true; }) : null;
    return () => { sub.remove(); back && back.remove(); };
  }, []);
  const share = () => Share.share({ title, message: `${title}\n\n${checklist ? checklistPlainSummary(items) : content}`.trim() }).catch(() => {});
  const textColor = bg ? bg.text : C.textPrimary;

  return (
    <View style={{ flex: 1, backgroundColor: bg ? bg.fill : C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingTop: insets.top + S.s, paddingHorizontal: S.s, flexDirection: 'row', alignItems: 'center' }}>
          <IconBtn name="chevron-back" onPress={close} />
          <View style={{ flex: 1 }} />
          <IconBtn name={pinned ? 'pin' : 'pin-outline'} active={pinned} onPress={() => { setPinned(!pinned); setDirty(true); }} />
          <IconBtn name={remOn ? 'alarm' : 'alarm-outline'} active={remOn} onPress={() => setRemSheet(true)} />
          <IconBtn name="share-outline" onPress={share} />
          <Pressable onPress={() => { haptic('medium'); save(); }} style={{ marginLeft: S.s, height: 40, paddingHorizontal: S.l, borderRadius: R.pill, backgroundColor: C.gold, justifyContent: 'center' }}>
            <Txt bold style={{ color: C.onAccent }}>Save</Txt>
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: S.xl, paddingBottom: 160 }}>
          <TextInput value={title} onChangeText={mark(setTitle)} placeholder="Title" placeholderTextColor={C.textSecondary}
            style={{ color: textColor, fontFamily: F.regular, fontWeight: '700', fontSize: 26, outlineStyle: 'none', paddingVertical: S.s }} />
          <Txt style={{ color: C.textSecondary, fontSize: T.micro, marginBottom: S.l }}>
            {isEdit ? `${note.date} • ${note.time}` : fmtDateTime(new Date())}  •  {words} words
          </Txt>

          {checklist ? (
            <View>
              {items.map((it, i) => (
                <View key={it.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.s }}>
                  <Pressable hitSlop={8} onPress={() => { haptic(); setDirty(true); setItems(items.map((x) => (x.id === it.id ? { ...x, checked: !x.checked } : x))); }}>
                    <Ionicons name={it.checked ? 'checkbox' : 'square-outline'} size={24} color={it.checked ? C.gold : C.textSecondary} />
                  </Pressable>
                  <TextInput value={it.text} placeholder="List item" placeholderTextColor={C.textSecondary} multiline
                    onChangeText={(v) => { setDirty(true); setItems(items.map((x) => (x.id === it.id ? { ...x, text: v } : x))); }}
                    style={{ flex: 1, marginHorizontal: S.m, color: textColor, opacity: it.checked ? 0.5 : 1, fontFamily: F.regular, fontSize: 17,
                      textDecorationLine: it.checked ? 'line-through' : 'none', outlineStyle: 'none' }} />
                  <Pressable hitSlop={8} onPress={() => { setDirty(true); setItems(items.filter((x) => x.id !== it.id)); }}>
                    <Ionicons name="close" size={20} color={C.textSecondary} />
                  </Pressable>
                </View>
              ))}
              {items.length === 0 && <Txt style={{ color: C.textSecondary, marginBottom: S.m }}>No items yet. Add your first one.</Txt>}
              <GoldButton subtle icon="add" label="Add item" onPress={() => { setDirty(true); setItems([...items, newItem('')]); }} />
            </View>
          ) : (
            <TextInput value={content} onChangeText={mark(setContent)} multiline placeholder="Start writing…" placeholderTextColor={C.textSecondary}
              textAlignVertical="top" style={{ color: textColor, fontFamily: F.regular, fontSize: 17, lineHeight: 26, minHeight: 320, outlineStyle: 'none' }} />
          )}
        </ScrollView>

        <View style={{ position: 'absolute', left: S.l, right: S.l, bottom: insets.bottom + S.m }}>
          <Glass radius={R.pill} contentStyle={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: S.xs }}>
            <IconBtn name={checklist ? 'document-text-outline' : 'checkbox-outline'} onPress={toggleMode} active={checklist} />
            <IconBtn name="color-palette-outline" onPress={() => setBgSheet(true)} active={bgStyle !== 'none'} />
            <IconBtn name="alarm-outline" onPress={() => setRemSheet(true)} active={remOn} />
          </Glass>
        </View>
      </KeyboardAvoidingView>

      <GlassSheet visible={bgSheet} onClose={() => setBgSheet(false)} title="Note background">
        {(done) => (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.m, paddingBottom: S.m }}>
            {Object.keys(BG_STYLES).map((k) => {
              const s = BG_STYLES[k];
              return (
                <Pressable key={k} onPress={() => { setBgStyle(k); setDirty(true); done(); }} style={{ alignItems: 'center' }}>
                  <View style={{ width: 56, height: 56, borderRadius: R.m, backgroundColor: s ? s.fill : C.bg, borderWidth: bgStyle === k ? 2.5 : 1,
                    borderColor: bgStyle === k ? C.gold : s ? s.stroke : C.hairline, alignItems: 'center', justifyContent: 'center' }}>
                    {!s && <Ionicons name="ban-outline" size={22} color={C.textSecondary} />}
                  </View>
                  <Txt style={{ fontSize: T.micro, color: C.textSecondary, marginTop: 4, textTransform: 'capitalize' }}>{k}</Txt>
                </Pressable>
              );
            })}
          </View>
        )}
      </GlassSheet>

      <GlassSheet visible={remSheet} onClose={() => setRemSheet(false)} title="Reminder">
        {(done) => (
          <View>
            <SheetRow icon={remOn ? 'notifications' : 'notifications-off-outline'} label={remOn ? 'Reminder on' : 'Reminder off'}
              onPress={() => { setRemOn(!remOn); setDirty(true); }} />
            {remOn && (
              <>
                <Txt bold style={{ fontSize: 20, color: C.gold, marginVertical: S.s, textAlign: 'center' }}>{fmtDateTime(remDate)}</Txt>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: S.m }}>
                  {[['d', 'Day'], ['h', 'Hour'], ['m', 'Min']].map(([f, l]) => (
                    <View key={f} style={{ alignItems: 'center' }}>
                      <Txt style={{ color: C.textSecondary, fontSize: T.micro }}>{l}</Txt>
                      <View style={{ flexDirection: 'row' }}>
                        <IconBtn name="remove-circle-outline" onPress={() => bump(f, f === 'm' ? -5 : -1)} />
                        <IconBtn name="add-circle-outline" onPress={() => bump(f, f === 'm' ? 5 : 1)} />
                      </View>
                    </View>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.s, marginBottom: S.m }}>
                  {QUICK.map(([l, v]) => <Chip key={l} label={l} onPress={() => setQuick(v)} />)}
                </View>
                <Txt style={{ color: C.textSecondary, fontSize: T.caption, marginBottom: S.s }}>Repeat</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.s, marginBottom: S.l }}>
                  {REPEATS.map(([k, l]) => <Chip key={k} label={l} selected={repeat === k} onPress={() => { setRepeat(k); setDirty(true); }} />)}
                </View>
              </>
            )}
            <GoldButton label="Done" onPress={done} />
          </View>
        )}
      </GlassSheet>

      <GlassDialog visible={convert} title={checklist ? 'Convert to text?' : 'Convert to checklist?'}
        message={checklist ? 'Each item becomes a line of text.' : 'Each line becomes a checklist item.'}
        confirmLabel="Convert" onCancel={() => setConvert(false)} onConfirm={doConvert} />
      <GlassDialog visible={discard} danger title="Discard changes?" message="Your unsaved edits will be lost."
        confirmLabel="Discard" onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); onClose(); }} />
      <GlassDialog visible={conflict} title="Updated elsewhere" message="This note changed since you opened it. Overwrite it with your version?"
        confirmLabel="Overwrite" onCancel={() => setConflict(false)} onConfirm={() => { setConflict(false); save(true); }} />
    </View>
  );
}
