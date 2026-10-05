// IntroActivity.java — 3 swipeable slides
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, T } from './theme';
import { GoldButton, Txt, haptic } from './ui';

const SLIDES = [
  { icon: 'lock-closed', title: 'Secure Your Notes',
    desc: 'Keep your private thoughts safe with advanced App Lock and Fingerprint protection. Your notes stay secure on your device.' },
  { icon: 'cloud-upload', title: 'Backup & Restore',
    desc: 'Create backups, protect them with a password and export your notes to files, so you can store or share them anytime.' },
  { icon: 'sparkles', title: 'Smart Features',
    desc: 'Export notes to Markdown or QR Code, enjoy Auto Save, Reminders, linked notes and many more productivity tools.' },
];

export default function Intro({ onDone }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const ref = useRef(null);
  const last = index === SLIDES.length - 1;
  const next = () => { haptic(); if (last) onDone(); else ref.current?.scrollToIndex({ index: index + 1, animated: true }); };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.m, paddingBottom: insets.bottom + S.xl }}>
      <View style={{ alignItems: 'flex-end', paddingHorizontal: S.xl, height: 40 }}>
        {!last && <Pressable onPress={onDone} hitSlop={10}><Txt medium style={{ color: C.textSecondary }}>Skip</Txt></Pressable>}
      </View>
      <FlatList ref={ref} data={SLIDES} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(s) => s.title}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.x3 }}>
            <View style={{ width: 132, height: 132, borderRadius: 40, backgroundColor: C.pill, alignItems: 'center', justifyContent: 'center', marginBottom: S.xxl }}>
              <Ionicons name={item.icon} size={64} color={C.gold} />
            </View>
            <Txt bold style={{ fontSize: T.display, textAlign: 'center' }}>{item.title}</Txt>
            <Txt style={{ color: C.textSecondary, textAlign: 'center', marginTop: S.m, lineHeight: 22, fontSize: T.body }}>{item.desc}</Txt>
          </View>
        )} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: S.xl }}>
        {SLIDES.map((s, i) => (
          <View key={s.title} style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, marginHorizontal: 4,
            backgroundColor: i === index ? C.gold : C.hairline }} />
        ))}
      </View>
      <View style={{ paddingHorizontal: S.xl }}>
        <GoldButton label={last ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}
