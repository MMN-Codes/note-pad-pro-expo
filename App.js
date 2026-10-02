import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Note Pad Pro</Text>
          <Ionicons name="sparkles" size={20} color="#FFD700" />
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Meeting Notes 📝</Text>
          <Text style={styles.noteDesc}>
            Apple Liquid Glass UI design finalized. Cross-platform sync active.
          </Text>
          <Text style={styles.noteDate}>Today, 07:30 PM</Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Pro Features 👑</Text>
          <Text style={styles.noteDesc}>
            1. 100% Transparent Crystal Capsule{'\n'}
            2. Real-time Backdrop Blur{'\n'}
            3. Dynamic Theme Squircles
          </Text>
          <Text style={styles.noteDate}>Yesterday</Text>
        </View>
      </ScrollView>

      {/* Floating Glass Navigation Bar */}
      <View style={styles.navWrapper}>
        <View style={styles.glassCapsule}>
          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Home' && styles.activeLens]} 
            onPress={() => setActiveTab('Home')}>
            <Ionicons name="home" size={22} color={activeTab === 'Home' ? '#FFD700' : '#8A8F98'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Search' && styles.activeLens]} 
            onPress={() => setActiveTab('Search')}>
            <Ionicons name="search" size={22} color={activeTab === 'Search' ? '#FFD700' : '#8A8F98'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.centerAddBtn} onPress={() => alert('New Note!')}>
            <Ionicons name="add" size={26} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Bookmarks' && styles.activeLens]} 
            onPress={() => setActiveTab('Bookmarks')}>
            <Ionicons name="bookmark" size={22} color={activeTab === 'Bookmarks' ? '#FFD700' : '#8A8F98'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navBtn, activeTab === 'Settings' && styles.activeLens]} 
            onPress={() => setActiveTab('Settings')}>
            <Ionicons name="settings-sharp" size={22} color={activeTab === 'Settings' ? '#FFD700' : '#8A8F98'} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1015',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    gap: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noteCard: {
    backgroundColor: '#1A1C24',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#262933',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  noteDesc: {
    fontSize: 13,
    color: '#A0A4B0',
    lineHeight: 19,
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 11,
    color: '#656975',
  },
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
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(26, 28, 36, 0.85)',
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
