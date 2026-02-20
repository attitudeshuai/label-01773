# 3D坦克大战 - 战争雷霆风格

一款基于HTML5/CSS/JavaScript的3D坦克大战游戏，灵感来源于战争雷霆。采用Three.js实现3D渲染，提供简单直观的操作体验和明确的成长反馈系统。

## How to Run

```bash
# 使用 Docker Compose 启动项目
docker-compose up --build -d

# 访问游戏
# 打开浏览器访问: http://localhost:8081
```

## Services

| 服务名称 | 端口 | 描述 |
|---------|------|------|
| frontend-user | 8081 | 3D坦克大战游戏客户端 |

## 测试

1. 启动服务后访问 http://localhost:8081
2. 游戏操作测试：
   - WASD 控制坦克移动
   - 鼠标控制炮塔方向
   - 左键开火
   - 空格键加速
3. 验证功能：
   - 坦克移动和转向是否流畅
   - 炮弹发射和命中检测
   - 敌人AI行为
   - 经验值和升级系统
   - 音效和视觉反馈

---

## 项目介绍

### 核心特性

- **零学习成本**：凭直觉即可开始游戏，无需教程
- **明确成长系统**：击杀敌人获得经验，5分钟内可感受到明显变强
- **正向反馈循环**：简单操作 + 明确成长 + 即时奖励

### 游戏玩法

- 控制坦克在3D战场中战斗
- 击毁敌方坦克获得经验值
- 升级解锁更强的属性加成
- 收集战场上的补给品

### 技术栈

- Three.js - 3D渲染引擎
- 原生JavaScript - 游戏逻辑
- HTML5/CSS3 - 界面布局
- Nginx - 静态文件服务

### 项目结构

```
├── frontend-user/          # 游戏客户端
│   ├── index.html         # 主页面
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript模块
│   │   ├── main.js        # 游戏入口
│   │   ├── game.js        # 游戏核心逻辑
│   │   ├── tank.js        # 坦克类
│   │   ├── enemy.js       # 敌人AI
│   │   ├── bullet.js      # 炮弹系统
│   │   ├── terrain.js     # 地形生成
│   │   ├── ui.js          # UI管理
│   │   ├── audio.js       # 音效系统
│   │   └── upgrade.js     # 升级系统
│   ├── assets/            # 游戏资源
│   ├── Dockerfile         # Docker构建文件
│   └── nginx.conf         # Nginx配置
├── docker-compose.yml     # Docker编排文件
├── .gitignore            # Git忽略配置
└── README.md             # 项目说明
```
