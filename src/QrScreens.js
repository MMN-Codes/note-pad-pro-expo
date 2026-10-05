// NoteQrHelper UI: show a note as a QR code + import a note from a QR image / link
import React, { useRef, useState } from 'react';
import { Platform, ScrollView, Share, TextInput, View } from 'react-native';
import { copyText, pasteText } from './clip';
import { defaultOf, tryRequire } from './lazy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F, R, S, T } from './theme';
import { Glass, GlassSheet, GoldButton, IconBtn, Txt, useToast } from './ui';
import { buildQrContent, decodeScannedText, isQrContentTooLarge } from './qr';
import { addNote, newNote } from './db';
import { shareFile } from './files';
import { fmtDate, fmtTime } from './utils';

const getQR = () => defaultOf(tryRequire(() => require('react-native-qrcode-svg')));

export function QrShareSheet({ visible, onClose, title, content }) {
  const toast = useToast();
  const qrRef = useRef(null);
  let link = '';
  if (visible) { try { link = buildQrContent({ title, content }); } catch { link = ''; } }
  const tooBig = visible && !!link && isQrContentTooLarge(link);
  const QRCode = visible ? getQR() : null;

  const shareImage = () => {
    try {
      qrRef.current.toDataURL(async (b64) => {
        try { await shareFile('NotePad_QR.png', b64, { base64: true, mime: 'image/png' }); }
        catch (e) { toast(`Could not share image: ${e.message}`, 'error'); }
      });
    } catch { toast('QR image sharing is not supported here — share the link instead', 'error'); }
  };

  return (
    <GlassSheet visible={visible} onClose={onClose} title="Share as QR code">
      {() => (
        <View style={{ alignItems: 'center', paddingBottom: S.m }}>
          {visible && (!QRCode || !link) ? (
            <>
              <Txt style={{ color: C.textSecondary, textAlign: 'center', marginVertical: S.xl }}>
                QR code is not available in this preview. Use the full app build or the web version.
              </Txt>
            </>
          ) : null}
          {tooBig ? (
            <Txt style={{ color: C.textSecondary, textAlign: 'center', marginVertical: S.xl }}>
              This note is too long to fit in a QR code reliably. Shorten it, or share it as text / Markdown instead.
            </Txt>
          ) : QRCode && link ? (
            <>
              <View style={{ padding: S.m, backgroundColor: '#FFFFFF', borderRadius: R.m }}>
                <QRCode value={link} size={230} ecl="M" getRef={(c) => { qrRef.current = c; }} />
              </View>
              <Txt style={{ color: C.textSecondary, fontSize: T.caption, textAlign: 'center', marginVertical: S.m }}>
                Scan with Note Pad Pro (Import from QR) to copy this note to another phone.
              </Txt>
              <View style={{ flexDirection: 'row', gap: S.m, width: '100%' }}>
                <GoldButton subtle icon="link-outline" label="Share link" style={{ flex: 1 }}
                  onPress={() => Share.share({ message: link }).catch(() => {})} />
                <GoldButton icon="image-outline" label="Share image" style={{ flex: 1 }} onPress={shareImage} />
              </View>
            </>
          ) : null}
        </View>
      )}
    </GlassSheet>
  );
}

export function QrImport({ onClose, onImported, initialText = '' }) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);

  const importFrom = async (raw) => {
    const n = decodeScannedText(raw);
    if (!n) { toast('Not a valid Note Pad Pro QR code', 'error'); return; }
    const now = new Date();
    const note = newNote(n.title, n.content, fmtDate(now), fmtTime(now));
    await addNote(note);
    toast(`Imported “${n.title}”`, 'success');
    onImported();
  };

  const fromGallery = async () => {
    try {
      setBusy(true);
      const ImagePicker = tryRequire(() => require('expo-image-picker'));
      const Cam = tryRequire(() => require('expo-camera'));
      if (!ImagePicker || !Cam || !Cam.CameraView) { toast('Scanning from a photo needs the full app build', 'error'); return; }
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (r.canceled || !r.assets || !r.assets.length) return;
      const found = await Cam.CameraView.scanFromURLAsync(r.assets[0].uri, ['qr']);
      if (!found || !found.length) { toast('No QR code found in this image', 'error'); return; }
      await importFrom(found[0].data);
    } catch (e) { toast(`Scan failed: ${e.message}`, 'error'); } finally { setBusy(false); }
  };
  const paste = async () => { try { setText(await pasteText()); } catch (e) { toast(e.message, 'error'); } };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + S.s }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.s, marginBottom: S.m }}>
        <IconBtn name="chevron-back" onPress={onClose} />
        <Txt bold style={{ fontSize: T.headline, marginLeft: S.s }}>Import from QR</Txt>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: S.l, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {Platform.OS !== 'web' && (
          <Glass contentStyle={{ padding: S.l, marginBottom: S.l }}>
            <Txt bold style={{ fontSize: T.title }}>From a photo</Txt>
            <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>
              Pick a screenshot or photo of a Note Pad Pro QR code from your gallery. No camera access is used.
            </Txt>
            <GoldButton icon="images-outline" label={busy ? 'Scanning…' : 'Choose image'} onPress={() => !busy && fromGallery()} />
          </Glass>
        )}
        <Glass contentStyle={{ padding: S.l }}>
          <Txt bold style={{ fontSize: T.title }}>From a link</Txt>
          <Txt style={{ color: C.textSecondary, marginVertical: S.s }}>Paste the link that was shared with the QR code.</Txt>
          <TextInput value={text} onChangeText={setText} multiline autoCapitalize="none" autoCorrect={false}
            placeholder="https://…#…" placeholderTextColor={C.textSecondary}
            style={{ minHeight: 90, maxHeight: 180, borderRadius: R.m, padding: S.m, color: C.textPrimary, backgroundColor: C.soft,
              fontFamily: F.regular, fontSize: 12, textAlignVertical: 'top' }} />
          <View style={{ flexDirection: 'row', gap: S.m, marginTop: S.m }}>
            <GoldButton subtle icon="clipboard-outline" label="Paste" onPress={paste} style={{ flex: 1 }} />
            <GoldButton icon="download-outline" label="Import" style={{ flex: 1 }} onPress={() => text.trim() && importFrom(text)} />
          </View>
        </Glass>
      </ScrollView>
    </View>
  );
}
