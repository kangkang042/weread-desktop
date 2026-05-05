// Post-build patch for generated nativefier app
// Adds: titleBarOverlay, dynamic title bar color, frameless window support
const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'WeChatRead-win32-x64', 'resources', 'app', 'lib', 'main.js');

if (!fs.existsSync(mainJsPath)) {
  console.error('main.js not found at', mainJsPath);
  process.exit(1);
}

let content = fs.readFileSync(mainJsPath, 'utf8');

// Patch 1: Add default backgroundColor fallback
const oldBg = 'backgroundColor: options.backgroundColor,';
const newBg = 'backgroundColor: options.backgroundColor || \'#ffffff\',';
if (content.includes(oldBg)) {
  content = content.replace(oldBg, newBg);
  console.log('Patched: backgroundColor default');
} else {
  console.log('WARNING: backgroundColor line not found');
}

// Patch 2: Add titleBarOverlay with custom color for Windows 11 overlay controls
const oldTitleBar = `titleBarStyle: (_a = options.titleBarStyle) !== null && _a !== void 0 ? _a : 'default',`;
const newTitleBar = `titleBarStyle: (_a = options.titleBarStyle) !== null && _a !== void 0 ? _a : 'default',
        titleBarOverlay: { color: '#ffffff', symbolColor: '#1a1a1a' },`;
if (content.includes(oldTitleBar)) {
  content = content.replace(oldTitleBar, newTitleBar);
  console.log('Patched: titleBarOverlay enabled');
} else {
  console.log('WARNING: titleBarStyle line not found');
}

// Patch 3: Add IPC handler for dynamic title bar color + overlay
const oldIpc = `electron_1.ipcMain.on('notification-click', () => {
        log.debug('ipcMain.notification-click');
        mainWindow.show();
    });
    setupSessionInteraction(mainWindow);`;

const newIpc = `electron_1.ipcMain.on('notification-click', () => {
        log.debug('ipcMain.notification-click');
        mainWindow.show();
    });
    electron_1.ipcMain.on('set-titlebar-color', (_event, color) => {
        mainWindow.setBackgroundColor(color);
        try {
            let r, g, b;
            const rgbMatch = color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
            if (rgbMatch) {
                r = parseInt(rgbMatch[1]); g = parseInt(rgbMatch[2]); b = parseInt(rgbMatch[3]);
            } else {
                r = parseInt(color.slice(1, 3), 16);
                g = parseInt(color.slice(3, 5), 16);
                b = parseInt(color.slice(5, 7), 16);
            }
            if (isNaN(r) || isNaN(g) || isNaN(b)) return;
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            mainWindow.setTitleBarOverlay({ color, symbolColor: lum > 0.5 ? '#1a1a1a' : '#ffffff' });
        } catch (_) {}
    });
    setupSessionInteraction(mainWindow);`;

// Patch 4: Fix portable appData path to use persistent %APPDATA% on Windows
// This prevents window state from being lost when the temp extraction dir changes
const oldPortable = `if (appArgs.portable) {
    log.debug('App was built as portable; setting appData and userData to the app folder: ', path.resolve(path.join(__dirname, '..', 'appData')));
    electron_1.app.setPath('appData', path.join(__dirname, '..', 'appData'));
    electron_1.app.setPath('userData', path.join(__dirname, '..', 'appData'));
}`;

const newPortable = `if (appArgs.portable) {
    let portableAppData;
    if (process.platform === 'win32') {
        try { portableAppData = electron_1.app.getPath('appData'); } catch (_) {}
        if (!portableAppData) portableAppData = path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming'), 'WeChatRead');
    } else {
        portableAppData = path.join(__dirname, '..', 'appData');
    }
    log.debug('App was built as portable; setting appData and userData to: ', portableAppData);
    electron_1.app.setPath('appData', portableAppData);
    electron_1.app.setPath('userData', portableAppData);
}`;

if (content.includes(oldPortable)) {
  content = content.replace(oldPortable, newPortable);
  console.log('Patched: portable appData path (persistent)');
} else {
  console.log('WARNING: portable appData block not found');
}

// Patch 5: Use saved mainWindowState.x/y for initial window position
// Fixes window position not being restored along with size
const oldWindowPos = `x: options.x,
        y: options.y,`;

const newWindowPos = `x: mainWindowState.x !== undefined && mainWindowState.x !== null ? mainWindowState.x : options.x,
        y: mainWindowState.y !== undefined && mainWindowState.y !== null ? mainWindowState.y : options.y,`;

if (content.includes(oldWindowPos)) {
  content = content.replace(oldWindowPos, newWindowPos);
  console.log('Patched: window position restores from saved state');
} else {
  console.log('WARNING: window x/y options not found');
}

if (content.includes(oldIpc)) {
  content = content.replace(oldIpc, newIpc);
  console.log('Patched: IPC handler for titlebar color');
} else {
  console.log('WARNING: notification-click handler not found (may already be patched)');
}

fs.writeFileSync(mainJsPath, content, 'utf8');
console.log('Patch complete.');
