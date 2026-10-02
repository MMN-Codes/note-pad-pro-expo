import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('Home');

  // Notes List State
  const [notes, setNotes] = useState([
    {
      id: '1',
      title: 'Meeting Notes 📝',
      desc: 'Apple Liquid Glass UI design finalized. Cross-platform sync active across iOS & Android.',
      date: 'Today, 07:30 PM',
      isBookmarked: true
    },
    {
      id: '2',
      title: 'Note Pad Pro Roadmap 🚀',
      desc: '1. Transparent Glass Capsule\n2. Real-time Backdrop Refraction\n3. Cloud Sync with EAS',
      date: 'Yesterday',
      isBookmarked: false
    },
    {
      id: '3',
      title: 'Idea Vault 💡',
      desc: 'Deploy lightweight cross-platform builds without needing a Mac locally.',
      date: '28 Sep',
      isBookmarked: true
    }
  ]);

  // Modal & Input States
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Add Note Handler
  const handleAddNote = () => {
    if (!newTitle.trim()) {
      Alert.alert('Empty Title', 'Please enter a title for your note.');
      return;
    }

    const newNoteItem = {
      id: Date.now().toString(),
      title: newTitle,
      desc: newDesc || 'No additional details.',
      date: 'Just now',
      isBookmarked: false
    };

    setNotes([newNoteItem, ...notes]);
    setNewTitle('');
    setNewDesc('');
    setModalVisible(false);
  };

  // Toggle Bookmark Handler
  const toggleBookmark = (id) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isBookmarked: !note.isBookmarked } : note
    ));
  };

  // Filter notes based on active tab
  const displayedNotes = activeTab === 'Bookmarks' 
    ? notes.filter(n => n.isBookmarked) 
    : notes;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>Note Pad Pro</Text>
          <Text style={styles.appSubtitle}>
            {activeTab === 'Bookmarks' ? 'Saved Bookmarks' : 'All Notes'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.proBadge} 
          onPress={() => Alert.alert('Note Pad Pro', 'Lifetime Pro Activated ✨')}>
          <Ionicons name="sparkles" size={14} color="#FFD700" />
          <Text style={styles.proText}>PRO</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Notes List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {displayedNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#4A4E5A" />
            <Text style={styles.emptyText}>No notes found here</Text>
          </View>
        ) : (
          displayedNotes.map((item) => (
            <View key={item.id} style={styles.noteCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.noteTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => toggleBookmark(item.id)}>
                  <Ionicons 
                    name={item.isBookmarked ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={item.isBookmarked ? "#FFD700" : "#656975"} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.noteDesc}>{item.desc}</Text>
              <Text style={styles.noteDate}>{item.date}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* ================= FLOATING GLASS NAVIGATION BAR ================= */}
      <View style={styles.navWrapper}>
        <View style={styles.glassCapsule}>
          
          {/* Tab 1: Home */}
          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Home' && styles.activeLens]} 
            onPress={() => setActiveTab('Home')}>
            <Ionicons 
              name="home" 
              size={22} 
              color={activeTab === 'Home' ? '#FFD700' : '#8A8F98'} 
            />
          </TouchableOpacity>

          {/* Tab 2: Search */}
          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Search' && styles.activeLens]} 
            onPress={() => setActiveTab('Search')}>
            <Ionicons 
              name="search" 
              size={22} 
              color={activeTab === 'Search' ? '#FFD700' : '#8A8F98'} 
            />
          </TouchableOpacity>

          {/* Tab 3: Quick Add Button */}
          <TouchableOpacity 
            style={styles.centerAddBtn} 
            onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={28} color="#000000" />
          </TouchableOpacity>

          {/* Tab 4: Bookmarks */}
          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Bookmarks' && styles.activeLens]} 
            onPress={() => setActiveTab('Bookmarks')}>
            <Ionicons 
              name="bookmark" 
              size={22} 
              color={activeTab === 'Bookmarks' ? '#FFD700' : '#8A8F98'} 
            />
          </TouchableOpacity>

          {/* Tab 5: Settings */}
          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Settings' && styles.activeLens]} 
            onPress={() => setActiveTab('Settings')}>
            <Ionicons 
              name="settings-sharp" 
              size={22} 
              color={activeTab === 'Settings' ? '#FFD700' : '#8A8F98'} 
            />
          </TouchableOpacity>

        </View>
      </View>

      {/* ================= NEW NOTE MODAL (Glass Overlay) ================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color="#8A8F98" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.titleInput}
              placeholder="Note Title..."
              placeholderTextColor="#656975"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={styles.descInput}
              placeholder="Start typing your thoughts..."
              placeholderTextColor="#656975"
              multiline
              numberOfLines={4}
              value={newDesc}
              onChangeText={setNewDesc}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddNote}>
              <Text style={styles.saveBtnText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1015',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#8A8F98',
    marginTop: 2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E2028',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  proText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
  },
  noteCard: {
    backgroundColor: '#1A1C24',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#262933',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noteDesc: {
    fontSize: 13,
    color: '#A0A4B0',
    lineHeight: 20,
    marginBottom: 12,
  },
  noteDate: {
    fontSize: 11,
    color: '#656975',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    gap: 12,
  },
  emptyText: {
    color: '#656975',
    fontSize: 15,
  },

  /* Floating Bottom Island */
  navWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  glassCapsule: {
    flexDirection: 'row',
    width: '100%',
    height: 64,
    borderRadius: 32,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(24, 26, 33, 0.88)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLens: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  centerAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  /* Modal Bottom Sheet */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#16181F',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2D3A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  titleInput: {
    backgroundColor: '#1E212B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 12,
  },
  descInput: {
    backgroundColor: '#1E212B',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
