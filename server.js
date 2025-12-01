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

// Data storage in memory (will persist while server is running)
let quests = [];
let markers = [];
let customCategories = ['design', 'programming', 'marketing', 'writing', 'other'];
let connectedUsers = new Map(); // socket.id -> user info
let adminSockets = new Set(); // socket ids that are admin

// File for data persistence
const DATA_FILE = path.join(__dirname, 'data.json');

// Load data from file if exists
function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      quests = data.quests || [];
      markers = data.markers || [];
      customCategories = data.customCategories || customCategories;
      console.log('Data loaded from file:', {
        quests: quests.length,
        markers: markers.length,
        categories: customCategories.length
      });
    }
  } catch (error) {
    console.error('Error loading data file:', error);
  }
}

// Save data to file
function saveDataToFile() {
  try {
    const data = {
      quests,
      markers,
      customCategories,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Data saved to file');
  } catch (error) {
    console.error('Error saving data file:', error);
  }
}

// Auto-save every 30 seconds
setInterval(saveDataToFile, 30000);

// Load initial data
loadDataFromFile();

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoints for backup
app.get('/api/data', (req, res) => {
  res.json({
    quests,
    markers,
    customCategories,
    connectedUsers: connectedUsers.size,
    serverTime: new Date().toISOString()
  });
});

app.get('/api/stats', (req, res) => {
  const today = new Date().toDateString();
  const markersToday = markers.filter(m => {
    const markerDate = new Date(m.createdAt || Date.now()).toDateString();
    return markerDate === today;
  }).length;
  
  res.json({
    totalQuests: quests.length,
    totalMarkers: markers.length,
    questsOpen: quests.filter(q => q.status === 'open').length,
    questsTaken: quests.filter(q => q.status === 'taken').length,
    activeUsers: new Set(quests.map(q => q.user)).size,
    markersToday: markersToday,
    connectedUsers: connectedUsers.size,
    onlineAdmins: adminSockets.size
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // Add user to connected list
  connectedUsers.set(socket.id, {
    id: socket.id,
    connectedAt: new Date().toISOString(),
    isAdmin: false
  });
  
  // Check if user is admin (based on URL)
  const isAdmin = socket.handshake.headers.referer?.includes('/admin') || 
                  socket.handshake.headers.referer?.includes('?admin=true') ||
                  socket.handshake.headers.referer?.includes('#admin');
  
  if (isAdmin) {
    adminSockets.add(socket.id);
    const user = connectedUsers.get(socket.id);
    if (user) user.isAdmin = true;
    console.log('Admin connected:', socket.id);
  }
  
  // Send initial data to new client
  socket.emit('initialData', {
    quests,
    markers,
    customCategories,
    connectedUsers: Array.from(connectedUsers.values()),
    isAdmin: isAdmin
  });
  
  // Broadcast user count to all
  io.emit('userCount', connectedUsers.size);
  
  // Handle quest operations
  socket.on('addQuest', (questData) => {
    const newQuest = {
      id: Date.now() + Math.random(), // Unique ID
      ...questData,
      status: 'open',
      createdAt: new Date().toISOString(),
      socketId: socket.id
    };
    
    quests.unshift(newQuest); // Add to beginning
    console.log('Quest added:', newQuest.title);
    
    // Broadcast to all clients
    io.emit('questAdded', newQuest);
    
    // Notify admins
    adminSockets.forEach(adminId => {
      io.to(adminId).emit('adminNotification', {
        type: 'quest_added',
        message: `Quest baru: ${newQuest.title}`,
        quest: newQuest
      });
    });
    
    // Auto-save
    saveDataToFile();
  });
  
  socket.on('updateQuest', ({ id, status }) => {
    const questIndex = quests.findIndex(q => q.id === id);
    if (questIndex !== -1) {
      quests[questIndex].status = status;
      quests[questIndex].updatedAt = new Date().toISOString();
      
      console.log('Quest updated:', quests[questIndex].title, '->', status);
      
      // Broadcast to all clients
      io.emit('questUpdated', quests[questIndex]);
      
      // Auto-save
      saveDataToFile();
    }
  });
  
  socket.on('deleteQuest', (questId) => {
    const questIndex = quests.findIndex(q => q.id === questId);
    if (questIndex !== -1) {
      const deletedQuest = quests.splice(questIndex, 1)[0];
      console.log('Quest deleted:', deletedQuest.title);
      
      // Broadcast to all clients
      io.emit('questDeleted', questId);
      
      // Auto-save
      saveDataToFile();
    }
  });
  
  // Handle marker operations
  socket.on('addMarker', (markerData) => {
    const newMarker = {
      id: Date.now() + Math.random(), // Unique ID
      ...markerData,
      createdAt: new Date().toISOString(),
      socketId: socket.id
    };
    
    markers.unshift(newMarker); // Add to beginning
    console.log('Marker added:', newMarker.title);
    
    // Broadcast to all clients
    io.emit('markerAdded', newMarker);
    
    // Notify admins
    adminSockets.forEach(adminId => {
      io.to(adminId).emit('adminNotification', {
        type: 'marker_added',
        message: `Marker baru: ${newMarker.title}`,
        marker: newMarker
      });
    });
    
    // Auto-save
    saveDataToFile();
  });
  
  socket.on('deleteMarker', (markerId) => {
    const markerIndex = markers.findIndex(m => m.id === markerId);
    if (markerIndex !== -1) {
      const deletedMarker = markers.splice(markerIndex, 1)[0];
      console.log('Marker deleted:', deletedMarker.title);
      
      // Broadcast to all clients
      io.emit('markerDeleted', markerId);
      
      // Auto-save
      saveDataToFile();
    }
  });
  
  socket.on('clearAllMarkers', () => {
    markers = [];
    console.log('All markers cleared by admin');
    
    // Broadcast to all clients
    io.emit('allMarkersCleared');
    
    // Auto-save
    saveDataToFile();
  });
  
  socket.on('clearAllQuests', () => {
    quests = [];
    console.log('All quests cleared by admin');
    
    // Broadcast to all clients
    io.emit('allQuestsCleared');
    
    // Auto-save
    saveDataToFile();
  });
  
  // Handle category operations
  socket.on('addCategory', (categoryName) => {
    if (!customCategories.includes(categoryName)) {
      customCategories.push(categoryName);
      console.log('Category added:', categoryName);
      
      // Broadcast to all clients
      io.emit('categoryAdded', categoryName);
      
      // Auto-save
      saveDataToFile();
    }
  });
  
  socket.on('deleteCategory', (categoryName) => {
    const index = customCategories.indexOf(categoryName);
    if (index !== -1) {
      customCategories.splice(index, 1);
      console.log('Category deleted:', categoryName);
      
      // Broadcast to all clients
      io.emit('categoryDeleted', categoryName);
      
      // Auto-save
      saveDataToFile();
    }
  });
  
  // Admin operations
  socket.on('getAdminStats', () => {
    const today = new Date().toDateString();
    const markersToday = markers.filter(m => {
      const markerDate = new Date(m.createdAt || Date.now()).toDateString();
      return markerDate === today;
    }).length;
    
    const stats = {
      totalQuests: quests.length,
      totalMarkers: markers.length,
      questsOpen: quests.filter(q => q.status === 'open').length,
      questsTaken: quests.filter(q => q.status === 'taken').length,
      activeUsers: new Set(quests.map(q => q.user)).size,
      markersToday: markersToday,
      connectedUsers: connectedUsers.size,
      customCategories: customCategories.length,
      serverUptime: process.uptime(),
      serverTime: new Date().toISOString()
    };
    
    socket.emit('adminStats', stats);
  });
  
  // Chat message
  socket.on('sendChatMessage', (messageData) => {
    const message = {
      id: Date.now(),
      ...messageData,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    };
    
    // Broadcast to all clients
    io.emit('newChatMessage', message);
  });
  
  // User typing
  socket.on('userTyping', (username) => {
    socket.broadcast.emit('userTyping', { username, socketId: socket.id });
  });
  
  socket.on('userStoppedTyping', () => {
    socket.broadcast.emit('userStoppedTyping', socket.id);
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    adminSockets.delete(socket.id);
    
    // Broadcast updated user count
    io.emit('userCount', connectedUsers.size);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
  ============================================
  SIMPLE BISNIS - CYBER NETWORK REAL-TIME
  ============================================
  Server running on port: ${PORT}
  
  Local:  http://localhost:${PORT}
  Admin:  http://localhost:${PORT}/admin
  Stats:  http://localhost:${PORT}/api/stats
  
  FEATURES:
  ✅ Real-time dengan Socket.io
  ✅ Data tidak hilang saat refresh server
  ✅ Semua user lihat perubahan langsung
  ✅ Admin bisa kontrol dari mana saja
  ✅ Auto-save ke file setiap 30 detik
  ============================================
  `);
});
