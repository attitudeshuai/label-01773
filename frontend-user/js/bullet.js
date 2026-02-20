/**
 * 炮弹系统
 * 管理炮弹的创建、移动和碰撞检测
 */
class BulletManager {
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
        this.bulletSpeed = 80;
        this.bulletDamage = 25;
        
        // 炮弹几何体和材质（复用）
        this.bulletGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        this.playerBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.enemyBulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 });
    }

    /**
     * 创建炮弹
     */
    createBullet(position, direction, isPlayer = true, damage = null) {
        const material = isPlayer ? this.playerBulletMaterial : this.enemyBulletMaterial;
        const bullet = new THREE.Mesh(this.bulletGeometry, material);
        
        bullet.position.copy(position);
        bullet.position.y = 1.5; // 炮口高度
        
        // 添加发光效果
        const glowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: isPlayer ? 0xffff00 : 0xff4444,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        bullet.add(glow);
        
        this.scene.add(bullet);
        
        const bulletData = {
            mesh: bullet,
            direction: direction.clone().normalize(),
            isPlayer: isPlayer,
            damage: damage || this.bulletDamage,
            lifetime: 3, // 秒
            speed: this.bulletSpeed
        };
        
        this.bullets.push(bulletData);
        
        // 创建炮口火焰效果
        this.createMuzzleFlash(position);
        
        return bulletData;
    }

    /**
     * 创建炮口火焰
     */
    createMuzzleFlash(position) {
        const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.8
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        flash.position.y = 1.5;
        
        this.scene.add(flash);
        
        // 动画消失
        let scale = 1;
        const animate = () => {
            scale -= 0.1;
            if (scale <= 0) {
                this.scene.remove(flash);
                flashGeometry.dispose();
                flashMaterial.dispose();
                return;
            }
            flash.scale.setScalar(scale);
            flash.material.opacity = scale * 0.8;
            requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * 更新所有炮弹
     */
    update(deltaTime, targets, terrain) {
        const bulletsToRemove = [];
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 更新位置
            bullet.mesh.position.add(
                bullet.direction.clone().multiplyScalar(bullet.speed * deltaTime)
            );
            
            // 更新生命周期
            bullet.lifetime -= deltaTime;
            
            // 检查是否超时或出界
            if (bullet.lifetime <= 0 || this.isOutOfBounds(bullet.mesh.position, terrain)) {
                bulletsToRemove.push(i);
                continue;
            }
            
            // 检查与目标的碰撞
            const hitTarget = this.checkCollision(bullet, targets);
            if (hitTarget) {
                bulletsToRemove.push(i);
                this.createHitEffect(bullet.mesh.position);
            }
            
            // 检查与地形障碍物的碰撞
            if (terrain && this.checkTerrainCollision(bullet, terrain)) {
                bulletsToRemove.push(i);
                this.createHitEffect(bullet.mesh.position);
            }
        }
        
        // 移除需要删除的炮弹
        for (const index of bulletsToRemove) {
            this.removeBullet(index);
        }
    }

    /**
     * 检查是否出界
     */
    isOutOfBounds(position, terrain) {
        if (!terrain) return false;
        const halfSize = terrain.getMapSize() / 2;
        return Math.abs(position.x) > halfSize || 
               Math.abs(position.z) > halfSize ||
               position.y < 0 ||
               position.y > 50;
    }

    /**
     * 检查与目标的碰撞
     */
    checkCollision(bullet, targets) {
        const bulletPos = bullet.mesh.position;
        const hitRadius = 2;
        
        for (const target of targets) {
            if (!target.isAlive) continue;
            
            // 玩家炮弹不能打自己，敌人炮弹不能打敌人
            if (bullet.isPlayer && target.isPlayer) continue;
            if (!bullet.isPlayer && !target.isPlayer) continue;
            
            const targetPos = target.getPosition();
            const distance = bulletPos.distanceTo(targetPos);
            
            if (distance < hitRadius) {
                // 造成伤害
                target.takeDamage(bullet.damage);
                return target;
            }
        }
        
        return null;
    }

    /**
     * 检查与地形的碰撞
     */
    checkTerrainCollision(bullet, terrain) {
        const bulletPos = bullet.mesh.position;
        
        for (const obstacle of terrain.obstacles) {
            if (obstacle.boundingBox.containsPoint(bulletPos)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 创建命中效果
     */
    createHitEffect(position) {
        // 火花粒子
        const particleCount = 10;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xffaa00 : 0xff6600,
                transparent: true,
                opacity: 1
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                Math.random() * 5,
                (Math.random() - 0.5) * 10
            );
            
            this.scene.add(particle);
            particles.push({ mesh: particle, velocity, life: 0.5 });
        }
        
        // 动画粒子
        const animateParticles = () => {
            let allDead = true;
            
            for (const p of particles) {
                if (p.life <= 0) continue;
                allDead = false;
                
                p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
                p.velocity.y -= 9.8 * 0.016;
                p.life -= 0.016;
                p.mesh.material.opacity = p.life * 2;
                p.mesh.scale.setScalar(p.life * 2);
            }
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                // 清理
                for (const p of particles) {
                    this.scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    p.mesh.material.dispose();
                }
            }
        };
        
        animateParticles();
    }

    /**
     * 移除炮弹
     */
    removeBullet(index) {
        const bullet = this.bullets[index];
        if (bullet) {
            this.scene.remove(bullet.mesh);
            bullet.mesh.geometry.dispose();
            this.bullets.splice(index, 1);
        }
    }

    /**
     * 清除所有炮弹
     */
    clearAll() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.removeBullet(i);
        }
    }

    /**
     * 设置炮弹伤害
     */
    setDamage(damage) {
        this.bulletDamage = damage;
    }
}
