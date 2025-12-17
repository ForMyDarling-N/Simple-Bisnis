// REAL Payment System dengan QRIS Admin Nyata
class RealPaymentSystem {
  constructor() {
    // QRIS Admin REAL (URL gambar QRIS nyata)
    this.adminQRIS = 'https://files.catbox.moe/f1h9md.png';
    this.adminPhone = '6281234567890'; // Ganti dengan nomor admin real
    this.adminFeePercentage = 0.05; // 5%
    
    this.paymentMethods = {
      qris: 'QRIS',
      bank_transfer: 'Transfer Bank',
      ewallet: 'E-Wallet'
    };
    
    console.log('💰 REAL Payment System initialized');
  }
  
  async createPaymentReal(questId, amount, description) {
    try {
      if (!window.currentRealUser) {
        throw new Error('Harap login terlebih dahulu');
      }
      
      // Validasi amount
      if (!amount || amount < 10000) {
        throw new Error('Minimum pembayaran Rp 10.000');
      }
      
      // Generate payment code REAL
      const paymentCode = this.generatePaymentCodeReal();
      const adminFee = Math.round(amount * this.adminFeePercentage);
      const workerAmount = amount - adminFee;
      
      // Data transaksi REAL
      const transactionData = {
        questId: questId,
        amount: amount,
        adminFee: adminFee,
        workerAmount: workerAmount,
        description: description,
        paymentCode: paymentCode,
        paymentMethod: 'qris',
        status: 'pending_payment',
        createdAt: Date.now(),
        payerId: window.currentRealUser.uid,
        payerEmail: window.currentRealUser.email,
        payerName: window.userRealProfile?.profile?.displayName || 'User',
        adminVerified: false,
        paymentProof: null,
        notes: ''
      };
      
      // Simpan ke database REAL
      const transRef = realDatabase.ref(`transactions/${window.currentRealUser.uid}`).push();
      await transRef.set(transactionData);
      
      // Tampilkan instruksi pembayaran REAL
      this.showPaymentInstructionsReal(paymentCode, amount, transRef.key, questId);
      
      return {
        success: true,
        transactionId: transRef.key,
        paymentCode: paymentCode,
        data: transactionData
      };
      
    } catch (error) {
      console.error('❌ Create payment error:', error);
      alert('Gagal membuat pembayaran: ' + error.message);
      return { success: false, message: error.message };
    }
  }
  
  showPaymentInstructionsReal(paymentCode, amount, transactionId, questId) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <button class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</button>
        
        <h3 style="color: var(--primary); margin-bottom: 1rem; text-align: center;">
          <i class="fas fa-qrcode"></i> PEMBAYARAN #${paymentCode}
        </h3>
        
