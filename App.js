import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, MODE, R, S, T, applyPalette } from './src/theme';
import { Background, Glass, GoldButton, ToastProvider, Txt, haptic, useToast } from './src/ui';
import { addNote, getAllNotes, getNotesWithReminders, getTrashNotes, newNote, purgeOldTrash } from './src/db';
import { initNotifications, rescheduleAll } from './src/notify';
import { authenticate } from './src/lock';
import { loadSettings, saveSettings } from './src/settings';
import { fmtDate, fmtTime } from './src/utils';
import Home from './src/Home';
import Editor from './src/Editor';
import Trash from './src/Trash';
import Calendar from './src/Calendar';
import Reminders from './src/Reminders';
import Settings from './src/Settings';
import About, { Legal } from './src/About';
import Backup from './src/Backup';

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
      <Glass radius={R.pill} intensity={70} fill={C.sheet} style={styles.island}
        contentStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, height: 64 }}>
        {TABS.slice(0, 2).map(([k, on, off]) => <Tab key={k} k={k} on={on} off={off} tab={tab} setTab={setTab} />)}
        <Pressable onPress={() => { haptic('medium'); onNew(); }}
          style={[styles.fab, { backgroundColor: C.gold, shadowColor: C.gold }]}>
          <Ionicons name="add" size={30} color={C.onAccent} />
        </Pressable>
        {TABS.slice(2).map(([k, on, off]) => <Tab key={k} k={k} on={on} off={off} tab={tab} setTab={setTab} />)}
      </Glass>
    </View>
  );
}

const Tab = ({ k, on, off, tab, setTab }) => (
  <Pressable onPress={() => { haptic(); setTab(k); }} style={styles.tab}>
    <Ionicons name={tab === k ? on : off} size={24} color={tab === k ? C.gold : C.textSecondary} />
    {tab === k && <View style={[styles.dot, { backgroundColor: C.gold }]} />}
  </Pressable>
);

function Shell({ settings, update }) {
  const toast = useToast();
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState(null); // null | settings | about | privacy | terms | backup
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { note | null }
  const [selecting, setSelecting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setNotes(await getAllNotes()); setTrash(await getTrashNotes()); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    (async () => {
      await initNotifications();
      await purgeOldTrash(); // 30-day auto-purge on launch
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
      rescheduleAll(await getNotesWithReminders()); // BootReceiver equivalent
    })();
  }, [refresh]);

  const goBack = useCallback(() => {
    if (screen === 'privacy' || screen === 'terms') { setScreen('about'); return true; }
    if (screen === 'about' || screen === 'backup') { setScreen('settings'); return true; }
    if (screen) { setScreen(null); return true; }
    if (selecting) { setSelecting(false); return true; }
    if (tab !== 'home') { setTab('home'); return true; }
    return false;
  }, [screen, selecting, tab]);

  useEffect(() => {
    if (Platform.OS !== 'android' || editing) return undefined; // Editor registers its own handler
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [editing, goBack]);

  // Locked notes: biometric / device credential before opening or acting on them
  const unlockThen = async (note, fn) => {
    const r = await authenticate('Locked note', `Unlock “${note.title}”`);
    if (r === 'ok') fn();
    else if (r === 'unavailable') toast('Set up a screen lock to open locked notes', 'error');
  };
  const open = (note) => (note.isLocked ? unlockThen(note, () => setEditing({ note })) : setEditing({ note }));

  if (editing) {
    return (
      <Editor note={editing.note} autoSave={settings.auto_save}
        onClose={() => { setEditing(null); refresh(); }}
        onSaved={() => { setEditing(null); refresh(); }} />
    );
  }

  if (screen) {
    return (
      <Background>
        {screen === 'settings' && (
          <Settings settings={settings} update={update} onClose={() => setScreen(null)}
            onOpenTrash={() => { setScreen(null); setTab('trash'); }} onOpenBackup={() => setScreen('backup')}
            onAbout={() => setScreen('about')} onCleared={() => { setScreen(null); setTab('home'); refresh(); }} />
        )}
        {screen === 'about' && <About onClose={() => setScreen('settings')} onLegal={(k) => setScreen(k)} />}
        {(screen === 'privacy' || screen === 'terms') && <Legal kind={screen} onClose={() => setScreen('about')} />}
        {screen === 'backup' && <Backup onClose={() => setScreen('settings')} onChanged={refresh} />}
      </Background>
    );
  }

  return (
    <Background>
      <View style={{ flex: 1 }}>
        {tab === 'home' && <Home notes={notes} loading={loading} onChanged={refresh} onOpen={open} onNew={() => setEditing({ note: null })}
          unlockThen={unlockThen} selecting={selecting} setSelecting={setSelecting} onSettings={() => setScreen('settings')} />}
        {tab === 'calendar' && <Calendar notes={notes} onOpen={open} />}
        {tab === 'reminders' && <Reminders notes={notes} onOpen={open} onChanged={refresh} />}
        {tab === 'trash' && <Trash notes={trash} onChanged={refresh} />}
      </View>
      <NavIsland tab={tab} setTab={(t) => { setSelecting(false); setTab(t); }} onNew={() => setEditing({ note: null })} />
    </Background>
  );
}

