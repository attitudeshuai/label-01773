/**
 * 游戏核心类
 * 管理游戏主循环和所有游戏系统
 */
class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        this.terrain = null;
        this.bulletManager = null;
        this.enemyManager = null;
        this.upgradeSystem = null;
        this.pickupManager = null;
        this.ui = null;
        
        this.playerTank = null;
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.kills = 0;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.isPointerLocked = false;
        
        this.cameraOffset = new THREE.Vector3(0, 15, -20);
        this.cameraLookOffset = new THREE.Vector3(0, 0, 10);
        
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.settings = {
            mouseSensitivity: 0.002,
            graphicsQuality: 'medium'
        };
    }

    async init() {
        console.log('[Game] 初始化开始');
        
        this.ui = new UIManager();
        this.ui.init();
        this.ui.updateLoadingProgress(10, '正在初始化渲染器...');
        
        await this.delay(200);
        this.initRenderer();
        this.ui.updateLoadingProgress(30, '正在创建游戏场景...');
        
        await this.delay(200);
        this.initScene();
        this.ui.updateLoadingProgress(50, '正在生成战场地形...');
        
        await this.delay(300);
        this.terrain = new TerrainManager(this.scene);
        this.terrain.generate();
        this.ui.updateLoadingProgress(70, '正在初始化游戏系统...');
        
        await this.delay(200);
        this.bulletManager = new BulletManager(this.scene);
        this.enemyManager = new EnemyManager(this.scene, this.terrain, this.bulletManager);
        this.upgradeSystem = new UpgradeSystem();
        this.pickupManager = new PickupManager(this.scene, this.terrain);
        
        this.ui.updateLoadingProgress(90, '正在绑定控制事件...');
        await this.delay(200);
        
        this.bindEvents();
        
        this.ui.updateLoadingProgress(100, '加载完成！');
        
        await this.delay(500);
        this.ui.hideLoading();
        this.ui.showMainMenu();
        
        console.log('[Game] 初始化完成');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 300);
        
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, -30);
        this.camera.lookAt(0, 0, 0);
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('click', (e) => this.onClick(e));
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        window.addEventListener('resize', () => this.onResize());
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('settings-btn').addEventListener('click', () => this.ui.showSettings());
        document.getElementById('settings-close').addEventListener('click', () => this.ui.hideSettings());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.confirmQuit());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());
        
        document.getElementById('sfx-volume').addEventListener('input', (e) => {
            audioManager.setSfxVolume(e.target.value / 100);
        });
        document.getElementById('music-volume').addEventListener('input', (e) => {
            audioManager.setMusicVolume(e.target.value / 100);
        });
        document.getElementById('mouse-sensitivity').addEventListener('input', (e) => {
            this.settings.mouseSensitivity = e.target.value * 0.001;
        });
    }

    startGame() {
        console.log('[Game] 开始游戏');
        
        audioManager.init();
        this.resetGame();
        
        this.playerTank = new Tank(this.scene, true);
        const spawnPoint = this.terrain.getRandomSpawnPoint();
        this.playerTank.setPosition(spawnPoint.x, 0, spawnPoint.z);
        
        this.ui.hideMainMenu();
        this.ui.hideGameOver();
        this.ui.showGameUI();
        
        this.renderer.domElement.requestPointerLock();
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        this.ui.showToast('info', '战斗开始', '消灭敌人获取经验，不断变强！');
        
        this.gameLoop();
    }

    resetGame() {
        if (this.playerTank) {
            this.playerTank.destroy();
            this.playerTank = null;
        }
        
        this.bulletManager.clearAll();
        this.enemyManager.reset();
        this.pickupManager.clearAll();
        this.upgradeSystem.reset();
        
        this.gameTime = 0;
        this.kills = 0;
        
        this.ui.updateHealth(100, 100);
        this.ui.updateExp(1, 0, 100);
        this.ui.updateKills(0);
        this.ui.updateGameTime(0);
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;
        
        if (this.isPaused) {
            this.renderer.render(this.scene, this.camera);
            return;
        }
        
        this.gameTime += this.deltaTime;
        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    update() {
        if (!this.playerTank || !this.playerTank.isAlive) {
            this.gameOver();
            return;
        }
        
        this.handleInput();
        this.updateCamera();
        
        const allTargets = [this.playerTank, ...this.enemyManager.getAliveEnemies()];
        this.bulletManager.update(this.deltaTime, allTargets, this.terrain);
        
        const deadCount = this.enemyManager.update(this.deltaTime, this.playerTank, this.upgradeSystem.level);
        
        if (deadCount > 0) {
            this.handleKills(deadCount);
        }
        
        const collectedPickups = this.pickupManager.update(this.deltaTime, this.playerTank);
        for (const type of collectedPickups) {
            const message = this.pickupManager.applyEffect(type, this.playerTank);
            this.ui.showPickupNotification(type, message);
        }
        
        this.updateUI();
        
        if (Math.floor(this.gameTime) % 30 === 0 && Math.floor(this.gameTime) > 0) {
            if (!this._lastDifficultyIncrease || this._lastDifficultyIncrease !== Math.floor(this.gameTime)) {
                this._lastDifficultyIncrease = Math.floor(this.gameTime);
                this.enemyManager.increaseDifficulty();
                this.ui.showToast('warning', '难度提升', '敌人变得更强了，小心！');
            }
        }
    }

    handleInput() {
        const tank = this.playerTank;
        if (!tank) return;
        
        let moveDir = 0;
        let rotateDir = 0;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir -= 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) rotateDir += 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) rotateDir -= 1;
        
        const speedMultiplier = this.keys['Space'] ? 1.5 : 1;
        
        if (moveDir !== 0) {
            const newPos = tank.getPosition().clone();
            const forward = tank.getForward();
            newPos.add(forward.multiplyScalar(moveDir * tank.moveSpeed * this.deltaTime * speedMultiplier));
            
            if (this.terrain.isValidPosition(newPos)) {
                tank.move(moveDir * speedMultiplier, this.deltaTime);
            }
        }
        
        if (rotateDir !== 0) {
            tank.rotate(rotateDir, this.deltaTime);
        }
        
        if (this.isPointerLocked) {
            const targetAngle = tank.mesh.rotation.y + this.mouse.x * 0.5;
            tank.rotateTurret(targetAngle, this.deltaTime);
        }
    }

    updateCamera() {
        if (!this.playerTank) return;
        
        const tankPos = this.playerTank.getPosition();
        const tankRotation = this.playerTank.mesh.rotation.y;
        
        const offset = this.cameraOffset.clone();
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), tankRotation);
        
        const targetCameraPos = tankPos.clone().add(offset);
        this.camera.position.lerp(targetCameraPos, 5 * this.deltaTime);
        
        const lookTarget = tankPos.clone();
        lookTarget.add(this.cameraLookOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), tankRotation));
        this.camera.lookAt(lookTarget);
    }

    handleKills(count) {
        for (let i = 0; i < count; i++) {
            this.kills++;
            
            const expGain = this.enemyManager.getExpReward(this.upgradeSystem.level);
            const levelUpInfo = this.upgradeSystem.addExperience(expGain);
            
            this.ui.showKillNotification(expGain);
            audioManager.playHit();
            
            if (levelUpInfo) {
                this.ui.showLevelUp(levelUpInfo.level, levelUpInfo.bonuses);
                this.playerTank.upgrade(levelUpInfo.bonuses);
            }
        }
        
        this.ui.updateKills(this.kills);
    }

    updateUI() {
        if (!this.playerTank) return;
        
        this.ui.updateHealth(this.playerTank.health, this.playerTank.maxHealth);
        
        const status = this.upgradeSystem.getStatus();
        this.ui.updateExp(status.level, status.experience, status.expRequired);
        
        this.ui.updateGameTime(this.gameTime);
        
        this.ui.updateMinimap(
            this.playerTank.getPosition(),
            this.enemyManager.getAliveEnemies(),
            this.terrain.getMapSize()
        );
    }

    gameOver() {
        console.log('[Game] 游戏结束');
        
        this.isRunning = false;
        document.exitPointerLock();
        
        this.ui.showGameOver(this.kills, this.upgradeSystem.level, this.gameTime);
    }

    pauseGame() {
        this.isPaused = true;
        document.exitPointerLock();
        this.ui.showPauseMenu(this.kills, this.upgradeSystem.level, this.gameTime);
    }

    resumeGame() {
        this.isPaused = false;
        this.ui.hidePauseMenu();
        this.renderer.domElement.requestPointerLock();
    }

    confirmQuit() {
        this.ui.showModal({
            type: 'warning',
            icon: '⚠️',
            title: '确认退出',
            message: '确定要退出当前游戏吗？当前进度将不会保存。',
            confirmText: '确定退出',
            cancelText: '继续游戏',
            onConfirm: () => this.quitToMenu(),
            onCancel: () => this.resumeGame()
        });
    }

    quitToMenu() {
        this.isRunning = false;
        this.isPaused = false;
        document.exitPointerLock();
        
        this.resetGame();
        this.ui.hideGameOver();
        this.ui.hidePauseMenu();
        this.ui.showMainMenu();
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Escape' && this.isRunning) {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onMouseMove(e) {
        if (this.isPointerLocked) {
            this.mouse.x += e.movementX * this.settings.mouseSensitivity;
            this.mouse.y += e.movementY * this.settings.mouseSensitivity;
            this.mouse.y = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.mouse.y));
        }
    }

    onClick(e) {
        if (!this.isRunning || this.isPaused) return;
        
        if (!this.isPointerLocked) {
            this.renderer.domElement.requestPointerLock();
            return;
        }
        
        if (this.playerTank && this.playerTank.canFire()) {
            this.playerTank.fire(this.bulletManager);
            audioManager.playShoot();
            this.ui.crosshairFire();
        }
    }

    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
