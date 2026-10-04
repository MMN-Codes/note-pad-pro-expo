import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BG_STYLES, C, F, PRISM, R, S, T } from './theme';
import { Glass, Txt } from './ui';
import { checklistProgress, notePreview } from './rules';
import { daysLeftInTrash } from './utils';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// NotesAdapter.highlightQuery()
function Highlight({ text, query, style, numberOfLines }) {
  if (!query) return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  const parts = text.split(new RegExp(`(${esc(query)})`, 'ig'));
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, i) => p.toLowerCase() === query.toLowerCase()
        ? <Text key={i} style={{ backgroundColor: 'rgba(255,215,0,0.35)', color: C.gold }}>{p}</Text>
        : <Text key={i}>{p}</Text>)}
    </Text>
  );
}

export default function NoteCard({ note, onPress, onLongPress, query = '', grid, selected, trash }) {
  const bg = BG_STYLES[note.bgStyle] || null;
  const titleColor = bg ? bg.text : C.textPrimary;
  const subColor = bg ? bg.text : C.textSecondary;
  const { done, total } = note.isChecklist ? checklistProgress(note) : { done: 0, total: 0 };
  const showBadge = note.isChecklist && !note.isLocked && !grid;
  const title = note.title || 'Untitled Note';

  const icons = (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {note.isPinned && <Ionicons name="pin" size={16} color={C.gold} style={{ marginLeft: 6 }} />}
      {note.hasReminder && <Ionicons name="alarm" size={16} color={C.blue} style={{ marginLeft: 6 }} />}
      {note.isLocked && <Ionicons name="lock-closed" size={15} color={subColor} style={{ marginLeft: 6 }} />}
      {trash && (
        <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: R.xs, backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: C.danger, fontFamily: F.bold, fontSize: T.micro }}>{daysLeftInTrash(note.trashedDate)}d</Text>
        </View>
      )}
    </View>
  );

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={350}
      style={({ pressed }) => [grid ? { flex: 1, margin: S.xs } : { marginBottom: S.s }, pressed && { opacity: 0.85 }]}>
      <Glass blur={false} radius={R.l}
        fill={bg ? bg.fill : C.glassFillSubtle}
        borderColors={selected ? [C.gold, C.gold] : bg ? [bg.stroke, bg.stroke] : PRISM}
        contentStyle={{ padding: S.l, flexDirection: 'row', minHeight: grid ? 120 : 0 }}>
        {showBadge && (
          <View style={{ width: 56, height: 56, borderRadius: R.s, marginRight: S.m, alignItems: 'center',
            justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: C.gold, fontFamily: F.bold, fontSize: T.micro }}>{done}/{total}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Highlight text={title} query={query} numberOfLines={1}
              style={{ flex: 1, color: titleColor, fontFamily: F.bold, fontSize: T.title }} />
            {icons}
          </View>
          <Highlight text={notePreview(note)} query={note.isLocked ? '' : query} numberOfLines={grid ? 4 : 2}
            style={{ color: subColor, opacity: bg ? 0.85 : 1, fontFamily: F.regular, fontSize: T.body, marginTop: 6 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: S.m }}>
            <Txt style={{ color: subColor, opacity: 0.8, fontSize: T.micro, flex: 1 }}>{note.date}  •  {note.time}</Txt>
            {selected && <Ionicons name="checkmark-circle" size={20} color={C.gold} />}
          </View>
        </View>
      </Glass>
    </Pressable>
  );
}
