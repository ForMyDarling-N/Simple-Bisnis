const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Data storage dengan auto-save yang lebih agresif
class DataStore {
  constructor() {
    this.dataPath = path.join(__dirname, 'data.json');
    this.data = {
      quests: [],
      markers: [],
      customCategories: ['design', 'programming', 'marketing', 'writing', 'other'],
      analytics: {
        totalConnections: 0,
        lastUpdated: new Date().toISOString()
      }
    };
    this.loadData();
    
    // Auto-save setiap 10 detik
    setInterval(() => this.saveData(), 10000);
    
    // Auto-save juga setiap ada perubahan
    this.autoSaveTimeout = null;
  }
  
  loadData() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const rawData = fs.readFileSync(this.dataPath, 'utf8');
        const savedData = JSON.parse(rawData);
        
        // Merge dengan data default
        this.data.quests = savedData.quests || [];
        this.data.markers = savedData.markers || [];
        this.data.customCategories = savedData.customCategories || this.data.customCategories;
        this.data.analytics = savedData.analytics || this.data.analytics;
        
        console.log(`📂 Data loaded: ${this.data.quests.length} quests, ${this.data.markers.length} markers`);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  }
  
  saveData() {
    try {
      this.data.analytics.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
      console.log('💾 Data saved to file');
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }
  
  scheduleSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    this.autoSaveTimeout = setTimeout(() => this.saveData(), 1000);
  }
  
  // Quest methods
  addQuest(quest) {
    quest.id = Date.now() + Math.random();
    quest.createdAt = new Date().toISOString();
    this.data.quests.unshift(quest);
    this.scheduleSave();
    return quest;
  }
  
  updateQuest(id, updates) {
    const quest = this.data.quests.find(q => q.id === id);
    if (quest) {
      Object.assign(quest, updates);
      quest.updatedAt = new Date().toISOString();
      this.scheduleSave();
      return quest;
    }
    return null;
  }
  
  deleteQuest(id) {
    const index = this.data.quests.findIndex(q => q.id === id);
    if (index !== -1) {
      const deleted = this.data.quests.splice(index, 1)[0];
      this.scheduleSave();
      return deleted;
    }
    return null;
  }
  
  // Marker methods
  addMarker(marker) {
    marker.id = Date.now() + Math.random();
    marker.createdAt = new Date().toISOString();
    this.data.markers.unshift(marker);
    this.scheduleSave();
    return marker;
  }
  
  deleteMarker(id) {
    const index = this.data.markers.findIndex(m => m.id === id);
    if (index !== -1) {
      const deleted = this.data.markers.splice(index, 1)[0];
      this.scheduleSave();
      return deleted;
    }
    return null;
  }
  
  // Category methods
  addCategory(name) {
    if (!this.data.customCategories.includes(name)) {
      this.data.customCategories.push(name);
      this.scheduleSave();
      return name;
    }
    return null;
  }
  
  deleteCategory(name) {
    const index = this.data.customCategories.indexOf(name);
    if (index !== -1) {
      const deleted = this.data.customCategories.splice(index, 1)[0];
      this.scheduleSave();
      return deleted;
    }
    return null;
  }
  
  // Clear methods
  clearAllQuests() {
    this.data.quests = [];
    this.scheduleSave();
    return true;
  }
  
  clearAllMarkers() {
    this.data.markers = [];
    this.scheduleSave();
    return true;
  }
  
  // Stats
  getStats() {
    const today = new Date().toDateString();
    const markersToday = this.data.markers.filter(m => {
      const markerDate = new Date(m.createdAt).toDateString();
      return markerDate === today;
    }).length;
    
    return {
      totalQuests: this.data.quests.length,
      totalMarkers: this.data.markers.length,
      questsOpen: this.data.quests.filter(q => q.status === 'open').length,
      questsTaken: this.data.quests.filter(q => q.status === 'taken').length,
      activeUsers: new Set(this.data.quests.map(q => q.user)).size,
      markersToday: markersToday,
      customCategories: this.data.customCategories.length,
      lastUpdated: this.data.analytics.lastUpdated
    };
  }
  
  // Get all data
  getAllData() {
    return {
      quests: this.data.quests,
      markers: this.data.markers,
      customCategories: this.data.customCategories
    };
  }
}

// Initialize data store
const dataStore = new DataStore();

// User tracking
const connectedUsers = new Map();
const adminSockets = new Set();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints
app.get('/api/data', (req, res) => {
  res.json(dataStore.getAllData());
});

