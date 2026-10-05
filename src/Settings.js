// SettingsActivity.java
import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, MODE, PACK, R, S, T, alpha, previewOf } from './theme';
import { Glass, GlassDialog, GlassSheet, IconBtn, SheetRow, Txt, haptic, squircle, useToast } from './ui';
import { authenticate } from './lock';
import { deleteAllNotes } from './db';

const PACKS = [[PACK.OCEAN, 'Ocean'], [PACK.CLASSIC, 'Classic'], [PACK.NOIR, 'Noir Gold']];
const QUALITY = [['original', 'Original quality'], ['balanced', 'Balanced (recommended)'], ['saver', 'Data saver']];
const qLabel = (m) => (m === 'original' ? 'Original' : m === 'saver' ? 'Data saver' : 'Balanced');

function Section({ label, children }) {
  return (
    <View style={{ marginBottom: S.xl }}>
      <Txt bold style={{ color: C.section, fontSize: T.micro, letterSpacing: 1, marginBottom: S.s, marginLeft: S.s }}>{label.toUpperCase()}</Txt>
      <Glass contentStyle={{ paddingVertical: S.xs }}>{children}</Glass>
    </View>
  );
}
function Row({ icon, label, hint, onPress, right, danger, color }) {
  return (
    <Pressable disabled={!onPress} onPress={() => { haptic(); onPress && onPress(); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: S.l, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 34, height: 34, borderRadius: R.s, backgroundColor: C.pill, alignItems: 'center', justifyContent: 'center', marginRight: S.m }}>
        <Ionicons name={icon} size={18} color={danger ? C.danger : color || C.gold} />
      </View>
      <View style={{ flex: 1, paddingVertical: S.s }}>
        <Txt medium style={{ color: danger ? C.danger : C.textPrimary }}>{label}</Txt>
        {hint ? <Txt style={{ color: C.textSecondary, fontSize: T.micro, marginTop: 2 }}>{hint}</Txt> : null}
      </View>
      {right}
    </Pressable>
  );
}
const Sw = ({ value, onChange }) => (
  <Switch value={value} onValueChange={(v) => { haptic(); onChange(v); }}
    trackColor={{ true: alpha(C.gold, 0.55), false: C.pill }} thumbColor={value ? C.gold : '#9a9a9a'} />
);

function Preview({ pack, dark, label, selected, onPress, system }) {
  const p = previewOf(pack, dark);
  return (
    <Pressable onPress={() => { haptic(); onPress(); }} style={{ width: '48%', marginBottom: S.m }}>
      <View style={[{ borderRadius: R.m, borderWidth: selected ? 2.5 : 1, borderColor: selected ? C.gold : C.hairline, overflow: 'hidden', height: 92 }, squircle]}>
        {p.gradient ? <LinearGradient colors={p.gradient} style={{ flex: 1, padding: S.s }} />
          : <View style={{ flex: 1, backgroundColor: p.bg, padding: S.s }} />}
        <View style={{ position: 'absolute', left: S.s, right: S.s, top: S.s, bottom: S.s, justifyContent: 'center' }}>
          <View style={{ height: 36, borderRadius: R.s, backgroundColor: p.card, borderWidth: 1, borderColor: p.border, justifyContent: 'center', paddingHorizontal: S.s }}>
            <View style={{ height: 6, width: '60%', borderRadius: 3, backgroundColor: p.text, opacity: 0.85 }} />
            <View style={{ height: 5, width: '40%', borderRadius: 3, backgroundColor: p.text, opacity: 0.35, marginTop: 5 }} />
          </View>
          <View style={{ position: 'absolute', right: 4, bottom: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: p.accent }} />
        </View>
        {selected && <Ionicons name="checkmark-circle" size={20} color={C.gold} style={{ position: 'absolute', top: 6, right: 6 }} />}
      </View>
      <Txt medium style={{ fontSize: T.caption, textAlign: 'center', marginTop: 6, color: selected ? C.gold : C.textPrimary }}>{label}</Txt>
    </Pressable>
  );
}

