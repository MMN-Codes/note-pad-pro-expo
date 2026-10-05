import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, S, T } from './theme';
import { Glass, GoldButton, IconBtn, Txt } from './ui';
import { WELCOME_TEXT } from './helpText';

export default function Help({ onClose, onIntro }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s }}>Help & Tips</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }}>
        <Glass contentStyle={{ padding: S.l, marginBottom: S.l }}>
          <Txt style={{ color: C.textPrimary, lineHeight: 23 }}>{WELCOME_TEXT}</Txt>
        </Glass>
        <GoldButton subtle icon="play-circle-outline" label="Replay app intro" onPress={onIntro} />
      </ScrollView>
    </View>
  );
}
