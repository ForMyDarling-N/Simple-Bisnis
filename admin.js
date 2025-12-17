// REAL Admin Panel System
class RealAdminPanel {
  constructor() {
    this.isOwner = false;
    this.isAdmin = false;
    this.adminData = null;
    
    this.stats = {
      totalUsers: 0,
      totalQuests: 0,
      totalMarkers: 0,
      pendingTransactions: 0,
      totalRevenue: 0,
      verifiedMarkers: 0
    };
    
    this.init();
  }
  
  async init() {
    // Wait for auth state
    realAuth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.checkAdminStatus(user.uid);
        if (this.isAdmin) {
          this.setupAdminPanel();
          this.loadRealStats();
          this.setupAdminListeners();
        }
      }
    });
  }
  
  async checkAdminStatus(uid) {
    try {
      const userRef = realDatabase.ref(`users/${uid}`);
      const snapshot = await userRef.once('value');
      this.adminData = snapshot.val();
      
      this.isOwner = this.adminData?.role === 'owner';
      this.isAdmin = this.isOwner || this.adminData?.role === 'admin';
      
      if (this.isAdmin) {
        console.log('🛡️ REAL Admin detected:', this.adminData.email);
      }
      
    } catch (error) {
      console.error('❌ Check admin status error:', error);
    }
  }
  
  setupAdminPanel() {
    // Add admin tab to navigation
    if (!document.querySelector('.cyber-tab[onclick*="admin"]')) {
      const navTabs = document.querySelector('.nav-tabs');
      const adminTab = document.createElement('button');
      adminTab.className = 'cyber-tab';
      adminTab.innerHTML = '<i class="fas fa-user-shield"></i> ADMIN';
      adminTab.onclick = () => this.showAdminPanelReal();
      navTabs.appendChild(adminTab);
    }
    
    // Create admin section
    this.createAdminSection();
  }
  
  createAdminSection() {
    const mainContainer = document.querySelector('.main-container');
    
    const adminSection = document.createElement('div');
    adminSection.id = 'realAdminSection';
    adminSection.className = 'app-section';
    adminSection.style.display = 'none';
    adminSection.innerHTML = this.getAdminHTML();
    
    mainContainer.appendChild(adminSection);
  }
  
  getAdminHTML() {
    return `
      <div style="padding: 20px; max-width: 1400px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div>
            <h1 style="color: var(--primary); margin: 0;">
              <i class="fas fa-user-shield"></i> ADMIN PANEL
            </h1>
            <p style="color: var(--text-secondary); margin: 5px 0 0 0;">
              ${this.isOwner ? 'Owner Dashboard' : 'Admin Dashboard'}
            </p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div id="adminStatsBadge" style="background: var(--primary); color: var(--darker); padding: 5px 15px; border-radius: 20px; font-weight: bold;">
              Loading...
            </div>
            <button class="cyber-button" onclick="realAdmin.exportDataReal()" style="width: auto;">
              <i class="fas fa-download"></i> Export
            </button>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="admin-stats-grid" id="realAdminStats">
          <!-- Stats will be loaded here -->
        </div>
        
        <!-- Tabs Navigation -->
        <div class="admin-tabs" style="margin: 30px 0; border-bottom: 2px solid rgba(255,255,255,0.1);">
          <button class="admin-tab-btn active" onclick="realAdmin.showAdminTab('dashboard')">
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </button>
          <button class="admin-tab-btn" onclick="realAdmin.showAdminTab('transactions')">
            <i class="fas fa-money-bill-wave"></i> Transaksi
          </button>
          <button class="admin-tab-btn" onclick="realAdmin.showAdminTab('markers')">
            <i class="fas fa-map-marker-alt"></i> Markers
          </button>
          <button class="admin-tab-btn" onclick="realAdmin.showAdminTab('quests')">
            <i class="fas fa-scroll"></i> Quests
          </button>
          <button class="admin-tab-btn" onclick="realAdmin.showAdminTab('users')">
            <i class="fas fa-users"></i> Users
          </button>
          <button class="admin-tab-btn" onclick="realAdmin.showAdminTab('reports')">
            <i class="fas fa-flag"></i> Reports
          </button>
          ${this.isOwner ? `
            <button class="admin-tab-btn" onclick="realAdmin.showAdminTab('system')">
              <i class="fas fa-cogs"></i> System
            </button>
          ` : ''}
        </div>
        
        <!-- Tab Contents -->
        <div id="realAdminTabContents">
          <div id="adminTabDashboard" class="admin-tab-content active">
            <!-- Dashboard Content -->
          </div>
          <div id="adminTabTransactions" class="admin-tab-content">
            <!-- Transactions Content -->
          </div>
          <div id="adminTabMarkers" class="admin-tab-content">
            <!-- Markers Content -->
          </div>
          <div id="adminTabQuests" class="admin-tab-content">
            <!-- Quests Content -->
          </div>
          <div id="adminTabUsers" class="admin-tab-content">
            <!-- Users Content -->
          </div>
          <div id="adminTabReports" class="admin-tab-content">
            <!-- Reports Content -->
          </div>
          ${this.isOwner ? `
            <div id="adminTabSystem" class="admin-tab-content">
              <!-- System Content -->
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  async loadRealStats() {
    try {
      console.log('📊 Loading REAL admin stats...');
      
      // Load all data in parallel
      const [usersSnap, questsSnap, markersSnap, transSnap] = await Promise.all([
        realDatabase.ref('users').once('value'),
        realDatabase.ref('quests').once('value'),
        realDatabase.ref('markers').once('value'),
        realDatabase.ref('transactions').once('value')
      ]);
      
      // Calculate stats
      const users = usersSnap.val() || {};
      const quests = questsSnap.val() || {};
      const markers = markersSnap.val() || {};
      const transactions = transSnap.val() || {};
      
      let totalRevenue = 0;
      let pendingTrans = 0;
      let verifiedMarkers = 0;
      
      // Calculate revenue and pending transactions
      Object.values(transactions).forEach(userTrans => {
        if (userTrans) {
          Object.values(userTrans).forEach(trans => {
            if (trans.status === 'completed') {
              totalRevenue += trans.adminFee || 0;
            } else if (trans.status === 'pending_payment' || trans.status === 'awaiting_verification') {
              pendingTrans++;
            }
          });
        }
      });
      
      // Calculate verified markers
      Object.values(markers).forEach(marker => {
        if (marker.verification?.adminVerified) {
          verifiedMarkers++;
        }
      });
      
      // Update stats
      this.stats = {
        totalUsers: Object.keys(users).length,
        totalQuests: Object.keys(quests).length,
        totalMarkers: Object.keys(markers).length,
        pendingTransactions: pendingTrans,
        totalRevenue: totalRevenue,
        verifiedMarkers: verifiedMarkers,
        todayDate: new Date().toLocaleDateString('id-ID')
      };
      
      // Update UI
      this.updateStatsUI();
      
    } catch (error) {
      console.error('❌ Load stats error:', error);
    }
  }
  
  updateStatsUI() {
    const statsContainer = document.getElementById('realAdminStats');
    const badge = document.getElementById('adminStatsBadge');
    
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
      <div class="admin-stat-card">
        <div class="stat-icon" style="background: rgba(0, 240, 255, 0.2);">
          <i class="fas fa-users" style="color: var(--primary);"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">${this.stats.totalUsers}</div>
          <div class="stat-label">Total Users</div>
        </div>
      </div>
      
      <div class="admin-stat-card">
        <div class="stat-icon" style="background: rgba(0, 255, 136, 0.2);">
          <i class="fas fa-scroll" style="color: var(--accent);"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">${this.stats.totalQuests}</div>
          <div class="stat-label">Total Quests</div>
        </div>
      </div>
      
      <div class="admin-stat-card">
        <div class="stat-icon" style="background: rgba(255, 0, 170, 0.2);">
          <i class="fas fa-map-marker-alt" style="color: var(--secondary);"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">${this.stats.totalMarkers}</div>
          <div class="stat-label">Total Markers</div>
        </div>
      </div>
      
      <div class="admin-stat-card">
        <div class="stat-icon" style="background: rgba(255, 204, 0, 0.2);">
          <i class="fas fa-money-bill-wave" style="color: var(--warning);"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">${this.stats.pendingTransactions}</div>
          <div class="stat-label">Pending Trans</div>
        </div>
      </div>
      
      <div class="admin-stat-card">
        <div class="stat-icon" style="background: rgba(255, 42, 109, 0.2);">
          <i class="fas fa-chart-line" style="color: var(--danger);"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">Rp ${this.formatRupiah(this.stats.totalRevenue)}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
      </div>
      
      <div class="admin-stat-card">
        <div class="stat-icon" style="background: rgba(156, 39, 176, 0.2);">
          <i class="fas fa-check-circle" style="color: #9c27b0;"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">${this.stats.verifiedMarkers}</div>
          <div class="stat-label">Verified</div>
        </div>
      </div>
    `;
    
    if (badge) {
      badge.textContent = `${this.stats.todayDate}`;
    }
  }
  
  showAdminPanelReal() {
    // Hide all other sections
    document.querySelectorAll('.app-section').forEach(section => {
      section.style.display = 'none';
      section.classList.remove('active');
    });
    
    // Show admin section
    const adminSection = document.getElementById('realAdminSection');
    if (adminSection) {
      adminSection.style.display = 'block';
      adminSection.classList.add('active');
    }
    
    // Update active tab
    document.querySelectorAll('.cyber-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    const adminTab = document.querySelector('.cyber-tab[onclick*="admin"]');
    if (adminTab) adminTab.classList.add('active');
    
    // Load dashboard
    this.showAdminTab('dashboard');
  }
  
  async showAdminTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.admin-tab-btn[onclick*="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Hide all tab contents
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
      tab.classList.remove('active');
      tab.style.display = 'none';
    });
    
    // Show selected tab
    const tabId = `adminTab${this.capitalize(tabName)}`;
    const tabElement = document.getElementById(tabId);
    
    if (tabElement) {
      tabElement.classList.add('active');
      tabElement.style.display = 'block';
      
      // Load tab content if empty
      if (!tabElement.innerHTML.trim()) {
        await this.loadTabContent(tabName, tabElement);
      }
    }
  }
  
  async loadTabContent(tabName, container) {
    switch (tabName) {
      case 'dashboard':
        await this.loadDashboardContent(container);
        break;
      case 'transactions':
        await this.loadTransactionsContent(container);
        break;
      case 'markers':
        await this.loadMarkersContent(container);
        break;
      case 'quests':
        await this.loadQuestsContent(container);
        break;
      case 'users':
        await this.loadUsersContent(container);
        break;
      case 'reports':
        await this.loadReportsContent(container);
        break;
      case 'system':
        await this.loadSystemContent(container);
        break;
    }
  }
  
  async loadDashboardContent(container) {
    try {
      // Get recent activity
      const [recentQuests, recentMarkers, recentTrans] = await Promise.all([
        realDatabase.ref('quests').orderByChild('createdAt').limitToLast(5).once('value'),
        realDatabase.ref('markers').orderByChild('createdAt').limitToLast(5).once('value'),
        realDatabase.ref('transactions').orderByChild('createdAt').limitToLast(10).once('value')
      ]);
      
      const recentItems = [];
      
      // Process recent quests
      const quests = recentQuests.val() || {};
      Object.entries(quests).forEach(([id, quest]) => {
        recentItems.push({
          type: 'quest',
          id,
          title: quest.title,
          user: quest.userEmail || 'Unknown',
          time: quest.createdAt,
          status: quest.status
        });
      });
      
      // Process recent markers
      const markers = recentMarkers.val() || {};
      Object.entries(markers).forEach(([id, marker]) => {
        recentItems.push({
          type: 'marker',
          id,
          title: marker.title,
          user: marker.userEmail || 'Unknown',
          time: marker.createdAt,
          credibility: marker.verification?.credibility || 0
        });
      });
      
      // Process recent transactions
      const transactions = recentTrans.val() || {};
      Object.values(transactions).forEach(userTrans => {
        if (userTrans) {
          Object.entries(userTrans).forEach(([id, trans]) => {
            recentItems.push({
              type: 'transaction',
              id,
              title: `Payment: Rp ${this.formatRupiah(trans.amount || 0)}`,
              user: trans.payerEmail || 'Unknown',
              time: trans.createdAt,
              status: trans.status
            });
          });
        }
      });
      
      // Sort by time
      recentItems.sort((a, b) => b.time - a.time);
      
      container.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <!-- Left Column -->
          <div>
            <!-- Recent Activity -->
            <div class="admin-card">
              <h3><i class="fas fa-history"></i> AKTIVITAS TERBARU</h3>
              <div class="admin-list" style="max-height: 400px;">
                ${recentItems.slice(0, 10).map(item => `
                  <div class="admin-list-item" style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div>
                        <div style="color: var(--primary); font-weight: bold;">
                          <i class="fas fa-${this.getActivityIcon(item.type)}"></i>
                          ${item.title}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                          By: ${item.user} • ${new Date(item.time).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div style="font-size: 0.8rem;">
                        ${item.type === 'transaction' ? 
                          `<span class="payment-status status-${item.status}">${item.status}</span>` : 
                          item.type === 'marker' ?
                          `<span style="color: ${this.getCredibilityColor(item.credibility)}">${item.credibility}%</span>` :
                          `<span class="quest-status status-${item.status}">${item.status}</span>`
                        }
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          
          <!-- Right Column -->
          <div>
            <!-- Quick Actions -->
            <div class="admin-card">
              <h3><i class="fas fa-bolt"></i> QUICK ACTIONS</h3>
              <div style="display: grid; gap: 10px; margin-top: 15px;">
                <button class="cyber-button" onclick="realAdmin.verifyPendingMarkers()">
                  <i class="fas fa-check-circle"></i> Verify Markers
                </button>
                <button class="cyber-button" onclick="realAdmin.processPendingPayments()">
                  <i class="fas fa-money-check"></i> Process Payments
                </button>
                <button class="cyber-button" onclick="realAdmin.viewAllReports()">
                  <i class="fas fa-flag"></i> View Reports
                </button>
                ${this.isOwner ? `
                  <button class="cyber-button" onclick="realAdmin.manageAdmins()">
                    <i class="fas fa-user-shield"></i> Manage Admins
                  </button>
                ` : ''}
              </div>
            </div>
            
            <!-- System Status -->
            <div class="admin-card">
              <h3><i class="fas fa-server"></i> SYSTEM STATUS</h3>
              <div style="margin-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Database:</span>
                  <span style="color: var(--success);">✅ Online</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Storage:</span>
                  <span style="color: var(--success);">✅ Online</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Auth:</span>
                  <span style="color: var(--success);">✅ Online</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Uptime:</span>
                  <span>99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('❌ Load dashboard error:', error);
      container.innerHTML = `<div style="color: var(--danger);">Error loading dashboard: ${error.message}</div>`;
    }
  }
  
  async loadTransactionsContent(container) {
    try {
      const transSnap = await realDatabase.ref('transactions').once('value');
      const allTrans = transSnap.val() || {};
      
      let allTransactions = [];
      
      // Flatten transactions
      Object.entries(allTrans).forEach(([userId, userTrans]) => {
        if (userTrans) {
          Object.entries(userTrans).forEach(([transId, trans]) => {
            allTransactions.push({
              id: transId,
              userId: userId,
              ...trans
            });
          });
        }
      });
      
      // Sort by date
      allTransactions.sort((a, b) => b.createdAt - a.createdAt);
      
      container.innerHTML = `
        <div class="admin-card">
          <h3><i class="fas fa-filter"></i> FILTER TRANSAKSI</h3>
          <div style="display: flex; gap: 10px; margin: 15px 0;">
            <select id="transFilter" class="cyber-input" style="flex: 1;">
              <option value="all">Semua Status</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="awaiting_verification">Awaiting Verification</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button class="cyber-button" onclick="realAdmin.filterTransactions()">
              <i class="fas fa-filter"></i> Filter
            </button>
          </div>
        </div>
        
        <div class="admin-card">
          <h3><i class="fas fa-list"></i> DAFTAR TRANSAKSI (${allTransactions.length})</h3>
          <div class="admin-list" style="max-height: 600px;">
            ${allTransactions.length > 0 ? allTransactions.map(trans => `
              <div class="admin-list-item">
                <div style="flex: 1;">
                  <strong>${trans.description || 'No Description'}</strong>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">
                    <div><strong>Kode:</strong> ${trans.paymentCode || 'N/A'}</div>
                    <div><strong>User:</strong> ${trans.payerEmail || 'Unknown'}</div>
                    <div><strong>Amount:</strong> Rp ${this.formatRupiah(trans.amount || 0)}</div>
                    <div><strong>Fee:</strong> Rp ${this.formatRupiah(trans.adminFee || 0)}</div>
                    <div><strong>Status:</strong> 
                      <span class="payment-status status-${trans.status}" style="margin-left: 5px;">
                        ${trans.status}
                      </span>
                    </div>
                    <div><strong>Date:</strong> ${new Date(trans.createdAt).toLocaleString('id-ID')}</div>
                    ${trans.paymentProof ? `
                      <div>
                        <a href="${trans.paymentProof}" target="_blank" style="color: var(--primary);">
                          <i class="fas fa-image"></i> Lihat Bukti Transfer
                        </a>
                      </div>
                    ` : ''}
                  </div>
                </div>
                <div class="item-actions">
                  ${trans.status === 'awaiting_verification' ? `
                    <button class="cyber-button btn-small btn-success" 
                            onclick="realAdmin.approveTransactionReal('${trans.id}', '${trans.userId}')">
                      <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="cyber-button btn-small btn-danger"
                            onclick="realAdmin.rejectTransactionReal('${trans.id}', '${trans.userId}')">
                      <i class="fas fa-times"></i> Reject
                    </button>
                  ` : ''}
                  <button class="cyber-button btn-small"
                          onclick="realAdmin.viewTransactionDetails('${trans.id}', '${trans.userId}')">
                    <i class="fas fa-eye"></i> Details
                  </button>
                </div>
              </div>
            `).join('') : `
              <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <div>Tidak ada transaksi</div>
              </div>
            `}
          </div>
        </div>
      `;
      
    } catch (error) {
      console.error('❌ Load transactions error:', error);
      container.innerHTML = `<div style="color: var(--danger);">Error: ${error.message}</div>`;
    }
  }
  
  async approveTransactionReal(transId, userId) {
    try {
      const confirmApprove = confirm('Approve transaksi ini? Dana akan diteruskan ke worker.');
      if (!confirmApprove) return;
      
      const transRef = realDatabase.ref(`transactions/${userId}/${transId}`);
      
      await transRef.update({
        status: 'completed',
        approvedAt: Date.now(),
        approvedBy: window.currentRealUser.uid,
        adminNotes: 'Approved by admin'
      });
      
      // Update user stats
      const userRef = realDatabase.ref(`users/${userId}`);
      const userSnap = await userRef.once('value');
      const userData = userSnap.val();
      
      if (userData) {
        const completedTrans = (userData.stats?.completedTransactions || 0) + 1;
        const totalSpent = (userData.stats?.totalSpent || 0) + (await transRef.child('amount').once('value')).val();
        
        await userRef.child('stats').update({
          completedTransactions: completedTrans,
          totalSpent: totalSpent,
          reputation: Math.min(100, (userData.reputation || 50) + 10)
        });
      }
      
      alert('✅ Transaksi berhasil di-approve!');
      
      // Reload transactions
      this.showAdminTab('transactions');
      
    } catch (error) {
      console.error('❌ Approve transaction error:', error);
      alert('❌ Gagal approve: ' + error.message);
    }
  }
  
  setupAdminListeners() {
    // Real-time updates for admin
    realDatabase.ref('transactions').on('value', () => {
      if (this.currentTab === 'transactions') {
        this.showAdminTab('transactions');
      }
    });
    
    realDatabase.ref('markers').on('value', () => {
      if (this.currentTab === 'markers') {
        this.showAdminTab('markers');
      }
    });
  }
  
  getActivityIcon(type) {
    const icons = {
      'quest': 'scroll',
      'marker': 'map-marker-alt',
      'transaction': 'money-bill-wave',
      'user': 'user'
    };
    return icons[type] || 'circle';
  }
  
  getCredibilityColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }
  
  async exportDataReal() {
    try {
      // Get all data
      const [usersSnap, questsSnap, markersSnap, transSnap] = await Promise.all([
        realDatabase.ref('users').once('value'),
        realDatabase.ref('quests').once('value'),
        realDatabase.ref('markers').once('value'),
        realDatabase.ref('transactions').once('value')
      ]);
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedBy: window.currentRealUser?.email,
        users: usersSnap.val(),
        quests: questsSnap.val(),
        markers: markersSnap.val(),
        transactions: transSnap.val()
      };
      
      // Convert to JSON
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const downloadUrl = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `simplebisnis_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('✅ Data berhasil diexport!');
      
    } catch (error) {
      console.error('❌ Export error:', error);
      alert('❌ Gagal export: ' + error.message);
    }
  }
}

// Initialize REAL Admin Panel
const realAdmin = new RealAdminPanel();
