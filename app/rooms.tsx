import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Room {
  id: string;
  name: string;
}

export default function RoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const addRoom = () => {
    if (newRoomName.trim().length > 0) {
      const newRoom: Room = {
        id: Date.now().toString(),
        name: newRoomName,
      };
      setRooms([...rooms, newRoom]);
      setNewRoomName('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Configuration for the Top Header */}
      <Stack.Screen 
        options={{ 
          title: "Rooms", 
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F2F2F7' },
          headerTitleStyle: { fontWeight: '600', color: '#000' },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace("/")} 
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={styles.pageHeader}>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={styles.pageBackButton}
        >
          <Ionicons name="chevron-back" size={28} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Rooms</Text>
        <View style={styles.pageHeaderSpacer} />
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.roomCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="home-outline" size={24} color="#000" />
            </View>
            <Text style={styles.roomLabel}>{item.name}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rooms added yet.</Text>
            <Text style={styles.emptySubText}>Tap the + button to create your first room.</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Add Room Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Room</Text>
            <TextInput
              style={styles.input}
              placeholder="Room Name (e.g. Studio)"
              placeholderTextColor="#8E8E93"
              value={newRoomName}
              onChangeText={setNewRoomName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addRoom} style={styles.addBtn}>
                <Text style={styles.addText}>Add Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#001f3f' 
  },
  backButton: {
    marginLeft: Platform.OS === 'ios' ? 0 : -5,
  },
  pageHeader: {
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  pageHeaderSpacer: {
    width: 44,
  },
  listContent: { 
    padding: 15,
    paddingBottom: 100 
  },
  roomCard: {
    backgroundColor: '#FFF',
    flex: 1,
    margin: 8,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roomLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000' 
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: { 
    fontSize: 18,
    fontWeight: '500',
    color: '#8E8E93' 
  },
  emptySubText: {
    fontSize: 14,
    color: '#AEAeb2',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: 20 
  },
  modalContent: { 
    backgroundColor: 'white', 
    borderRadius: 28, 
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 20,
    color: '#000'
  },
  input: { 
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12, 
    fontSize: 17, 
    marginBottom: 25,
    color: '#000'
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  cancelBtn: { 
    marginRight: 25,
  },
  addBtn: { 
    backgroundColor: '#000', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 14 
  },
  cancelText: { 
    color: '#FF3B30', 
    fontSize: 16,
    fontWeight: '600'
  },
  addText: { 
    color: 'white', 
    fontWeight: '700', 
    fontSize: 16 
  }
});