app.get('/api/stats', (req, res) => {
  res.json(dataStore.getStats());
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔗 New connection:', socket.id);
  
  // Track user
  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date().toISOString(),
    userAgent: socket.handshake.headers['user-agent']
  });
  
  dataStore.data.analytics.totalConnections++;
  
  // Check if admin
  const isAdmin = socket.handshake.headers.referer?.includes('/admin') ||
                  socket.handshake.headers.referer?.includes('?admin=true') ||
                  socket.handshake.headers.referer?.includes('#admin');
  
  if (isAdmin) {
    adminSockets.add(socket.id);
    console.log('🛡️  Admin connected:', socket.id);
  }
  
  // Send initial data
  socket.emit('initialData', {
    ...dataStore.getAllData(),
    isAdmin: isAdmin,
    connectionId: socket.id
  });
  
  // Broadcast user count
  io.emit('userCount', connectedUsers.size);
  
  // Handle quest operations
  socket.on('addQuest', (questData) => {
    try {
      const newQuest = dataStore.addQuest(questData);
      console.log('➕ Quest added:', newQuest.title);
      
      // Broadcast to all clients
      io.emit('questAdded', newQuest);
      
      // Notify admins
      adminSockets.forEach(adminId => {
        io.to(adminId).emit('adminNotification', {
          type: 'quest_added',
          message: `Quest baru: "${newQuest.title}"`,
          data: newQuest,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Error adding quest:', error);
      socket.emit('error', { message: 'Failed to add quest' });
    }
  });
  
  socket.on('updateQuest', ({ id, status }) => {
    try {
      const updatedQuest = dataStore.updateQuest(id, { status });
      if (updatedQuest) {
        console.log('✏️ Quest updated:', updatedQuest.title, '->', status);
        io.emit('questUpdated', updatedQuest);
      }
    } catch (error) {
      console.error('Error updating quest:', error);
    }
  });
  
  socket.on('deleteQuest', (questId) => {
    try {
      const deletedQuest = dataStore.deleteQuest(questId);
      if (deletedQuest) {
        console.log('🗑️ Quest deleted:', deletedQuest.title);
        io.emit('questDeleted', questId);
      }
    } catch (error) {
      console.error('Error deleting quest:', error);
    }
  });
  
  // Handle marker operations
  socket.on('addMarker', (markerData) => {
    try {
      const newMarker = dataStore.addMarker(markerData);
      console.log('📍 Marker added:', newMarker.title);
      
      io.emit('markerAdded', newMarker);
      
      adminSockets.forEach(adminId => {
        io.to(adminId).emit('adminNotification', {
          type: 'marker_added',
          message: `Marker baru: "${newMarker.title}"`,
          data: newMarker,
          timestamp: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error('Error adding marker:', error);
    }
  });
  
  socket.on('deleteMarker', (markerId) => {
    try {
      const deletedMarker = dataStore.deleteMarker(markerId);
      if (deletedMarker) {
        console.log('🗑️ Marker deleted:', deletedMarker.title);
        io.emit('markerDeleted', markerId);
      }
    } catch (error) {
      console.error('Error deleting marker:', error);
    }
  });
  
  // Clear all operations
  socket.on('clearAllQuests', () => {
    try {
      dataStore.clearAllQuests();
      console.log('🔥 All quests cleared');
      io.emit('allQuestsCleared');
    } catch (error) {
      console.error('Error clearing quests:', error);
    }
  });
  
  socket.on('clearAllMarkers', () => {
    try {
      dataStore.clearAllMarkers();
      console.log('🔥 All markers cleared');
      io.emit('allMarkersCleared');
    } catch (error) {
      console.error('Error clearing markers:', error);
    }
  });
  
  // Category operations
  socket.on('addCategory', (categoryName) => {
    try {
      const added = dataStore.addCategory(categoryName);
      if (added) {
        console.log('🏷️ Category added:', categoryName);
        io.emit('categoryAdded', categoryName);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  });
  
  socket.on('deleteCategory', (categoryName) => {
    try {
      const deleted = dataStore.deleteCategory(categoryName);
      if (deleted) {
        console.log('🗑️ Category deleted:', categoryName);
        io.emit('categoryDeleted', categoryName);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  });
  
  // Admin stats
  socket.on('getAdminStats', () => {
    const stats = dataStore.getStats();
    socket.emit('adminStats', {
      ...stats,
      connectedUsers: connectedUsers.size,
      adminCount: adminSockets.size
    });
  });
  
  // Ping/pong for connection monitoring
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    adminSockets.delete(socket.id);
    io.emit('userCount', connectedUsers.size);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
  ============================================
  🚀 SIMPLE BISNIS REAL-TIME SERVER
  ============================================
  Port: ${PORT}
  Local: http://localhost:${PORT}
  Admin: http://localhost:${PORT}/admin
  
  ✅ Data persistence: ENABLED
  ✅ Auto-save: EVERY 10 SECONDS
  ✅ Real-time: SOCKET.IO
  ✅ Multi-user: UNLIMITED
  ============================================
  `);
});