export default function Settings({ settings, update, onClose, onOpenTrash, onOpenBackup, onCleared, onAbout, onHelp }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [qSheet, setQSheet] = useState(false);
  const [clear, setClear] = useState(false);
  const isSystem = settings.mode === MODE.SYSTEM;

  const setBiometric = async (v) => {
    if (v) {
      const r = await authenticate('Enable app lock', 'Confirm it is you');
      if (r === 'unavailable') return toast('Set up a screen lock or biometrics first', 'error');
      if (r !== 'ok') return;
    }
    update({ biometric_lock: v });
  };
  const open = (url) => Linking.openURL(url).catch(() => toast('Could not open link', 'error'));

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s }}>Settings</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }}>
        <Section label="Appearance">
          <View style={{ padding: S.m }}>
            <View style={{ flexDirection: 'row', backgroundColor: C.pill, borderRadius: R.pill, padding: 3, marginBottom: S.m }}>
              {[['System', true], ['Manual', false]].map(([l, sys]) => {
                const on = sys === isSystem;
                return (
                  <Pressable key={l} onPress={() => { haptic(); update({ mode: sys ? MODE.SYSTEM : (C.isDark ? MODE.DARK : MODE.LIGHT) }); }}
                    style={{ flex: 1, height: 38, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.gold : 'transparent' }}>
                    <Txt bold style={{ color: on ? C.onAccent : C.textSecondary }}>{l}</Txt>
                  </Pressable>
                );
              })}
            </View>
            <Txt style={{ color: C.textSecondary, fontSize: T.caption, marginBottom: S.m }}>
              {isSystem ? 'Follows your phone’s light / dark setting. Pick a style:' : 'Pick an exact style and brightness:'}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {isSystem
                ? PACKS.map(([k, l]) => <Preview key={k} pack={k} dark={C.isDark} label={l} selected={settings.pack === k} onPress={() => update({ pack: k })} />)
                : PACKS.flatMap(([k, l]) => [false, true].map((d) => (
                  <Preview key={k + d} pack={k} dark={d} label={`${l} ${d ? 'Dark' : 'Light'}`}
                    selected={settings.pack === k && settings.mode === (d ? MODE.DARK : MODE.LIGHT)}
                    onPress={() => update({ pack: k, mode: d ? MODE.DARK : MODE.LIGHT })} />
                )))}
            </View>
          </View>
          <Row icon="flash-outline" label="Lite mode" hint="Turns off blur for smoother scrolling on older phones"
            right={<Sw value={!!settings.lite_mode} onChange={(v) => update({ lite_mode: v })} />} />
        </Section>

        <Section label="General">
          <Row icon="save-outline" label="Auto save" hint="Save notes automatically when you go back"
            right={<Sw value={settings.auto_save} onChange={(v) => update({ auto_save: v })} />} />
          <Row icon="finger-print" label="Biometric app lock" hint="Ask for fingerprint / face / PIN when the app opens"
            right={<Sw value={settings.biometric_lock} onChange={setBiometric} />} />
          <Row icon="speedometer-outline" label="Skip splash screen"
            right={<Sw value={settings.skip_splash} onChange={(v) => update({ skip_splash: v })} />} />
          <Row icon="image-outline" label="Image quality" onPress={() => setQSheet(true)}
            right={<Txt style={{ color: C.textSecondary }}>{qLabel(settings.image_quality_mode)}</Txt>} />
        </Section>

        <Section label="Data">
          <Row icon="cloud-upload-outline" label="Backup & Restore" hint="Export, import and encrypted backups" onPress={onOpenBackup}
            right={<Ionicons name="chevron-forward" size={18} color={C.textSecondary} />} />
          <Row icon="trash-outline" label="Trash Bin" onPress={onOpenTrash}
            right={<Ionicons name="chevron-forward" size={18} color={C.textSecondary} />} />
          <Row icon="warning-outline" danger label="Clear all data" hint="Deletes every note permanently" onPress={() => setClear(true)} />
        </Section>

        <Section label="About">
          <Row icon="information-circle-outline" label="About Note Pad Pro" onPress={onAbout}
            right={<Ionicons name="chevron-forward" size={18} color={C.textSecondary} />} />
          <Row icon="help-circle-outline" label="Help & Tips" onPress={onHelp}
            right={<Ionicons name="chevron-forward" size={18} color={C.textSecondary} />} />
          <Row icon="star-outline" label="Rate the app" onPress={() => open('https://play.google.com/store/apps/details?id=mmn.notepadpro.app')} />
        </Section>
      </ScrollView>

      <GlassSheet visible={qSheet} onClose={() => setQSheet(false)} title="Image quality">
        {(close) => QUALITY.map(([k, l]) => (
          <SheetRow key={k} icon="image-outline" label={l}
            trailing={settings.image_quality_mode === k ? <Ionicons name="checkmark" size={20} color={C.gold} /> : null}
            onPress={() => { update({ image_quality_mode: k }); close(); toast(`Image quality: ${qLabel(k)} (applies to new images)`, 'success'); }} />
        ))}
      </GlassSheet>

      <GlassDialog visible={clear} danger title="Clear All Data" confirmLabel="Delete Everything"
        message={'This will delete ALL your notes permanently.\n\nAre you sure?'}
        onCancel={() => setClear(false)}
        onConfirm={async () => { setClear(false); await deleteAllNotes(); toast('All data cleared 🗑️', 'error'); onCleared(); }} />
    </View>
  );
}
