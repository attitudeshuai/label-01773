/**
 * 敌人AI系统
 * 管理敌人坦克的行为和生成
 */
class EnemyManager {
    constructor(scene, terrain, bulletManager) {
        this.scene = scene;
        this.terrain = terrain;
        this.bulletManager = bulletManager;
        this.enemies = [];
        
        // 敌人配置
        this.maxEnemies = 5;
        this.spawnInterval = 8; // 秒
        this.lastSpawnTime = 0;
        this.difficultyMultiplier = 1;
        
        // 经验值奖励
        this.baseExpReward = 50;
    }

    /**
     * 生成敌人
     */
    spawnEnemy(playerLevel = 1) {
        if (this.enemies.length >= this.maxEnemies) return null;
        
        const enemy = new EnemyTank(this.scene, this.terrain, playerLevel, this.difficultyMultiplier);
        
        // 获取出生点
        const spawnPoint = this.terrain.getRandomSpawnPoint();
        enemy.setPosition(spawnPoint.x, 0, spawnPoint.z);
        
        this.enemies.push(enemy);
        console.log(`[Enemy] 生成敌人，当前数量: ${this.enemies.length}`);
        
        return enemy;
    }

    /**
     * 更新所有敌人
     */
    update(deltaTime, playerTank, playerLevel) {
        const now = performance.now() / 1000;
        
        // 检查是否需要生成新敌人
        if (now - this.lastSpawnTime > this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy(playerLevel);
            this.lastSpawnTime = now;
        }
        
        // 更新每个敌人
        const deadEnemies = [];
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            if (!enemy.isAlive) {
                deadEnemies.push(i);
                continue;
            }
            
            // 更新AI
            enemy.updateAI(deltaTime, playerTank, this.bulletManager);
        }
        
        // 移除死亡的敌人
        for (let i = deadEnemies.length - 1; i >= 0; i--) {
            const index = deadEnemies[i];
            const enemy = this.enemies[index];
            
            // 返回经验值奖励
            const expReward = this.baseExpReward * (1 + (enemy.level - 1) * 0.2);
            
            this.enemies.splice(index, 1);
        }
        
        return deadEnemies.length;
    }

    /**
     * 获取所有存活的敌人
     */
    getAliveEnemies() {
        return this.enemies.filter(e => e.isAlive);
    }

    /**
     * 获取经验值奖励
     */
    getExpReward(enemyLevel = 1) {
        return Math.floor(this.baseExpReward * (1 + (enemyLevel - 1) * 0.2));
    }

    /**
     * 增加难度
     */
    increaseDifficulty() {
        this.difficultyMultiplier += 0.1;
        this.spawnInterval = Math.max(3, this.spawnInterval - 0.5);
        this.maxEnemies = Math.min(10, this.maxEnemies + 1);
        
        console.log(`[Enemy] 难度提升: 倍率=${this.difficultyMultiplier.toFixed(1)}, 间隔=${this.spawnInterval}s, 最大数量=${this.maxEnemies}`);
    }

    /**
     * 清除所有敌人
     */
    clearAll() {
        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];
    }

    /**
     * 重置
     */
    reset() {
        this.clearAll();
        this.difficultyMultiplier = 1;
        this.spawnInterval = 8;
        this.maxEnemies = 5;
        this.lastSpawnTime = 0;
    }
}

/**
 * 敌人坦克类
 */
class EnemyTank extends Tank {
    constructor(scene, terrain, playerLevel, difficultyMultiplier) {
        super(scene, false);
        
        this.terrain = terrain;
        this.level = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);
        
        // 根据等级和难度调整属性
        const levelBonus = (this.level - 1) * 0.15;
        const diffBonus = (difficultyMultiplier - 1) * 0.5;
        
        this.maxHealth = Math.floor(80 * (1 + levelBonus + diffBonus));
        this.health = this.maxHealth;
        this.damage = Math.floor(20 * (1 + levelBonus * 0.5));
        this.moveSpeed = 8 + levelBonus * 2;
        this.fireRate = 0.5 + levelBonus * 0.1;
        
        // AI状态
        this.state = 'patrol'; // patrol, chase, attack, retreat
        this.targetPosition = null;
        this.stateTimer = 0;
        this.detectionRange = 50;
        this.attackRange = 35;
        this.retreatHealth = 0.3;
        