        <!-- Payment Info -->
        <div style="background: rgba(0,240,255,0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">Kode Pembayaran:</span>
            <span style="color: var(--accent); font-weight: bold;">${paymentCode}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: var(--text-secondary);">Total:</span>
            <span style="color: var(--warning); font-weight: bold; font-size: 1.2rem;">
              Rp ${this.formatRupiah(amount)}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-secondary);">Biaya Admin (5%):</span>
            <span style="color: var(--text-secondary);">
              Rp ${this.formatRupiah(Math.round(amount * 0.05))}
            </span>
          </div>
        </div>
        
        <!-- QRIS REAL -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">
            Scan QRIS di bawah ini:
          </div>
          <div style="background: white; padding: 15px; border-radius: 10px; display: inline-block;">
            <img src="${this.adminQRIS}" 
                 alt="QRIS Admin" 
                 style="width: 200px; height: 200px; border: 1px solid #ddd;">
          </div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 10px;">
            Atau transfer manual ke: <strong>0812-3456-7890</strong>
          </div>
        </div>
        
        <!-- Instructions -->
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <h4 style="color: var(--primary); margin-bottom: 10px;">
            <i class="fas fa-list-ol"></i> LANGKAH-LANGKAH:
          </h4>
          <ol style="color: var(--text); padding-left: 20px; margin: 0;">
            <li>Scan QRIS dengan aplikasi e-wallet/banking Anda</li>
            <li>Transfer <strong>Rp ${this.formatRupiah(amount)}</strong></li>
            <li>Sertakan kode <strong>${paymentCode}</strong> di keterangan</li>
            <li>Screenshoot/simpan bukti transfer</li>
            <li>Klik "KONFIRMASI PEMBAYARAN" di bawah</li>
          </ol>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: grid; gap: 10px;">
          <button class="cyber-button" onclick="realPayment.uploadPaymentProof('${transactionId}', '${questId}')">
            <i class="fas fa-upload"></i> UPLOAD BUKTI TRANSFER
          </button>
          <button class="cyber-button" style="background: var(--warning); color: black;" 
                  onclick="realPayment.contactAdminReal('${paymentCode}', ${amount})">
            <i class="fab fa-whatsapp"></i> TANYA ADMIN
          </button>
          <button class="cyber-button" style="background: var(--danger);" 
                  onclick="realPayment.cancelPayment('${transactionId}')">
            <i class="fas fa-times"></i> BATAL PEMBAYARAN
          </button>
        </div>
        
        <div style="margin-top: 15px; font-size: 0.8rem; color: var(--text-secondary); text-align: center;">
          <i class="fas fa-clock"></i> Verifikasi maksimal 1x24 jam kerja
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
  
  async uploadPaymentProof(transactionId, questId) {
    try {
      // Create upload modal
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
          <button class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</button>
          <h3 style="color: var(--primary); margin-bottom: 1rem;">
            <i class="fas fa-upload"></i> UPLOAD BUKTI TRANSFER
          </h3>
          
          <div style="margin-bottom: 15px;">
            <p style="color: var(--text); margin-bottom: 10px;">
              Upload screenshoot bukti transfer Anda:
            </p>
            <input type="file" id="realPaymentProof" accept="image/*" class="cyber-input" 
                   style="margin-bottom: 10px;">
            <textarea id="paymentNotes" class="cyber-input" rows="3" 
                      placeholder="Catatan tambahan (opsional)"></textarea>
          </div>
          
          <button class="cyber-button" onclick="realPayment.submitPaymentProof('${transactionId}', '${questId}')">
            <i class="fas fa-paper-plane"></i> KIRIM BUKTI
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
    } catch (error) {
      console.error('❌ Upload proof error:', error);
      alert('Error: ' + error.message);
    }
  }
  
  async submitPaymentProof(transactionId, questId) {
    try {
      const fileInput = document.getElementById('realPaymentProof');
      const notes = document.getElementById('paymentNotes').value;
      
      if (!fileInput.files[0]) {
        alert('Pilih file bukti transfer terlebih dahulu');
        return;
      }
      
      const file = fileInput.files[0];
      
      // Validasi file
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        alert('Ukuran file maksimal 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan');
        return;
      }
      
      // Compress image
      const compressedImage = await this.compressImageReal(file);
      
      // Upload to Firebase Storage
      const storageRef = realStorage.ref();
      const fileName = `payment_proofs/${Date.now()}_${file.name}`;
      const fileRef = storageRef.child(fileName);
      
      // Show loading
      alert('Mengupload bukti transfer...');
      
      // Upload file
      const snapshot = await fileRef.putString(compressedImage, 'data_url');
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      // Update transaction in database
      const userId = window.currentRealUser.uid;
      const transRef = realDatabase.ref(`transactions/${userId}/${transactionId}`);
      
      await transRef.update({
        paymentProof: downloadURL,
        paymentNotes: notes,
        status: 'awaiting_verification',
        proofUploadedAt: Date.now()
      });
      
      // Close modals
      document.querySelectorAll('.modal.active').forEach(modal => modal.remove());
      
      // Notify admin
      await this.notifyAdminReal(transactionId, 'payment_proof_uploaded');
      
      alert('✅ Bukti transfer berhasil dikirim! Admin akan memverifikasi.');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Submit proof error:', error);
      alert('Gagal upload bukti: ' + error.message);
      return { success: false, message: error.message };
    }
  }
  
  async compressImageReal(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with 80% quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataUrl);
        };
        
        img.onerror = reject;
      };
      
      reader.onerror = reject;
    });
  }
  
  async notifyAdminReal(transactionId, type) {
    try {
      // Get all admin users
      const usersRef = realDatabase.ref('users');
      const snapshot = await usersRef.once('value');
      const allUsers = snapshot.val();
      
      if (!allUsers) return;
      
      // Find admins
      const admins = Object.entries(allUsers)
        .filter(([uid, user]) => user.role === 'admin' || user.role === 'owner')
        .map(([uid, user]) => ({ uid, ...user }));
      
      // Send notification to each admin
      for (const admin of admins) {
        const notifRef = realDatabase.ref(`notifications/${admin.uid}`).push();
        await notifRef.set({
          type: type,
          transactionId: transactionId,
          userId: window.currentRealUser.uid,
          userEmail: window.currentRealUser.email,
          message: `Bukti pembayaran baru memerlukan verifikasi`,
          timestamp: Date.now(),
          read: false,
          priority: 'high'
        });
      }
      
      console.log(`📢 Notified ${admins.length} admins`);
      
    } catch (error) {
      console.error('❌ Notify admin error:', error);
    }
  }
  
  contactAdminReal(paymentCode, amount) {
    const message = encodeURIComponent(
      `Halo Admin Simple Bisnis,\n\n` +
      `Saya ingin bertanya tentang pembayaran dengan kode:\n` +
      `Kode: ${paymentCode}\n` +
      `Jumlah: Rp ${this.formatRupiah(amount)}\n\n` +
      `Bisa dibantu?`
    );
    
    window.open(`https://wa.me/${this.adminPhone}?text=${message}`, '_blank');
  }
  
  async cancelPayment(transactionId) {
    try {
      const confirmCancel = confirm('Batalkan pembayaran ini?');
      if (!confirmCancel) return;
      
      const userId = window.currentRealUser.uid;
      const transRef = realDatabase.ref(`transactions/${userId}/${transactionId}`);
      
      await transRef.update({
        status: 'cancelled',
        cancelledAt: Date.now(),
        cancelledBy: userId
      });
      
      // Close modal
      document.querySelector('.modal.active')?.remove();
      
      alert('Pembayaran dibatalkan');
      
    } catch (error) {
      console.error('❌ Cancel payment error:', error);
      alert('Gagal membatalkan: ' + error.message);
    }
  }
  
  generatePaymentCodeReal() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove confusing chars
    let code = 'SB';
    
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
  }
  
  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
  }
}

// Initialize REAL Payment System
const realPayment = new RealPaymentSystem();
