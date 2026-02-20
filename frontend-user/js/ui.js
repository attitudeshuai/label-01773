/**
 * UI管理系统
 * 处理所有界面元素的更新和交互
 */
class UIManager {
    constructor() {
        this.cacheElements();
        this.minimapCtx = this.elements.minimapCanvas.getContext('2d');
        this.toastQueue = [];
        this.modalCallback = null;
    }

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            loadingProgress: document.getElementById('loading-progress'),
            loadingText: document.getElementById('loading-text'),
            mainMenu: document.getElementById('main-menu'),
            gameUI: document.getElementById('game-ui'),
            gameOver: document.getElementById('game-over'),
            settingsPanel: document.getElementById('settings-panel'),
            pauseMenu: document.getElementById('pause-menu'),
            
            healthBar: document.getElementById('health-bar'),
            healthText: document.getElementById('health-text'),
            expBar: document.getElementById('exp-bar'),
            expText: document.getElementById('exp-text'),
            killCount: document.getElementById('kill-count'),
            gameTime: document.getElementById('game-time'),
            playerLevel: document.getElementById('player-level'),
            
            levelUp: document.getElementById('level-up'),
            levelUpText: document.getElementById('level-up-text'),
            levelUpBonus: document.getElementById('level-up-bonus'),
            killNotification: document.getElementById('kill-notification'),
            expGain: document.getElementById('exp-gain'),
            pickupNotification: document.getElementById('pickup-notification'),
            pickupIcon: document.getElementById('pickup-icon'),
            pickupText: document.getElementById('pickup-text'),
            damageIndicator: document.getElementById('damage-indicator'),
            crosshair: document.getElementById('crosshair'),
            
            finalKills: document.getElementById('final-kills'),
            finalLevel: document.getElementById('final-level'),
            survivalTime: document.getElementById('survival-time'),
            
            pauseKills: document.getElementById('pause-kills'),
            pauseLevel: document.getElementById('pause-level'),
            pauseTime: document.getElementById('pause-time'),
            
            minimapCanvas: document.getElementById('minimap-canvas'),
            toastContainer: document.getElementById('toast-container'),
            
