// AboutActivity + PrivacyPolicyActivity + TermsActivity
import React from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, R, S, T } from './theme';
import { Glass, IconBtn, Txt, haptic, useToast } from './ui';
import { PRIVACY, TERMS } from './legal';

export function Legal({ kind, onClose }) {
  const insets = useSafeAreaInsets();
  const text = kind === 'terms' ? TERMS : PRIVACY;
  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s }}>{kind === 'terms' ? 'Terms of Service' : 'Privacy Policy'}</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }}>
        <Glass contentStyle={{ padding: S.l }}>
          <Txt selectable style={{ color: C.textPrimary, lineHeight: 22 }}>{text}</Txt>
        </Glass>
      </ScrollView>
    </View>
  );
}

const Row = ({ icon, label, onPress }) => (
  <Pressable onPress={() => { haptic(); onPress(); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: S.l, opacity: pressed ? 0.7 : 1 })}>
    <Ionicons name={icon} size={20} color={C.gold} style={{ width: 34 }} />
    <Txt medium style={{ flex: 1 }}>{label}</Txt>
    <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
  </Pressable>
);

export default function About({ onClose, onLegal }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const open = (u) => Linking.openURL(u).catch(() => toast('Could not open link', 'error'));
  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s }}>About</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }}>
        <View style={{ alignItems: 'center', marginVertical: S.xxl }}>
          <View style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text" size={42} color={C.onAccent} />
          </View>
          <Txt bold style={{ fontSize: T.display, marginTop: S.l }}>Note Pad PRO</Txt>
          <Txt style={{ color: C.textSecondary, marginTop: 4 }}>Version 1.0.0</Txt>
          <Txt style={{ color: C.textSecondary }}>Developed by MMN Codes</Txt>
        </View>
        <Glass contentStyle={{ paddingVertical: S.xs }}>
          <Row icon="mail-outline" label="Contact Us" onPress={() => open('mailto:all4you598@gmail.com?subject=Feedback%20for%20Note%20Pad')} />
          <Row icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => onLegal('privacy')} />
          <Row icon="document-text-outline" label="Terms of Service" onPress={() => onLegal('terms')} />
          <Row icon="star-outline" label="Rate App" onPress={() => open('https://play.google.com/store/apps/details?id=mmn.notepadpro.app')} />
        </Glass>
      </ScrollView>
    </View>
  );
}
