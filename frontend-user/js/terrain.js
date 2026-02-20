/**
 * 地形生成系统
 * 创建3D战场环境
 */
class TerrainManager {
    constructor(scene) {
        this.scene = scene;
        this.mapSize = 200;
        this.obstacles = [];
        this.spawnPoints = [];
    }

    /**
     * 生成完整地形
     */
    generate() {
        this.createGround();
        this.createSkybox();
        this.createObstacles();
        this.createBoundary();
        this.setupLighting();
        this.generateSpawnPoints();
        
        console.log('[Terrain] 地形生成完成');
    }

    /**
     * 创建地面
     */
    createGround() {
        // 地面几何体
        const groundGeometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize, 50, 50);
        
        // 添加地形起伏
        const vertices = groundGeometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            // 轻微的地形起伏
            vertices[i + 2] = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 1.5;
        }
        groundGeometry.computeVertexNormals();
        
        // 地面材质 - 沙漠/泥土色
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.name = 'ground';
        
        this.scene.add(ground);
        
        // 添加网格辅助线（调试用，可注释）
        // const gridHelper = new THREE.GridHelper(this.mapSize, 40, 0x444444, 0x222222);
        // this.scene.add(gridHelper);
    }

    /**
     * 创建天空盒
     */
    createSkybox() {
        // 渐变天空
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077be) },
                bottomColor: { value: new THREE.Color(0xffffff) },
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }

    /**
     * 创建障碍物
     */
    createObstacles() {
        const obstacleCount = 30;
        
        for (let i = 0; i < obstacleCount; i++) {
            const type = Math.random();
            let obstacle;
            
            if (type < 0.4) {
                // 建筑物/掩体
                obstacle = this.createBuilding();
            } else if (type < 0.7) {
                // 岩石
                obstacle = this.createRock();
            } else {
                // 残骸
                obstacle = this.createDebris();
            }
            
            // 随机位置
            const x = (Math.random() - 0.5) * (this.mapSize - 40);
            const z = (Math.random() - 0.5) * (this.mapSize - 40);
            
            obstacle.position.set(x, 0, z);
            obstacle.rotation.y = Math.random() * Math.PI * 2;
            
            this.scene.add(obstacle);
            this.obstacles.push({
                mesh: obstacle,
                boundingBox: new THREE.Box3().setFromObject(obstacle)
            });
        }
    }

    /**
     * 创建建筑物
     */
    createBuilding() {
        const group = new THREE.Group();
        
        const width = 5 + Math.random() * 8;
        const height = 3 + Math.random() * 6;
        const depth = 5 + Math.random() * 8;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.8,
            metalness: 0.2
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        
        group.add(building);
        
        // 添加一些细节
        if (Math.random() > 0.5) {
            const roofGeometry = new THREE.BoxGeometry(width * 0.8, 1, depth * 0.8);
            const roof = new THREE.Mesh(roofGeometry, material);
            roof.position.y = height + 0.5;
            roof.castShadow = true;
            group.add(roof);
        }
        
        return group;
    }

    /**
     * 创建岩石
     */
    createRock() {
        const geometry = new THREE.DodecahedronGeometry(2 + Math.random() * 3, 1);
        
        // 随机变形
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i] += (Math.random() - 0.5) * 0.5;
            vertices[i + 1] += (Math.random() - 0.5) * 0.5;
            vertices[i + 2] += (Math.random() - 0.5) * 0.5;
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 1,
            metalness: 0,
            flatShading: true
        });
        
        const rock = new THREE.Mesh(geometry, material);
        rock.position.y = 1;
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        return rock;
    }

    /**
     * 创建残骸
     */
    createDebris() {
        const group = new THREE.Group();
        
        // 破损的坦克残骸
        const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            roughness: 0.9,
            metalness: 0.3
        });
        
        const body = new THREE.Mesh(bodyGeometry, material);
        body.position.y = 0.75;
        body.rotation.z = (Math.random() - 0.5) * 0.3;
        body.castShadow = true;
        
        group.add(body);
        
        // 炮塔残骸
        if (Math.random() > 0.3) {
            const turretGeometry = new THREE.CylinderGeometry(1.2, 1.5, 1, 8);
            const turret = new THREE.Mesh(turretGeometry, material);
            turret.position.set(
                (Math.random() - 0.5) * 3,
                0.5,
                (Math.random() - 0.5) * 3
            );
            turret.rotation.x = Math.random() * 0.5;
            turret.castShadow = true;
            group.add(turret);
        }
        
        return group;
    }

    /**
     * 创建边界
     */
    createBoundary() {
        const wallHeight = 8;
        const wallThickness = 2;
        const halfSize = this.mapSize / 2;
        
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // 四面墙
        const walls = [
            { pos: [0, wallHeight / 2, -halfSize], size: [this.mapSize, wallHeight, wallThickness] },
            { pos: [0, wallHeight / 2, halfSize], size: [this.mapSize, wallHeight, wallThickness] },
            { pos: [-halfSize, wallHeight / 2, 0], size: [wallThickness, wallHeight, this.mapSize] },
            { pos: [halfSize, wallHeight / 2, 0], size: [wallThickness, wallHeight, this.mapSize] }
        ];
        
        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(...wall.size);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(...wall.pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        });
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        // 主方向光（太阳）
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // 半球光
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.3);
        this.scene.add(hemiLight);
    }

    /**
     * 生成出生点
     */
    generateSpawnPoints() {
        const count = 10;
        const margin = 20;
        
        for (let i = 0; i < count; i++) {
            let validPoint = false;
            let attempts = 0;
            
            while (!validPoint && attempts < 50) {
                const x = (Math.random() - 0.5) * (this.mapSize - margin * 2);
                const z = (Math.random() - 0.5) * (this.mapSize - margin * 2);
                
                // 检查是否与障碍物重叠
                const testBox = new THREE.Box3(
                    new THREE.Vector3(x - 5, 0, z - 5),
                    new THREE.Vector3(x + 5, 5, z + 5)
                );
                
                let collision = false;
                for (const obstacle of this.obstacles) {
                    if (testBox.intersectsBox(obstacle.boundingBox)) {
                        collision = true;
                        break;
                    }
                }
                
                if (!collision) {
                    this.spawnPoints.push(new THREE.Vector3(x, 0, z));
                    validPoint = true;
                }
                
                attempts++;
            }
        }
        
        console.log(`[Terrain] 生成了 ${this.spawnPoints.length} 个出生点`);
    }

    /**
     * 获取随机出生点
     */
    getRandomSpawnPoint() {
        if (this.spawnPoints.length === 0) {
            return new THREE.Vector3(0, 0, 0);
        }
        const index = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[index].clone();
    }

    /**
     * 检查位置是否有效（不与障碍物碰撞）
     */
    isValidPosition(position, radius = 3) {
        const testBox = new THREE.Box3(
            new THREE.Vector3(position.x - radius, 0, position.z - radius),
            new THREE.Vector3(position.x + radius, 5, position.z + radius)
        );
        
        // 检查边界
        const halfSize = this.mapSize / 2 - 5;
        if (Math.abs(position.x) > halfSize || Math.abs(position.z) > halfSize) {
            return false;
        }
        
        // 检查障碍物
        for (const obstacle of this.obstacles) {
            if (testBox.intersectsBox(obstacle.boundingBox)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 获取地图尺寸
     */
    getMapSize() {
        return this.mapSize;
    }
}
