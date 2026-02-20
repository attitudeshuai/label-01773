/**
 * 坦克类
 * 玩家和敌人坦克的基类
 */
class Tank {
    constructor(scene, isPlayer = false) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.isAlive = true;
        
        // 属性
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.moveSpeed = 15;
        this.rotationSpeed = 2;
        this.turretRotationSpeed = 3;
        this.damage = 25;
        this.fireRate = 1; // 每秒射击次数
        this.lastFireTime = 0;
        
        // 3D模型
        this.mesh = null;
        this.turret = null;
        this.barrel = null;
        
        // 创建坦克模型
        this.createModel();
    }

    /**
     * 创建坦克3D模型
     */
    createModel() {
        this.mesh = new THREE.Group();
        
        // 坦克颜色
        const bodyColor = this.isPlayer ? 0x2d5a27 : 0x8b0000;
        const trackColor = 0x333333;
        
        // 车身
        const bodyGeometry = new THREE.BoxGeometry(3, 1.2, 5);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.7,
            metalness: 0.3
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        
        // 履带
        const trackGeometry = new THREE.BoxGeometry(0.8, 0.6, 5.2);
        const trackMaterial = new THREE.MeshStandardMaterial({
            color: trackColor,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        leftTrack.position.set(-1.5, 0.3, 0);
        leftTrack.castShadow = true;
        this.mesh.add(leftTrack);
        
        const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        rightTrack.position.set(1.5, 0.3, 0);
        rightTrack.castShadow = true;
        this.mesh.add(rightTrack);
        
        // 炮塔
        this.turret = new THREE.Group();
        
        const turretGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.8, 8);
        const turretMaterial = new THREE.MeshStandardMaterial({
            color: bodyColor,
            roughness: 0.6,
            metalness: 0.4
        });
        const turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
        turretMesh.castShadow = true;
        this.turret.add(turretMesh);
        
        // 炮管
        const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.2, 4, 8);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.5,
            metalness: 0.5
        });
        this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrel.rotation.x = Math.PI / 2;
        this.barrel.position.z = 2;
        this.barrel.castShadow = true;
        this.turret.add(this.barrel);
        
        this.turret.position.y = 1.8;
        this.mesh.add(this.turret);
        
        // 添加细节
        this.addDetails(bodyColor);
        
        this.scene.add(this.mesh);
    }

    /**
     * 添加坦克细节
     */
    addDetails(color) {
        // 指挥塔
        const cupola = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.3 })
        );
        cupola.position.set(-0.5, 0.5, -0.3);
        cupola.castShadow = true;
        this.turret.add(cupola);
        
        // 天线
        if (this.isPlayer) {
            const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4),
                new THREE.MeshBasicMaterial({ color: 0x333333 })
            );
            antenna.position.set(0.8, 1, -1);
            this.turret.add(antenna);
        }
    }

    /**
     * 设置位置
     */
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    /**
     * 获取位置
     */
    getPosition() {
        return this.mesh.position.clone();
    }

    /**
     * 获取前进方向
     */
    getForward() {
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.mesh.quaternion);
        return forward;
    }

    /**
     * 获取炮塔朝向
     */
    getTurretDirection() {
        const direction = new THREE.Vector3(0, 0, 1);
        const worldQuaternion = new THREE.Quaternion();
        this.turret.getWorldQuaternion(worldQuaternion);
        direction.applyQuaternion(worldQuaternion);
        return direction;
    }

    /**
     * 获取炮口位置
     */
    getMuzzlePosition() {
        const muzzleOffset = new THREE.Vector3(0, 0, 4);
        const worldQuaternion = new THREE.Quaternion();
        this.turret.getWorldQuaternion(worldQuaternion);
        muzzleOffset.applyQuaternion(worldQuaternion);
        
        const position = this.mesh.position.clone();
        position.y = 1.8;
        position.add(muzzleOffset);
        
        return position;
    }

    /**
     * 移动坦克
     */
    move(direction, deltaTime) {
        if (!this.isAlive) return;
        
        const movement = this.getForward().multiplyScalar(direction * this.moveSpeed * deltaTime);
        this.mesh.position.add(movement);
    }

    /**
     * 旋转坦克
     */
    rotate(direction, deltaTime) {
        if (!this.isAlive) return;
        
        this.mesh.rotation.y += direction * this.rotationSpeed * deltaTime;
    }

    /**
     * 旋转炮塔
     */
    rotateTurret(targetAngle, deltaTime) {
        if (!this.isAlive) return;
        
        // 计算当前炮塔世界角度
        const currentAngle = this.turret.rotation.y + this.mesh.rotation.y;
        
        // 计算角度差
        let angleDiff = targetAngle - currentAngle;
        
        // 归一化到 -PI 到 PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 平滑旋转
        const maxRotation = this.turretRotationSpeed * deltaTime;
        const rotation = Math.max(-maxRotation, Math.min(maxRotation, angleDiff));
        
        this.turret.rotation.y += rotation;
    }

    /**
     * 瞄准目标点
     */
    aimAt(targetPosition) {
        const direction = targetPosition.clone().sub(this.mesh.position);
        const angle = Math.atan2(direction.x, direction.z);
        return angle;
    }

    /**
     * 检查是否可以开火
     */
    canFire() {
        const now = performance.now() / 1000;
        return this.isAlive && (now - this.lastFireTime) >= (1 / this.fireRate);
    }

    /**
     * 开火
     */
    fire(bulletManager) {
        if (!this.canFire()) return null;
        
        this.lastFireTime = performance.now() / 1000;
        
        const muzzlePos = this.getMuzzlePosition();
        const direction = this.getTurretDirection();
        
        return bulletManager.createBullet(muzzlePos, direction, this.isPlayer, this.damage);
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health -= amount;
        
        // 受伤闪烁效果
        this.flashDamage();
        
        // 玩家受伤时触发UI效果
        if (this.isPlayer && typeof game !== 'undefined' && game.ui) {
            game.ui.showDamageIndicator();
        }
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    /**
     * 受伤闪烁
     */
    flashDamage() {
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                const originalColor = child.material.color.clone();
                child.material.color.setHex(0xff0000);
                
                setTimeout(() => {
                    child.material.color.copy(originalColor);
                }, 100);
            }
        });
    }

    /**
     * 死亡
     */
    die() {
        this.isAlive = false;
        this.createExplosion();
    }

    /**
     * 创建爆炸效果
     */
    createExplosion() {
        const position = this.mesh.position.clone();
        
        // 爆炸球
        const explosionGeometry = new THREE.SphereGeometry(3, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.copy(position);
        explosion.position.y = 1;
        this.scene.add(explosion);
        
        // 动画
        let scale = 1;
        const animate = () => {
            scale += 0.15;
            explosion.scale.setScalar(scale);
            explosion.material.opacity -= 0.05;
            
            if (explosion.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(explosion);
                explosionGeometry.dispose();
                explosionMaterial.dispose();
                
                // 移除坦克模型
                this.scene.remove(this.mesh);
            }
        };
        animate();
        
        // 播放爆炸音效
        audioManager.playExplosion();
    }

    /**
     * 治疗
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * 升级属性
     */
    upgrade(stats) {
        if (stats.maxHealth) {
            this.maxHealth += stats.maxHealth;
            this.health += stats.maxHealth;
        }
        if (stats.damage) this.damage += stats.damage;
        if (stats.moveSpeed) this.moveSpeed += stats.moveSpeed;
        if (stats.fireRate) this.fireRate += stats.fireRate;
    }

    /**
     * 更新
     */
    update(deltaTime) {
        // 子类实现
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}
