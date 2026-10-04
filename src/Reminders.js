import React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, T } from './theme';
import { Glass, Txt, useToast } from './ui';
import { getNote, updateNote } from './db';
import { cancelReminder } from './notify';
import { cmpStr } from './utils';

const REP = { none: 'Once', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };

// RemindersBottomSheet / RemindersAdapter: has_reminder = 1 AND not deleted, ORDER BY reminder_time ASC
export default function Reminders({ notes, onOpen, onChanged }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const list = notes.filter((n) => n.hasReminder).sort((a, b) => cmpStr(a.reminderTime, b.reminderTime));
  const clear = async (n) => {
    const fresh = await getNote(n.id);
    if (fresh) await updateNote({ ...fresh, hasReminder: false, reminderTime: null, repeatInterval: 'none' });
    await cancelReminder(n.id); onChanged(); toast('Reminder removed', 'success');
  };
  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <Txt bold style={{ fontSize: T.headline, paddingHorizontal: S.l, marginBottom: S.m }}>Reminders</Txt>
      {list.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
          <Ionicons name="alarm-outline" size={44} color={C.gold} />
          <Txt style={{ color: C.textSecondary, marginTop: S.m }}>No reminders set</Txt>
        </View>
      ) : (
        <FlatList data={list} keyExtractor={(n) => n.id} contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 130 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onOpen(item)} style={{ marginBottom: S.s }}>
              <Glass blur={false} contentStyle={{ padding: S.l, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alarm" size={22} color={C.blue} style={{ marginRight: S.m }} />
                <View style={{ flex: 1 }}>
                  <Txt bold numberOfLines={1} style={{ fontSize: T.title }}>{item.title || 'Note Reminder'}</Txt>
                  <Txt style={{ color: C.textSecondary, fontSize: T.caption }}>{item.reminderTime}  •  {REP[item.repeatInterval] || 'Once'}</Txt>
                </View>
                <Pressable hitSlop={10} onPress={() => clear(item)}><Ionicons name="close-circle" size={22} color={C.textSecondary} /></Pressable>
              </Glass>
            </Pressable>
          )} />
      )}
    </View>
  );
}
