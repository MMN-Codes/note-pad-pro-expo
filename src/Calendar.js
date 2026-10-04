import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, T, alpha } from './theme';
import { Glass, IconBtn, Txt, haptic } from './ui';
import NoteCard from './NoteCard';
import { cmpStr, fmtDate } from './utils';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// CalendarViewActivity: date -> count heatmap (getNoteCountsByDate / getNotesByExactDate)
export default function Calendar({ notes, onOpen }) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState(fmtDate(today));

  const counts = useMemo(() => {
    const m = {};
    notes.forEach((n) => { if (n.date != null) m[n.date] = (m[n.date] || 0) + 1; });
    return m;
  }, [notes]);
  const dayNotes = useMemo(() => notes.filter((n) => n.date === picked).sort((a, b) => cmpStr(b.time, a.time)), [notes, picked]);

  const first = cur.getDay();
  const dim = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (d) => setCur(new Date(cur.getFullYear(), cur.getMonth() + d, 1));
  const heat = (c) => (c >= 4 ? 0.7 : c === 3 ? 0.5 : c === 2 ? 0.32 : c === 1 ? 0.18 : 0);

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <Txt bold style={{ fontSize: T.headline, paddingHorizontal: S.l, marginBottom: S.m }}>Calendar</Txt>
      <View style={{ paddingHorizontal: S.l }}>
        <Glass contentStyle={{ padding: S.m }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconBtn name="chevron-back" onPress={() => shift(-1)} />
            <Txt bold style={{ fontSize: T.title }}>{MONTHS[cur.getMonth()]} {cur.getFullYear()}</Txt>
            <IconBtn name="chevron-forward" onPress={() => shift(1)} />
          </View>
          <View style={{ flexDirection: 'row', marginVertical: S.s }}>
            {DOW.map((d, i) => <Txt key={i} style={{ flex: 1, textAlign: 'center', color: C.textSecondary, fontSize: T.micro }}>{d}</Txt>)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={{ width: `${100 / 7}%`, height: 44 }} />;
              const key = fmtDate(new Date(cur.getFullYear(), cur.getMonth(), d));
              const c = counts[key] || 0;
              const sel = key === picked;
              const isToday = key === fmtDate(today);
              return (
                <Pressable key={i} onPress={() => { haptic(); setPicked(key); }} style={{ width: `${100 / 7}%`, height: 44, padding: 2 }}>
                  <View style={{ flex: 1, borderRadius: R.s, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: c ? alpha(C.gold, heat(c)) : 'transparent', borderWidth: sel ? 2 : isToday ? 1 : 0,
                    borderColor: sel ? C.gold : C.hairline }}>
                    <Txt medium style={{ fontSize: T.caption, color: c >= 3 ? C.onAccent : C.textPrimary }}>{d}</Txt>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Glass>
      </View>
      <Txt medium style={{ color: C.textSecondary, paddingHorizontal: S.l, marginVertical: S.m }}>
        {picked} • {dayNotes.length} {dayNotes.length === 1 ? 'note' : 'notes'}
      </Txt>
      <FlatList data={dayNotes} keyExtractor={(n) => n.id} contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 130 }}
        renderItem={({ item }) => <NoteCard note={item} onPress={() => onOpen(item)} onLongPress={() => onOpen(item)} />} />
    </View>
  );
}
