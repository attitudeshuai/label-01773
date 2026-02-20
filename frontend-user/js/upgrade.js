/**
 * 升级系统
 * 管理玩家等级和属性成长
 */
class UpgradeSystem {
    constructor() {
        this.level = 1;
        this.experience = 0;
        this.totalExperience = 0;
        
        // 经验值曲线
        this.baseExpRequired = 100;
        this.expGrowthRate = 1.5;
        
        // 每级属性加成
        this.levelBonuses = {
            maxHealth: 10,      // 每级+10血量
            damage: 3,          // 每级+3伤害
            moveSpeed: 0.5,     // 每级+0.5移动速度
            fireRate: 0.05      // 每级+0.05射速
        };
        
        // 里程碑奖励（特定等级的额外奖励）
        this.milestones = {
            5: { maxHealth: 20, damage: 5 },
            10: { maxHealth: 30, damage: 10, fireRate: 0.1 },
            15: { maxHealth: 40, damage: 15, moveSpeed: 1 },
            20: { maxHealth: 50, damage: 20, fireRate: 0.15 }
        };
    }

    /**
     * 获取升级所需经验
     */
    getExpRequired() {
        return Math.floor(this.baseExpRequired * Math.pow(this.expGrowthRate, this.level - 1));
    }

    /**
     * 添加经验值
     * @returns {Object|null} 如果升级，返回升级信息
     */
    addExperience(amount) {
        this.experience += amount;
        this.totalExperience += amount;
        
        const expRequired = this.getExpRequired();
        
        if (this.experience >= expRequired) {
            return this.levelUp();
        }
        
        return null;
    }

    /**
     * 升级
     */
    levelUp() {
        const expRequired = this.getExpRequired();
        this.experience -= expRequired;
        this.level++;
        
        // 计算属性加成
        const bonuses = { ...this.levelBonuses };
        
        // 检查里程碑奖励
        if (this.milestones[this.level]) {
            const milestone = this.milestones[this.level];
            for (const key in milestone) {
                bonuses[key] = (bonuses[key] || 0) + milestone[key];
            }
        }
        
        console.log(`[Upgrade] 升级到 ${this.level} 级!`, bonuses);
        
        return {
            level: this.level,
            bonuses: bonuses,
            isMilestone: !!this.milestones[this.level]
        };
    }

    /**
     * 获取当前进度百分比
     */
    getProgressPercent() {
        return (this.experience / this.getExpRequired()) * 100;
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            level: this.level,
            experience: this.experience,
            expRequired: this.getExpRequired(),
            totalExperience: this.totalExperience,
            progressPercent: this.getProgressPercent()
        };
    }

    /**
     * 重置
     */
    reset() {
        this.level = 1;
        this.experience = 0;
        this.totalExperience = 0;
    }

    /**
     * 获取等级描述
     */
    getLevelTitle() {
        if (this.level >= 20) return '传奇指挥官';
        if (this.level >= 15) return '精英车长';
        if (this.level >= 10) return '老练士兵';
        if (this.level >= 5) return '熟练新兵';
        return '新兵';
    }
}

/**
 * 补给品系统
 */
class PickupManager {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.pickups = [];
        
        this.spawnInterval = 15; // 秒
        this.lastSpawnTime = 0;
        this.maxPickups = 5;
    }

    /**
     * 生成补给品
     */
    spawnPickup() {
        if (this.pickups.length >= this.maxPickups) return;
        
        const types = ['health', 'damage', 'speed'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const pickup = this.createPickup(type);
        
        // 随机位置
        const spawnPoint = this.terrain.getRandomSpawnPoint();
        pickup.mesh.position.set(spawnPoint.x, 1, spawnPoint.z);
        
        this.scene.add(pickup.mesh);
        this.pickups.push(pickup);
    }

    /**
     * 创建补给品
     */
    createPickup(type) {
        const colors = {
            health: 0x2ecc71,
            damage: 0xe74c3c,
            speed: 0x3498db
        };
        
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshStandardMaterial({
            color: colors[type],
            emissive: colors[type],
            emissiveIntensity: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        
        // 添加发光效果
        const glowGeometry = new THREE.BoxGeometry(2, 2, 2);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: colors[type],
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
        
        return {
            mesh: mesh,
            type: type,
            rotationSpeed: 1 + Math.random()
        };
    }

    /**
     * 更新补给品
     */
    update(deltaTime, playerTank) {
        const now = performance.now() / 1000;
        
        // 生成新补给品
        if (now - this.lastSpawnTime > this.spawnInterval) {
            this.spawnPickup();
            this.lastSpawnTime = now;
        }
        
        // 更新和检测碰撞
        const collected = [];
        
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // 旋转动画
            pickup.mesh.rotation.y += pickup.rotationSpeed * deltaTime;
            pickup.mesh.position.y = 1 + Math.sin(now * 2) * 0.3;
            
            // 检测与玩家的碰撞
            if (playerTank && playerTank.isAlive) {
                const distance = pickup.mesh.position.distanceTo(playerTank.getPosition());
                
                if (distance < 3) {
                    collected.push({
                        index: i,
                        type: pickup.type
                    });
                }
            }
        }
        
        // 移除收集的补给品
        for (const item of collected) {
            this.removePickup(item.index);
        }
        
        return collected.map(c => c.type);
    }

    /**
     * 移除补给品
     */
    removePickup(index) {
        const pickup = this.pickups[index];
        if (pickup) {
            this.scene.remove(pickup.mesh);
            pickup.mesh.geometry.dispose();
            pickup.mesh.material.dispose();
            this.pickups.splice(index, 1);
        }
    }

    /**
     * 清除所有补给品
     */
    clearAll() {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            this.removePickup(i);
        }
    }

    /**
     * 应用补给品效果
     */
    applyEffect(type, playerTank) {
        switch (type) {
            case 'health':
                playerTank.heal(30);
                return '生命值 +30';
            case 'damage':
                playerTank.damage += 5;
                return '攻击力 +5';
            case 'speed':
                playerTank.moveSpeed += 2;
                return '移动速度 +2';
        }
        return '获得补给';
    }
}