            modalOverlay: document.getElementById('modal-overlay'),
            modal: document.getElementById('modal'),
            modalIcon: document.getElementById('modal-icon'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            modalCancel: document.getElementById('modal-cancel'),
            modalConfirm: document.getElementById('modal-confirm'),
            
            sfxValue: document.getElementById('sfx-value'),
            musicValue: document.getElementById('music-value'),
            sensitivityValue: document.getElementById('sensitivity-value')
        };
    }

    /**
     * 更新加载进度
     */
    updateLoadingProgress(percent, text = '') {
        this.elements.loadingProgress.style.width = `${percent}%`;
        if (text) {
            this.elements.loadingText.textContent = text;
        }
    }

    hideLoading() {
        this.elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hidden');
        }, 500);
    }

    showMainMenu() {
        this.elements.mainMenu.classList.remove('hidden');
        this.elements.gameUI.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');
        this.elements.pauseMenu.classList.add('hidden');
    }

    hideMainMenu() {
        this.elements.mainMenu.classList.add('hidden');
    }

    showGameUI() {
        this.elements.gameUI.classList.remove('hidden');
        this.elements.mainMenu.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');
    }

    hideGameUI() {
        this.elements.gameUI.classList.add('hidden');
    }

    showPauseMenu(kills, level, time) {
        this.elements.pauseMenu.classList.remove('hidden');
        this.elements.pauseKills.textContent = kills;
        this.elements.pauseLevel.textContent = level;
        this.elements.pauseTime.textContent = this.formatTime(time);
    }

    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    }

    showGameOver(kills, level, survivalTime) {
        this.elements.gameOver.classList.remove('hidden');
        this.elements.gameUI.classList.add('hidden');
        
        this.elements.finalKills.textContent = kills;
        this.elements.finalLevel.textContent = level;
        this.elements.survivalTime.textContent = this.formatTime(survivalTime);
    }

    hideGameOver() {
        this.elements.gameOver.classList.add('hidden');
    }

    showSettings() {
        this.elements.settingsPanel.classList.remove('hidden');
    }

    hideSettings() {
        this.elements.settingsPanel.classList.add('hidden');
        this.showToast('success', '设置已保存', '您的游戏设置已成功保存');
    }

    updateSettingValue(type, value) {
        switch(type) {
            case 'sfx':
                this.elements.sfxValue.textContent = `${value}%`;
                break;
            case 'music':
                this.elements.musicValue.textContent = `${value}%`;
                break;
            case 'sensitivity':
                this.elements.sensitivityValue.textContent = value;
                break;
        }
    }

    /**
     * 更新血量显示
     */
    updateHealth(current, max) {
        const percent = (current / max) * 100;
        this.elements.healthBar.style.width = `${percent}%`;
        this.elements.healthText.textContent = `${Math.ceil(current)}/${max}`;
        
        if (percent > 60) {
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
        } else if (percent > 30) {
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        } else {
            this.elements.healthBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        }
    }

    /**
     * 更新经验条
     */
    updateExp(level, current, required) {
        const percent = (current / required) * 100;
        this.elements.expBar.style.width = `${percent}%`;
        this.elements.expText.textContent = `等级 ${level} · ${current}/${required}`;
        this.elements.playerLevel.textContent = level;
    }

    /**
     * 更新击杀数
     */
    updateKills(count) {
        this.elements.killCount.textContent = count;
    }

    /**
     * 更新游戏时间
     */
    updateGameTime(seconds) {
        this.elements.gameTime.textContent = this.formatTime(seconds);
    }

    /**
     * 显示升级通知
     */
    showLevelUp(level, bonuses) {
        this.elements.levelUpText.textContent = `等级 ${level}`;
        
        let bonusHtml = '';
        if (bonuses) {
            if (bonuses.maxHealth) bonusHtml += `<p>❤️ 生命值 +${bonuses.maxHealth}</p>`;
            if (bonuses.damage) bonusHtml += `<p>💥 伤害 +${bonuses.damage}</p>`;
            if (bonuses.moveSpeed) bonusHtml += `<p>🚀 移动速度 +${bonuses.moveSpeed}</p>`;
            if (bonuses.fireRate) bonusHtml += `<p>🔥 射速 +${(bonuses.fireRate * 100).toFixed(0)}%</p>`;
        }
        this.elements.levelUpBonus.innerHTML = bonusHtml;
        
        this.elements.levelUp.classList.remove('hidden');
        this.elements.levelUp.classList.add('show');
        
        audioManager.playLevelUp();
        
        setTimeout(() => {
            this.elements.levelUp.classList.remove('show');
            this.elements.levelUp.classList.add('hidden');
        }, 3500);
    }

    /**
     * 显示击杀通知
     */
    showKillNotification(expGain) {
        this.elements.expGain.textContent = `+${expGain} 经验值`;
        this.elements.killNotification.classList.remove('hidden');
        this.elements.killNotification.classList.add('show');
        
        setTimeout(() => {
            this.elements.killNotification.classList.remove('show');
            this.elements.killNotification.classList.add('hidden');
        }, 2000);
    }

    /**
     * 显示补给品通知
     */
    showPickupNotification(type, message) {
        const icons = { health: '💊', damage: '💥', speed: '⚡' };
        const classes = { health: 'health', damage: 'damage', speed: 'speed' };
        
        this.elements.pickupIcon.textContent = icons[type] || '📦';
        this.elements.pickupText.textContent = message;
        
        const notification = this.elements.pickupNotification;
        notification.className = 'pickup-notification show ' + (classes[type] || '');
        
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hidden');
        }, 2000);
    }

    /**
     * 显示伤害指示器
     */
    showDamageIndicator() {
        this.elements.damageIndicator.classList.add('active');
        audioManager.playDamage();
        
        setTimeout(() => {
            this.elements.damageIndicator.classList.remove('active');
        }, 300);
    }

    /**
     * 准星开火动画
     */
    crosshairFire() {
        this.elements.crosshair.classList.add('firing');
        setTimeout(() => {
            this.elements.crosshair.classList.remove('firing');
        }, 100);
    }

    /**
     * 更新小地图
     */
    updateMinimap(playerPos, enemies, mapSize) {
        const ctx = this.minimapCtx;
        const canvas = this.elements.minimapCanvas;
        const scale = canvas.width / mapSize;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 6; i++) {
            const pos = (canvas.width / 6) * i;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(canvas.width, pos);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#e74c3c';
        for (const enemy of enemies) {
            if (!enemy.isAlive) continue;
            const pos = enemy.getPosition();
            const x = centerX + pos.x * scale;
            const y = centerY + pos.z * scale;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (playerPos) {
            const x = centerX + playerPos.x * scale;
            const y = centerY + playerPos.z * scale;
            
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    /**
     * Toast 通知系统
     */
    showToast(type, title, message, duration = 3000) {
        const container = this.elements.toastContainer;
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || 'ℹ'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));
        
        container.appendChild(toast);
        
        setTimeout(() => this.removeToast(toast), duration);
        
        return toast;
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * 自定义弹窗系统
     */
    showModal(options) {
        const { type = 'confirm', icon, title, message, confirmText = '确定', cancelText = '取消', onConfirm, onCancel, showCancel = true } = options;
        
        const icons = {
            confirm: '❓',
            warning: '⚠️',
            danger: '🚨',
            success: '✅',
            info: 'ℹ️'
        };
        
        this.elements.modal.className = `modal ${type}`;
        this.elements.modalIcon.textContent = icon || icons[type] || '❓';
        this.elements.modalTitle.textContent = title;
        this.elements.modalMessage.textContent = message;
        this.elements.modalConfirm.textContent = confirmText;
        this.elements.modalCancel.textContent = cancelText;
        
        this.elements.modalConfirm.className = `modal-btn ${type === 'danger' ? 'danger' : 'confirm'}`;
        this.elements.modalCancel.style.display = showCancel ? 'block' : 'none';
        
        this.modalCallback = { onConfirm, onCancel };
        
        this.elements.modalOverlay.classList.add('show');
    }

    hideModal() {
        this.elements.modalOverlay.classList.remove('show');
        this.modalCallback = null;
    }

    handleModalConfirm() {
        if (this.modalCallback && this.modalCallback.onConfirm) {
            this.modalCallback.onConfirm();
        }
        this.hideModal();
    }

    handleModalCancel() {
        if (this.modalCallback && this.modalCallback.onCancel) {
            this.modalCallback.onCancel();
        }
        this.hideModal();
    }

    /**
     * 格式化时间 (中文格式)
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 格式化日期 (中文格式)
     */
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    }

    /**
     * 格式化数字
     */
    formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    }

    /**
     * 绑定弹窗事件
     */
    bindModalEvents() {
        this.elements.modalConfirm.addEventListener('click', () => this.handleModalConfirm());
        this.elements.modalCancel.addEventListener('click', () => this.handleModalCancel());
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.modalOverlay) {
                this.handleModalCancel();
            }
        });
    }

    /**
     * 初始化UI事件
     */
    init() {
        this.bindModalEvents();
        
        // 设置滑块实时更新
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            this.updateSettingValue('sfx', e.target.value);
        });
        document.getElementById('music-volume').addEventListener('input', (e) => {
            this.updateSettingValue('music', e.target.value);
        });
        document.getElementById('mouse-sensitivity').addEventListener('input', (e) => {
            this.updateSettingValue('sensitivity', e.target.value);
        });
    }
}
