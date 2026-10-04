import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, PRISM, R, S, T } from './theme';

export const haptic = (kind = 'light') => {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

export const squircle = { borderCurve: 'continuous' };

// ---- Glass surface: prismatic gradient hairline + frosted blur + tinted fill ----------
export function Glass({ radius = R.l, blur = true, intensity = 40, fill = C.glassFill, border = true,
  style, contentStyle, children, borderColors = PRISM }) {
  const inner = (
    <View style={[{ borderRadius: radius - (border ? 1 : 0), overflow: 'hidden' }, squircle]}>
      {blur && <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />}
      <View style={[{ backgroundColor: fill }, contentStyle]}>{children}</View>
    </View>
  );
  if (!border) return <View style={[{ borderRadius: radius }, squircle, style]}>{inner}</View>;
  return (
    <LinearGradient colors={borderColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, padding: 1 }, squircle, style]}>
      {inner}
    </LinearGradient>
  );
}

export function Background({ children }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#0F1015', '#12151D', '#0F1015']} style={StyleSheet.absoluteFill} />
        <View style={[styles.orb, { top: -80, right: -60, backgroundColor: 'rgba(255,215,0,0.10)' }]} />
        <View style={[styles.orb, { bottom: 120, left: -90, backgroundColor: 'rgba(147,197,253,0.10)' }]} />
      </View>
      {children}
    </View>
  );
}

export function IconBtn({ name, onPress, size = 22, color = C.textPrimary, style, active }) {
  return (
    <Pressable onPress={() => { haptic(); onPress && onPress(); }} hitSlop={8}
      style={({ pressed }) => [styles.iconBtn, active && { backgroundColor: 'rgba(255,215,0,0.14)' }, pressed && { opacity: 0.6 }, style]}>
      <Ionicons name={name} size={size} color={active ? C.gold : color} />
    </Pressable>
  );
}

export const Txt = ({ style, bold, medium, ...p }) => (
  <Text {...p} style={[{ color: C.textPrimary, fontFamily: F.regular, fontWeight: bold ? '700' : medium ? '600' : '400', fontSize: T.body }, style]} />
);

export function Chip({ label, selected, onPress, icon }) {
  return (
    <Pressable onPress={() => { haptic(); onPress(); }}
      style={[styles.chip, selected && { backgroundColor: 'rgba(255,215,0,0.16)', borderColor: C.gold }]}>
      {icon ? <Ionicons name={icon} size={14} color={selected ? C.gold : C.textSecondary} style={{ marginRight: 6 }} /> : null}
      <Txt medium style={{ fontSize: T.caption, color: selected ? C.gold : C.textPrimary }}>{label}</Txt>
    </Pressable>
  );
}

export function GoldButton({ label, onPress, icon, danger, subtle, style }) {
  const bg = danger ? 'rgba(239,68,68,0.18)' : subtle ? 'rgba(255,255,255,0.08)' : C.gold;
  const fg = danger ? C.danger : subtle ? C.textPrimary : '#1A1A1A';
  return (
    <Pressable onPress={() => { haptic('medium'); onPress(); }}
      style={({ pressed }) => [{ height: 48, borderRadius: R.m, backgroundColor: bg, alignItems: 'center',
        justifyContent: 'center', flexDirection: 'row', paddingHorizontal: S.xl, opacity: pressed ? 0.8 : 1 }, squircle, style]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 8 }} /> : null}
      <Txt bold style={{ color: fg, fontSize: T.body }}>{label}</Txt>
    </Pressable>
  );
}

// ---- Bottom sheet (replaces BottomSheetDialog / PopupWindow menus) ----------------------
export function GlassSheet({ visible, onClose, title, children, maxHeight = 0.85 }) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    y.setValue(Dimensions.get('window').height); fade.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [visible]);
  const close = () => Animated.parallel([
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }),
    Animated.timing(y, { toValue: Dimensions.get('window').height, duration: 200, useNativeDriver: true }),
  ]).start(() => onClose && onClose());
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View pointerEvents="box-none" style={[styles.sheetWrap, { transform: [{ translateY: y }] }]}>
        <Glass radius={R.sheet} fill="rgba(22,23,30,0.88)" intensity={60}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, maxHeight: `${maxHeight * 100}%` }}
          contentStyle={{ paddingTop: S.s, paddingHorizontal: S.xl, paddingBottom: insets.bottom + S.xl }}>
          <View style={styles.handle} />
          {title ? <Txt bold style={{ fontSize: T.headline, marginVertical: S.m }}>{title}</Txt> : null}
          {typeof children === 'function' ? children(close) : children}
        </Glass>
      </Animated.View>
    </Modal>
  );
}

export function SheetRow({ icon, label, onPress, danger, trailing }) {
  return (
    <Pressable onPress={() => { haptic(); onPress(); }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
      <Ionicons name={icon} size={22} color={danger ? C.danger : C.gold} style={{ width: 32 }} />
      <Txt medium style={{ flex: 1, fontSize: T.title, color: danger ? C.danger : C.textPrimary }}>{label}</Txt>
      {trailing}
    </Pressable>
  );
}

// ---- Centered glass dialog (replaces AlertDialog) ---------------------------------------
export function GlassDialog({ visible, title, message, confirmLabel = 'OK', cancelLabel = 'Cancel',
  danger, onConfirm, onCancel, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dialogBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Glass radius={R.l} fill="rgba(22,23,30,0.92)" intensity={60} style={{ width: '100%', maxWidth: 380 }}
          contentStyle={{ padding: S.xl }}>
          <Txt bold style={{ fontSize: T.title, marginBottom: S.s }}>{title}</Txt>
          {message ? <Txt style={{ color: C.textSecondary, marginBottom: S.l }}>{message}</Txt> : null}
          {children}
          <View style={{ flexDirection: 'row', gap: S.m, marginTop: S.s }}>
            {cancelLabel ? <GoldButton subtle label={cancelLabel} onPress={onCancel} style={{ flex: 1 }} /> : null}
            <GoldButton danger={danger} label={confirmLabel} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </Glass>
      </View>
    </Modal>
  );
}

// ---- Toast (ToastHelper) ------------------------------------------------------------------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [t, setT] = useState(null);
  const op = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const show = useCallback((message, type = 'info') => {
    clearTimeout(timer.current);
    setT({ message, type });
    Animated.timing(op, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    timer.current = setTimeout(() =>
      Animated.timing(op, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setT(null)), 2200);
  }, []);
  const color = t?.type === 'error' ? C.danger : t?.type === 'success' ? C.success : C.blue;
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 12, opacity: op }]}>
          <Glass radius={R.pill} fill="rgba(22,23,30,0.9)" contentStyle={{ paddingHorizontal: S.l, paddingVertical: S.m, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: S.s }} />
            <Txt medium style={{ fontSize: T.caption, flexShrink: 1 }}>{t.message}</Txt>
          </Glass>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.l, height: 36, borderRadius: R.pill,
    borderWidth: 1, borderColor: C.hairline, backgroundColor: 'rgba(255,255,255,0.05)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: S.s, borderRadius: R.m },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: S.xl },
  toast: { position: 'absolute', left: S.xl, right: S.xl, alignItems: 'center' },
});
