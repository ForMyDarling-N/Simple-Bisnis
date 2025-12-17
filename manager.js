// REAL-TIME Manager dengan Firebase Realtime Database NYATA
class RealTimeManagerReal {
  constructor() {
    this.connected = false;
    this.userId = null;
    this.userData = null;
    this.isAdmin = false;
    
    this.quests = [];
    this.markers = [];
    this.transactions = [];
    this.reports = [];
    
    this.init();
  }
  
  async init() {
    console.log('🚀 Initializing REAL-TIME Manager...');
    
    // Setup connection status
    this.setupConnectionStatus();
    
    // Setup auth state listener
    realAuth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userId = user.uid;
        await this.loadUserData(user.uid);
        this.setupRealTimeListeners();
        this.connected = true;
        this.updateConnectionStatus('connected', '✅ Connected');
      } else {
        this.connected = false;
        this.userId = null;
        this.updateConnectionStatus('disconnected', '❌ Disconnected');
      }
    });
    
    // Setup online status
    this.setupOnlineStatus();
  }
  
  async loadUserData(uid) {
    try {
      const userRef = realDatabase.ref(`users/${uid}`);
      const snapshot = await userRef.once('value');
      this.userData = snapshot.val();
      
      // Check admin status
      this.isAdmin = this.userData?.role === 'admin' || this.userData?.role === 'owner';
      
      console.log('👤 User data loaded:', this.userData?.email);
      console.log('🛡️ Admin status:', this.isAdmin);
      
    } catch (error) {
      console.error('❌ Load user data error:', error);
    }
  }
  
  setupRealTimeListeners() {
    console.log('👂 Setting up REAL-TIME listeners...');
    
    // REAL-TIME Quest Listener
    realDatabase.ref('quests').on('value', (snapshot) => {
      const questsData = snapshot.val();
      if (questsData) {
        this.quests = Object.entries(questsData).map(([id, quest]) => ({
          id,
          ...quest
        }));
        
        // Update UI
        if (typeof renderQuestsReal === 'function') {
          renderQuestsReal(this.quests);
        }
        
        console.log(`📝 Quests updated: ${this.quests.length} items`);
      }
    });
    
    // REAL-TIME Marker Listener
    realDatabase.ref('markers').on('value', (snapshot) => {
      const markersData = snapshot.val();
      if (markersData) {
        this.markers = Object.entries(markersData).map(([id, marker]) => ({
          id,
          ...marker
        }));
        
        // Update UI
        if (typeof renderMarkersReal === 'function') {
          renderMarkersReal(this.markers);
        }
        
        // Update map
        if (typeof updateMapMarkersReal === 'function') {
          updateMapMarkersReal(this.markers);
        }
        
        console.log(`📍 Markers updated: ${this.markers.length} items`);
      }
    });
    
    // REAL-TIME User Transactions
    if (this.userId) {
      realDatabase.ref(`transactions/${this.userId}`).on('value', (snapshot) => {
        const transData = snapshot.val();
        if (transData) {
          this.transactions = Object.entries(transData).map(([id, trans]) => ({
            id,
            ...trans
          }));
          
          console.log(`💰 Transactions updated: ${this.transactions.length} items`);
        }
      });
    }
    
    // Admin listeners
    if (this.isAdmin) {
      this.setupAdminListeners();
    }
  }
  
  setupAdminListeners() {
    console.log('🛡️ Setting up ADMIN listeners...');
    
    // All transactions
    realDatabase.ref('transactions').on('value', (snapshot) => {
      const allTrans = snapshot.val();
      // Process admin transactions
    });
    
    // All reports
    realDatabase.ref('reports').on('value', (snapshot) => {
      const reportsData = snapshot.val();
      if (reportsData) {
        this.reports = Object.entries(reportsData).map(([id, report]) => ({
          id,
          ...report
        }));
      }
    });
  }
  
  setupOnlineStatus() {
    if (!this.userId) return;
    
    const userStatusRef = realDatabase.ref(`status/${this.userId}`);
    const connectedRef = realDatabase.ref('.info/connected');
    
    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        // User online
        userStatusRef.set({
          online: true,
          lastSeen: Date.now(),
          userAgent: navigator.userAgent
        });
        
        // Remove on disconnect
        userStatusRef.onDisconnect().set({
          online: false,
          lastSeen: Date.now()
        });
      }
    });
    
    // Online users count
    realDatabase.ref('status').on('value', (snapshot) => {
      const statusData = snapshot.val();
      if (statusData) {
        const onlineUsers = Object.values(statusData).filter(u => u.online).length;
        this.updateOnlineUsers(onlineUsers);
      }
    });
  }
  
  setupConnectionStatus() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'realConnectionStatus';
    statusDiv.className = 'connection-status disconnected';
    statusDiv.innerHTML = `
      <i class="fas fa-plug"></i>
      <span>Connecting to Firebase...</span>
    `;
    document.body.appendChild(statusDiv);
    
    // Online users count
    const usersDiv = document.createElement('div');
    usersDiv.id = 'realOnlineUsers';
    usersDiv.className = 'user-count';
    usersDiv.innerHTML = `
      <i class="fas fa-users"></i>
      <span>0 online</span>
    `;
    document.body.appendChild(usersDiv);
  }
  
  updateConnectionStatus(status, message) {
    const statusEl = document.getElementById('realConnectionStatus');
    if (statusEl) {
      statusEl.className = `connection-status ${status}`;
      statusEl.innerHTML = `
        <i class="fas fa-${status === 'connected' ? 'wifi' : 'plug-circle-exclamation'}"></i>
        <span>${message}</span>
      `;
    }
  }
  
  updateOnlineUsers(count) {
    const usersEl = document.getElementById('realOnlineUsers');
    if (usersEl) {
      usersEl.innerHTML = `
        <i class="fas fa-users"></i>
        <span>${count} online</span>
      `;
    }
  }
  
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `realtime-notification ${type}`;
    
    let icon = 'fas fa-info-circle';
    if (type === 'success') icon = 'fas fa-check-circle';
    if (type === 'error') icon = 'fas fa-exclamation-circle';
    if (type === 'warning') icon = 'fas fa-exclamation-triangle';
    
    notification.innerHTML = `
      <i class="${icon}"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
  
  // CRUD Operations REAL
  
  async addQuestReal(questData) {
    try {
      if (!this.userId) {
        throw new Error('Harap login terlebih dahulu');
      }
      
      const questWithMeta = {
        ...questData,
        userId: this.userId,
        userEmail: this.userData?.email || 'Unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'open',
        applicants: 0,
        views: 0
      };
      
      const newQuestRef = realDatabase.ref('quests').push();
      await newQuestRef.set(questWithMeta);
      
      // Update user stats
      await this.updateUserStats('questsPosted', 1);
      
      this.showNotification('Quest berhasil diposting!', 'success');
      
      return {
        success: true,
        id: newQuestRef.key,
        ...questWithMeta
      };
      
    } catch (error) {
      console.error('❌ Add quest error:', error);
      this.showNotification('Gagal post quest: ' + error.message, 'error');
      return { success: false, message: error.message };
    }
  }
  
  async addMarkerReal(markerData) {
    try {
      if (!this.userId) {
        throw new Error('Harap login terlebih dahulu');
      }
      
      const markerWithMeta = {
        ...markerData,
        userId: this.userId,
        userEmail: this.userData?.email || 'Unknown',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        verification: {
          community: {
            confirmed: 0,
            fake: 0,
            unsure: 0
          },
          adminVerified: false,
          credibility: 50
        },
        reports: 0,
        media: []
      };
      
      const newMarkerRef = realDatabase.ref('markers').push();
      await newMarkerRef.set(markerWithMeta);
      
      // Update user stats
      await this.updateUserStats('markersPosted', 1);
      
      this.showNotification('Marker berhasil ditambahkan!', 'success');
      
      return {
        success: true,
        id: newMarkerRef.key,
        ...markerWithMeta
      };
      
    } catch (error) {
      console.error('❌ Add marker error:', error);
      this.showNotification('Gagal tambah marker: ' + error.message, 'error');
      return { success: false, message: error.message };
    }
  }
  
  async updateUserStats(field, increment = 1) {
    try {
      const userRef = realDatabase.ref(`users/${this.userId}`);
      const snapshot = await userRef.once('value');
      const currentData = snapshot.val();
      
      const currentValue = currentData?.stats?.[field] || 0;
      const newValue = currentValue + increment;
      
      await userRef.child(`stats/${field}`).set(newValue);
      
    } catch (error) {
      console.error('❌ Update user stats error:', error);
    }
  }
  
  async voteMarkerReal(markerId, voteType) {
    try {
      if (!this.userId) {
        throw new Error('Harap login untuk vote');
      }
      
      // Cek sudah vote belum
      const voteKey = `vote_${this.userId}_${markerId}`;
      if (localStorage.getItem(voteKey)) {
        throw new Error('Anda sudah vote marker ini');
      }
      
      // Update vote di database
      const voteRef = realDatabase.ref(`markers/${markerId}/verification/community/${voteType}`);
      const snapshot = await voteRef.once('value');
      const currentVotes = snapshot.val() || 0;
      
      await voteRef.set(currentVotes + 1);
      
      // Simpan di localStorage
      localStorage.setItem(voteKey, voteType);
      
      // Update credibility score
      await this.updateMarkerCredibility(markerId);
      
      // Update user reputation
      await this.updateUserReputation(2);
      
      this.showNotification('Vote berhasil!', 'success');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Vote error:', error);
      this.showNotification(error.message, 'error');
      return { success: false, message: error.message };
    }
  }
  
  async updateMarkerCredibility(markerId) {
    try {
      const markerRef = realDatabase.ref(`markers/${markerId}`);
      const snapshot = await markerRef.once('value');
      const markerData = snapshot.val();
      
      if (!markerData) return;
      
      const community = markerData.verification?.community || { confirmed: 0, fake: 0, unsure: 0 };
      const totalVotes = community.confirmed + community.fake + community.unsure;
      
      if (totalVotes === 0) return;
      
      let credibility = 50;
      const confirmedRatio = community.confirmed / totalVotes;
      
      if (confirmedRatio > 0.7) {
        credibility = 80 + (confirmedRatio * 20);
      } else if (confirmedRatio > 0.4) {
        credibility = 40 + (confirmedRatio * 40);
      } else {
        credibility = 20 + (confirmedRatio * 20);
      }
      
      credibility = Math.max(0, Math.min(100, Math.round(credibility)));
      
      await markerRef.child('verification/credibility').set(credibility);
      
    } catch (error) {
      console.error('❌ Update credibility error:', error);
    }
  }
  
  async updateUserReputation(points) {
    try {
      const userRef = realDatabase.ref(`users/${this.userId}`);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
      
      const currentRep = userData?.reputation || 50;
      const newRep = Math.max(0, Math.min(100, currentRep + points));
      
      await userRef.child('reputation').set(newRep);
      
    } catch (error) {
      console.error('❌ Update reputation error:', error);
    }
  }
}

// Initialize REAL-TIME Manager
const realTimeManager = new RealTimeManagerReal();
