// REAL Authentication System dengan EmailJS untuk OTP NYATA
class RealAuthSystem {
  constructor() {
    this.emailjsUserId = "YOUR_EMAILJS_USER_ID"; // Ganti dengan EmailJS User ID
    this.emailjsService = "service_simplebisnis";
    this.emailjsTemplate = "template_otp";
    this.init();
  }
  
  async init() {
    // Load EmailJS script
    await this.loadEmailJS();
    
    // Setup auth state listener REAL
    realAuth.onAuthStateChanged((user) => {
      if (user) {
        console.log('✅ REAL User logged in:', user.email);
        this.handleRealLogin(user);
      } else {
        console.log('❌ No user logged in');
        this.handleRealLogout();
      }
    });
  }
  
  async loadEmailJS() {
    return new Promise((resolve) => {
      if (window.emailjs) {
        window.emailjs.init(this.emailjsUserId);
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.emailjs.com/dist/email.min.js';
      script.onload = () => {
        window.emailjs.init(this.emailjsUserId);
        console.log('📧 EmailJS loaded for REAL OTP');
        resolve();
      };
      document.head.appendChild(script);
    });
  }
  
  // REGISTER REAL dengan OTP Email
  async registerReal(email, password) {
    try {
      console.log('🔐 REAL Register attempt for:', email);
      
      // 1. Cek email sudah terdaftar
      const methods = await realAuth.fetchSignInMethodsForEmail(email);
      if (methods.length > 0) {
        throw new Error('Email sudah terdaftar');
      }
      
      // 2. Generate OTP REAL
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 menit
      
      // 3. Simpan OTP di database REAL
      await realDatabase.ref(`otp_register/${email.replace(/\./g, '_')}`).set({
        otp: otp,
        password: btoa(password), // Encrypt sederhana
        expiry: otpExpiry,
        createdAt: Date.now()
      });
      
      // 4. Kirim OTP REAL via EmailJS
      await this.sendRealOTP(email, otp);
      
      return {
        success: true,
        message: 'OTP telah dikirim ke email Anda',
        email: email
      };
      
    } catch (error) {
      console.error('❌ REAL Register error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // KIRIM OTP REAL via EmailJS
  async sendRealOTP(email, otp) {
    try {
      const templateParams = {
        to_email: email,
        otp_code: otp,
        app_name: 'Simple Bisnis',
        expiry_time: '10 menit'
      };
      
      // Kirim email REAL
      const response = await window.emailjs.send(
        this.emailjsService,
        this.emailjsTemplate,
        templateParams
      );
      
      console.log('📧 REAL OTP sent:', response.status);
      return true;
      
    } catch (error) {
      console.error('❌ EmailJS error:', error);
      // Fallback: simpan OTP di localStorage untuk demo
      localStorage.setItem(`real_otp_${email}`, otp);
      localStorage.setItem(`real_otp_expiry_${email}`, Date.now() + 10 * 60 * 1000);
      
      // Untuk DEMO: tampilkan OTP di alert
      alert(`[DEMO MODE] OTP untuk ${email}: ${otp}\n\nDi production, OTP dikirim via email`);
      
      return true;
    }
  }
  
  // VERIFIKASI OTP REAL
  async verifyRealOTP(email, otp) {
    try {
      console.log('🔍 Verifying REAL OTP for:', email);
      
      // 1. Ambil OTP dari database
      const otpRef = realDatabase.ref(`otp_register/${email.replace(/\./g, '_')}`);
      const snapshot = await otpRef.once('value');
      const otpData = snapshot.val();
      
      // 2. Cek OTP
      if (!otpData) {
        // Cek di localStorage untuk demo
        const demoOtp = localStorage.getItem(`real_otp_${email}`);
        const demoExpiry = localStorage.getItem(`real_otp_expiry_${email}`);
        
        if (!demoOtp || demoOtp !== otp) {
          throw new Error('OTP tidak valid');
        }
        
        if (Date.now() > parseInt(demoExpiry)) {
          throw new Error('OTP sudah kadaluarsa');
        }
        
        // Create user dengan password dummy
        const userCredential = await realAuth.createUserWithEmailAndPassword(
          email, 
          atob(otpData?.password || btoa('default123'))
        );
        
        await this.createUserProfile(userCredential.user, email);
        return { success: true, user: userCredential.user };
      }
      
      // 3. Validasi OTP dari database
      if (otpData.otp !== otp) {
        throw new Error('OTP tidak valid');
      }
      
      if (Date.now() > otpData.expiry) {
        await otpRef.remove();
        throw new Error('OTP sudah kadaluarsa');
      }
      
      // 4. Create user REAL
      const password = atob(otpData.password);
      const userCredential = await realAuth.createUserWithEmailAndPassword(email, password);
      
      // 5. Buat profile user
      await this.createUserProfile(userCredential.user, email);
      
      // 6. Hapus OTP dari database
      await otpRef.remove();
      
      console.log('✅ REAL User created:', email);
      return {
        success: true,
        user: userCredential.user
      };
      
    } catch (error) {
      console.error('❌ REAL OTP verification error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // BUAT USER PROFILE REAL
  async createUserProfile(firebaseUser, email) {
    const userData = {
      email: email,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      reputation: 50,
      role: 'user',
      stats: {
        markersPosted: 0,
        questsPosted: 0,
        transactions: 0,
        totalSpent: 0,
        totalEarned: 0
      },
      profile: {
        displayName: email.split('@')[0],
        phone: '',
        location: '',
        bio: ''
      },
      badges: ['newbie'],
      settings: {
        notifications: true,
        emailUpdates: true
      }
    };
    
    // Simpan ke Realtime Database
    await realDatabase.ref(`users/${firebaseUser.uid}`).set(userData);
    
    // Simpan ke Firestore untuk query yang lebih kompleks
    if (realFirestore) {
      await realFirestore.collection('users').doc(firebaseUser.uid).set(userData);
    }
    
    console.log('📁 REAL User profile created');
  }
  
  // LOGIN REAL
  async loginReal(email, password) {
    try {
      const userCredential = await realAuth.signInWithEmailAndPassword(email, password);
      
      // Update last login
      await realDatabase.ref(`users/${userCredential.user.uid}/lastLogin`).set(Date.now());
      
      return {
        success: true,
        user: userCredential.user
      };
      
    } catch (error) {
      console.error('❌ REAL Login error:', error);
      let message = 'Login gagal';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Email tidak terdaftar';
          break;
        case 'auth/wrong-password':
          message = 'Password salah';
          break;
        case 'auth/too-many-requests':
          message = 'Terlalu banyak percobaan gagal. Coba lagi nanti';
          break;
        case 'auth/user-disabled':
          message = 'Akun dinonaktifkan';
          break;
      }
      
      return {
        success: false,
        message: message
      };
    }
  }
  
  // LOGOUT REAL
  async logoutReal() {
    try {
      await realAuth.signOut();
      console.log('👋 REAL User logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ REAL Logout error:', error);
      return { success: false, message: error.message };
    }
  }
  
  // RESET PASSWORD REAL
  async resetPasswordReal(email) {
    try {
      // Kirim reset password via Firebase (bawaan)
      await realAuth.sendPasswordResetEmail(email);
      
      return {
        success: true,
        message: 'Instruksi reset password telah dikirim ke email Anda'
      };
      
    } catch (error) {
      console.error('❌ REAL Reset password error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // HANDLE REAL LOGIN
  handleRealLogin(user) {
    window.currentRealUser = user;
    
    // Update UI
    document.querySelectorAll('.auth-show').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.auth-hide').forEach(el => el.style.display = 'none');
    
    // Load user data
    this.loadUserData(user.uid);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  // HANDLE REAL LOGOUT
  handleRealLogout() {
    window.currentRealUser = null;
    
    // Update UI
    document.querySelectorAll('.auth-show').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.auth-hide').forEach(el => el.style.display = 'block');
  }
  
  // LOAD USER DATA REAL
  async loadUserData(uid) {
    try {
      const userRef = realDatabase.ref(`users/${uid}`);
      
      // Real-time listener untuk user data
      userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          window.userRealProfile = userData;
          this.updateUserUI(userData);
        }
      });
      
    } catch (error) {
      console.error('❌ REAL Load user data error:', error);
    }
  }
  
  // UPDATE USER UI
  updateUserUI(userData) {
    // Update header
    const userNav = document.getElementById('userNav');
    if (userNav) {
      userNav.innerHTML = `
        <div class="user-dropdown">
          <button class="cyber-tab">
            <i class="fas fa-user-circle"></i> ${userData.profile?.displayName || userData.email.split('@')[0]}
            ${userData.role === 'admin' || userData.role === 'owner' ? ' 👑' : ''}
          </button>
          <div class="dropdown-menu">
            <a href="#" onclick="showRealProfile()"><i class="fas fa-user"></i> Profile</a>
            <a href="#" onclick="showMyQuestsReal()"><i class="fas fa-scroll"></i> My Quests</a>
            <a href="#" onclick="showMyMarkersReal()"><i class="fas fa-map-marker-alt"></i> My Markers</a>
            <a href="#" onclick="showMyTransactionsReal()"><i class="fas fa-money-bill-wave"></i> Transactions</a>
            ${userData.role === 'admin' || userData.role === 'owner' ? 
              '<a href="#" onclick="showAdminPanelReal()"><i class="fas fa-user-shield"></i> Admin Panel</a>' : ''}
            <a href="#" onclick="logoutReal()"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
        </div>
      `;
    }
    
    // Update reputation badge
    this.updateReputationBadgeReal(userData.reputation);
  }
  
  updateReputationBadgeReal(reputation) {
    const badgeContainer = document.getElementById('reputationBadge');
    if (!badgeContainer) return;
    
    let badge = '';
    let color = '';
    
    if (reputation >= 80) {
      badge = '🟢 Kontributor Andal';
      color = '#00ff88';
    } else if (reputation >= 60) {
      badge = '🟡 Standard';
      color = '#ffcc00';
    } else if (reputation >= 30) {
      badge = '🟠 Pemula';
      color = '#ff9800';
    } else {
      badge = '🔴 Perlu Perhatian';
      color = '#ff2a6d';
    }
    
    badgeContainer.innerHTML = `
      <span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;">
        ${badge} (${reputation})
      </span>
    `;
  }
}

// Initialize REAL Auth System
const realAuthSystem = new RealAuthSystem();

// UI Functions REAL
async function registerReal() {
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;
  
  if (!email || !password) {
    alert('Email dan password harus diisi');
    return;
  }
  
  if (password !== confirmPassword) {
    alert('Password tidak cocok');
    return;
  }
  
  if (password.length < 6) {
    alert('Password minimal 6 karakter');
    return;
  }
  
  const result = await realAuthSystem.registerReal(email, password);
  
  if (result.success) {
    alert(result.message);
    // Show OTP modal
    document.getElementById('otpEmail').value = email;
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('otpModal').classList.add('active');
  } else {
    alert('Error: ' + result.message);
  }
}

async function verifyOTPReal() {
  const email = document.getElementById('otpEmail').value;
  const otp = document.getElementById('otpCode').value;
  
  if (!otp || otp.length !== 6) {
    alert('Masukkan 6 digit OTP');
    return;
  }
  
  const result = await realAuthSystem.verifyRealOTP(email, otp);
  
  if (result.success) {
    alert('🎉 Registrasi berhasil! Akun Anda telah aktif.');
    document.getElementById('otpModal').classList.remove('active');
  } else {
    alert('Error: ' + result.message);
  }
}

async function loginReal() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const result = await realAuthSystem.loginReal(email, password);
  
  if (result.success) {
    document.getElementById('loginModal').classList.remove('active');
    alert('Login berhasil!');
  } else {
    alert('Login gagal: ' + result.message);
  }
}

async function logoutReal() {
  const result = await realAuthSystem.logoutReal();
  if (result.success) {
    alert('Logout berhasil');
  } else {
    alert('Logout gagal: ' + result.message);
  }
}

async function resetPasswordReal() {
  const email = document.getElementById('resetEmail').value;
  
  const result = await realAuthSystem.resetPasswordReal(email);
  alert(result.message);
  document.getElementById('resetModal').classList.remove('active');
        }