// SplashActivity (simplified): app mark on themed background
function Splash() {
  return (
    <Background>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="document-text" size={50} color={C.onAccent} />
        </View>
        <Txt bold style={{ fontSize: T.display, marginTop: S.l }}>Note Pad PRO</Txt>
      </View>
    </Background>
  );
}

// App-level biometric lock (AppPrefs.biometric_lock)
function LockScreen({ onUnlocked }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const tryUnlock = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const r = await authenticate('Unlock Note Pad Pro', 'Confirm it is you');
    setBusy(false);
    if (r === 'ok' || r === 'unavailable') onUnlocked(); // never lock the user out if no screen lock exists
    else toast('Authentication required', 'error');
  }, [busy, onUnlocked, toast]);
  useEffect(() => { tryUnlock(); }, []); // eslint-disable-line
  return (
    <Background>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.x3 }}>
        <Ionicons name="lock-closed" size={52} color={C.gold} />
        <Txt bold style={{ fontSize: T.headline, marginVertical: S.l }}>Note Pad Pro is locked</Txt>
        <GoldButton icon="finger-print" label="Unlock" onPress={tryUnlock} />
      </View>
    </Background>
  );
}

function Root() {
  const scheme = useColorScheme();
  const [settings, setSettings] = useState(null);
  const [splash, setSplash] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => { setSettings(s); setLocked(!!s.biometric_lock && Platform.OS !== 'web'); setSplash(!s.skip_splash); });
  }, []);
  useEffect(() => {
    if (!settings || !splash) return undefined;
    const t = setTimeout(() => setSplash(false), 1100);
    return () => clearTimeout(t);
  }, [settings, splash]);

  if (!settings) return <View style={{ flex: 1, backgroundColor: '#0F1015' }} />;

  // Resolve Light / Dark / System, then push the palette into the shared theme object
  const isDark = settings.mode === MODE.SYSTEM ? scheme === 'dark' : settings.mode === MODE.DARK;
  applyPalette(settings.pack, isDark);
  C.lite = !!settings.lite_mode;
  const themeKey = `${settings.pack}-${isDark}-${C.lite}`;
  const update = (patch) => { const n = { ...settings, ...patch }; setSettings(n); saveSettings(n); };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ToastProvider>
        {splash ? <Splash key={`s-${themeKey}`} />
          : locked ? <LockScreen key={`l-${themeKey}`} onUnlocked={() => setLocked(false)} />
          : <Shell key={themeKey} settings={settings} update={update} />}
      </ToastProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  islandWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  island: { width: '88%', maxWidth: 420, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  tab: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginHorizontal: S.s,
    shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
});
