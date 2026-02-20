/**
 * 游戏入口
 * 初始化并启动游戏
 */

// 全局游戏实例
let game = null;

/**
 * 页面加载完成后初始化游戏
 */
window.addEventListener('DOMContentLoaded', async () => {
    console.log('=== 3D坦克大战 - 战争雷霆风格 ===');
    console.log('版本: 1.0.0');
    console.log('技术栈: HTML5 + Three.js');
    
    try {
        // 检查WebGL支持
        if (!checkWebGLSupport()) {
            showError('您的浏览器不支持WebGL，无法运行游戏。请使用现代浏览器（Chrome、Firefox、Edge等）。');
            return;
        }
        
        // 创建并初始化游戏
        game = new Game();
        await game.init();
        
        console.log('[Main] 游戏初始化成功');
        
    } catch (error) {
        console.error('[Main] 游戏初始化失败:', error);
        showError('游戏加载失败，请刷新页面重试。');
    }
});

/**
 * 检查WebGL支持
 */
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

/**
 * 显示错误信息
 */
function showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.innerHTML = `
            <div class="loading-content">
                <h1 style="color: #e74c3c;">错误</h1>
                <p style="color: #fff; margin-top: 20px;">${message}</p>
            </div>
        `;
    }
}

/**
 * 防止右键菜单
 */
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

/**
 * 防止拖拽
 */
document.addEventListener('dragstart', (e) => {
    e.preventDefault();
});

/**
 * 页面可见性变化处理
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && game.isRunning && !game.isPaused) {
        game.pauseGame();
    }
});

/**
 * 添加CSS动画
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
`;
document.head.appendChild(style);