        // 巡逻点
        this.patrolTarget = this.getRandomPatrolPoint();
    }

    /**
     * 获取随机巡逻点
     */
    getRandomPatrolPoint() {
        const mapSize = this.terrain.getMapSize();
        const margin = 20;
        
        return new THREE.Vector3(
            (Math.random() - 0.5) * (mapSize - margin * 2),
            0,
            (Math.random() - 0.5) * (mapSize - margin * 2)
        );
    }

    /**
     * 更新AI
     */
    updateAI(deltaTime, playerTank, bulletManager) {
        if (!this.isAlive || !playerTank || !playerTank.isAlive) return;
        
        const playerPos = playerTank.getPosition();
        const myPos = this.getPosition();
        const distanceToPlayer = myPos.distanceTo(playerPos);
        
        // 更新状态计时器
        this.stateTimer += deltaTime;
        
        // 状态机
        switch (this.state) {
            case 'patrol':
                this.doPatrol(deltaTime, distanceToPlayer);
                break;
            case 'chase':
                this.doChase(deltaTime, playerPos, distanceToPlayer);
                break;
            case 'attack':
                this.doAttack(deltaTime, playerPos, distanceToPlayer, bulletManager);
                break;
            case 'retreat':
                this.doRetreat(deltaTime, playerPos);
                break;
        }
        
        // 状态转换检查
        this.checkStateTransition(distanceToPlayer);
    }

    /**
     * 巡逻行为
     */
    doPatrol(deltaTime, distanceToPlayer) {
        // 检测到玩家
        if (distanceToPlayer < this.detectionRange) {
            this.state = 'chase';
            this.stateTimer = 0;
            return;
        }
        
        // 移动到巡逻点
        const myPos = this.getPosition();
        const distToTarget = myPos.distanceTo(this.patrolTarget);
        
        if (distToTarget < 5 || this.stateTimer > 10) {
            this.patrolTarget = this.getRandomPatrolPoint();
            this.stateTimer = 0;
        }
        
        this.moveTowards(this.patrolTarget, deltaTime, 0.5);
    }

    /**
     * 追击行为
     */
    doChase(deltaTime, playerPos, distanceToPlayer) {
        // 进入攻击范围
        if (distanceToPlayer < this.attackRange) {
            this.state = 'attack';
            this.stateTimer = 0;
            return;
        }
        
        // 丢失目标
        if (distanceToPlayer > this.detectionRange * 1.5) {
            this.state = 'patrol';
            this.stateTimer = 0;
            return;
        }
        
        this.moveTowards(playerPos, deltaTime, 1);
    }

    /**
     * 攻击行为
     */
    doAttack(deltaTime, playerPos, distanceToPlayer, bulletManager) {
        // 瞄准玩家
        const targetAngle = this.aimAt(playerPos);
        this.rotateTurret(targetAngle, deltaTime);
        
        // 保持距离
        if (distanceToPlayer < 15) {
            // 后退
            this.move(-1, deltaTime * 0.5);
        } else if (distanceToPlayer > this.attackRange * 0.8) {
            // 靠近
            this.moveTowards(playerPos, deltaTime, 0.5);
        }
        
        // 开火
        if (this.canFire()) {
            // 检查瞄准精度
            const turretDir = this.getTurretDirection();
            const toPlayer = playerPos.clone().sub(this.getPosition()).normalize();
            const aimAccuracy = turretDir.dot(toPlayer);
            
            if (aimAccuracy > 0.95) {
                this.fire(bulletManager);
                audioManager.playShoot();
            }
        }
        
        // 检查是否需要撤退
        if (this.health / this.maxHealth < this.retreatHealth) {
            this.state = 'retreat';
            this.stateTimer = 0;
        }
    }

    /**
     * 撤退行为
     */
    doRetreat(deltaTime, playerPos) {
        // 远离玩家
        const myPos = this.getPosition();
        const awayDir = myPos.clone().sub(playerPos).normalize();
        const retreatTarget = myPos.clone().add(awayDir.multiplyScalar(30));
        
        this.moveTowards(retreatTarget, deltaTime, 1);
        
        // 恢复后重新进攻
        if (this.health / this.maxHealth > 0.5 || this.stateTimer > 5) {
            this.state = 'patrol';
            this.stateTimer = 0;
        }
    }

    /**
     * 检查状态转换
     */
    checkStateTransition(distanceToPlayer) {
        // 低血量优先撤退
        if (this.health / this.maxHealth < this.retreatHealth && this.state !== 'retreat') {
            this.state = 'retreat';
            this.stateTimer = 0;
        }
    }

    /**
     * 移动到目标点
     */
    moveTowards(target, deltaTime, speedMultiplier = 1) {
        const myPos = this.getPosition();
        const direction = target.clone().sub(myPos);
        direction.y = 0;
        
        if (direction.length() < 1) return;
        
        // 计算目标角度
        const targetAngle = Math.atan2(direction.x, direction.z);
        const currentAngle = this.mesh.rotation.y;
        
        // 计算角度差
        let angleDiff = targetAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 旋转
        const rotateDir = angleDiff > 0 ? 1 : -1;
        this.rotate(rotateDir, deltaTime * Math.min(Math.abs(angleDiff), 1));
        
        // 如果朝向大致正确，前进
        if (Math.abs(angleDiff) < Math.PI / 4) {
            const newPos = myPos.clone().add(this.getForward().multiplyScalar(this.moveSpeed * deltaTime * speedMultiplier));
            
            // 检查碰撞
            if (this.terrain.isValidPosition(newPos)) {
                this.move(1, deltaTime * speedMultiplier);
            } else {
                // 尝试绕行
                this.rotate(1, deltaTime * 2);
            }
        }
    }
}
