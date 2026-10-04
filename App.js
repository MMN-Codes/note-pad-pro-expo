import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, S } from './src/theme';
import { Background, Glass, ToastProvider, Txt, haptic, useToast, squircle } from './src/ui';
import { addNote, getAllNotes, getNotesWithReminders, getTrashNotes, newNote, purgeOldTrash } from './src/db';
import { initNotifications, rescheduleAll } from './src/notify';
import { authenticate } from './src/lock';
import { fmtDate, fmtTime } from './src/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './src/Home';
import Editor from './src/Editor';
import Trash from './src/Trash';
import Calendar from './src/Calendar';
import Reminders from './src/Reminders';

const TABS = [
  ['home', 'document-text', 'document-text-outline'],
  ['calendar', 'calendar', 'calendar-outline'],
  ['reminders', 'alarm', 'alarm-outline'],
  ['trash', 'trash', 'trash-outline'],
];

function NavIsland({ tab, setTab, onNew }) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.islandWrap, { bottom: insets.bottom + S.m }]}>
      <Glass radius={R.pill} intensity={70} fill="rgba(22,23,30,0.62)" style={styles.island}
        contentStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, height: 64 }}>
        {TABS.slice(0, 2).map(([k, on, off]) => <Tab key={k} k={k} on={on} off={off} tab={tab} setTab={setTab} />)}
        <Pressable onPress={() => { haptic('medium'); onNew(); }} style={styles.fab}>
          <Ionicons name="add" size={30} color="#1A1A1A" />
        </Pressable>
        {TABS.slice(2).map(([k, on, off]) => <Tab key={k} k={k} on={on} off={off} tab={tab} setTab={setTab} />)}
      </Glass>
    </View>
  );
}
const Tab = ({ k, on, off, tab, setTab }) => (
  <Pressable onPress={() => { haptic(); setTab(k); }} style={styles.tab}>
    <Ionicons name={tab === k ? on : off} size={24} color={tab === k ? C.gold : C.textSecondary} />
    {tab === k && <View style={styles.dot} />}
  </Pressable>
);

function Shell() {
  const toast = useToast();
  const [tab, setTab] = useState('home');
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { note|null }
  const [selecting, setSelecting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setNotes(await getAllNotes()); setTrash(await getTrashNotes()); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    (async () => {
      await initNotifications();
      await purgeOldTrash();                       // 30-day auto-purge on launch
      // first-run welcome note (pinned), as MainActivity.createWelcomeNote()
      const seen = await AsyncStorage.getItem('is_first_run_welcome_done');
      if (!seen) {
        const now = new Date();
        const w = newNote('Welcome to Note Pad Pro 👋',
          '• Tap + to write a note.\n• Long-press a note for pin, lock, share and more.\n• Use [[Note Title]] to refer to another note.\n• Set reminders so nothing slips your mind.\n\nTap Edit to make this note your own — or delete it and start fresh! ✨',
          fmtDate(now), fmtTime(now));
        w.isPinned = true;
        await addNote(w);
        await AsyncStorage.setItem('is_first_run_welcome_done', '1');
      }
      await refresh();
      rescheduleAll(await getNotesWithReminders());  // BootReceiver equivalent
    })();
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editing) return false;              // Editor's own back handler is the header button
      if (selecting) { setSelecting(false); return true; }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [editing, selecting, tab]);

  // Locked notes: biometric / device credential before opening or acting on them
  const unlockThen = async (note, fn) => {
    const r = await authenticate('Locked note', `Unlock “${note.title}”`);
    if (r === 'ok') fn();
    else if (r === 'unavailable') toast('Set up a screen lock to open locked notes', 'error');
  };
  const open = (note) => (note.isLocked ? unlockThen(note, () => setEditing({ note })) : setEditing({ note }));

  if (editing) {
    return (
      <Editor note={editing.note}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }} />
    );
  }

  return (
    <Background>
      <View style={{ flex: 1 }}>
        {tab === 'home' && <Home notes={notes} loading={loading} onChanged={refresh} onOpen={open} onNew={() => setEditing({ note: null })}
          unlockThen={unlockThen} selecting={selecting} setSelecting={setSelecting} />}
        {tab === 'calendar' && <Calendar notes={notes} onOpen={open} />}
        {tab === 'reminders' && <Reminders notes={notes} onOpen={open} onChanged={refresh} />}
        {tab === 'trash' && <Trash notes={trash} onChanged={refresh} />}
      </View>
      <NavIsland tab={tab} setTab={(t) => { setSelecting(false); setTab(t); }} onNew={() => setEditing({ note: null })} />
    </Background>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Font.loadAsync({
      'NPP-Regular': require('./assets/fonts/regular.ttf'),
      'NPP-Medium': require('./assets/fonts/medium.ttf'),
      'NPP-Bold': require('./assets/fonts/bold.ttf'),
    }).catch(() => {}).finally(() => setReady(true));
  }, []);
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}><ActivityIndicator color={C.gold} /></View>;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ToastProvider><Shell /></ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  islandWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  island: { width: '88%', maxWidth: 420, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  tab: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold, marginTop: 3 },
  fab: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginHorizontal: S.s,
    shadowColor: C.gold, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
});
