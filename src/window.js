const path = require('path');
const { BrowserWindow, shell, session } = require('electron');
const { load_config, save_config } = require('./config');

const DESKTOP_USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
	'(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const INSTAGRAM_ORIGINS = [
	'instagram.com',
	'cdninstagram.com',
	'facebook.com',
	'fbcdn.net'
];

let main_window = null;
let is_quitting_app = false;

const set_quitting_flag = (flag_val) => {
	is_quitting_app = flag_val;
};

const is_instagram_url = (url_str) => {
	return INSTAGRAM_ORIGINS.some((origin) => url_str.includes(origin));
};

const setup_session_headers = () => {
	/*
	 * Sets User-Agent at session level so all requests (XHR, WebSocket,
	 * Fetch) use a desktop Chrome identity. Required for E2EE DMs.
	 * Uses defaultSession to preserve existing login cookies.
	 */
	const sess = session.defaultSession;
	sess.setUserAgent(DESKTOP_USER_AGENT);

	sess.setPermissionRequestHandler((wc, permission, callback) => {
		callback(true);
	});
};

const save_window_bounds = (win_obj) => {
	if (!win_obj || win_obj.isDestroyed()) {
		return;
	}
	const bounds = win_obj.getBounds();
	const cfg = load_config();
	cfg.width = bounds.width;
	cfg.height = bounds.height;
	cfg.x = bounds.x;
	cfg.y = bounds.y;
	save_config(cfg);
};

const setup_window_events = (win_obj) => {
	/*
	 * Binds close-to-tray, resize, move, and crash recovery listeners.
	 */
	win_obj.on('close', (event) => {
		if (!is_quitting_app) {
			event.preventDefault();
			win_obj.hide();
			return false;
		}
		save_window_bounds(win_obj);
	});

	win_obj.on('resize', () => {
		save_window_bounds(win_obj);
	});

	win_obj.on('move', () => {
		save_window_bounds(win_obj);
	});

	win_obj.webContents.on('render-process-gone', (event, details) => {
		if (details.reason !== 'clean-exit') {
			win_obj.webContents.reload();
		}
	});

	win_obj.webContents.on('unresponsive', () => {
		win_obj.webContents.reload();
	});
};

const open_instagram_popup = (url) => {
	/*
	 * Opens an Instagram popup (story, notification panel) in a
	 * configured child window with correct User-Agent and session.
	 */
	const popup = new BrowserWindow({
		width: 900,
		height: 700,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true
		}
	});

	popup.loadURL(url, { userAgent: DESKTOP_USER_AGENT });
	popup.webContents.on('will-navigate', (event, nav_url) => {
		if (!is_instagram_url(nav_url)) {
			event.preventDefault();
			shell.openExternal(nav_url);
		}
	});

	return popup;
};

const setup_navigation_handlers = (win_obj) => {
	/*
	 * Routes window.open() calls:
	 * - Instagram URLs  → configured child window
	 * - External URLs   → system browser
	 * Routes navigation:
	 * - External URLs   → system browser
	 */
	win_obj.webContents.setWindowOpenHandler(({ url }) => {
		if (is_instagram_url(url)) {
			open_instagram_popup(url);
		} else {
			shell.openExternal(url);
		}
		return { action: 'deny' };
	});

	win_obj.webContents.on('will-navigate', (event, url) => {
		if (!is_instagram_url(url)) {
			event.preventDefault();
			shell.openExternal(url);
		}
	});
};

const create_main_window = () => {
	/*
	 * Instantiates the primary Electron window with Instagram webapp.
	 * Uses defaultSession (no partition) to preserve existing login cookies.
	 */
	setup_session_headers();
	const cfg = load_config();
	const icon_path = path.join(__dirname, '..', 'assets', 'icon.png');

	main_window = new BrowserWindow({
		width: cfg.width || 1024,
		height: cfg.height || 768,
		x: cfg.x,
		y: cfg.y,
		icon: icon_path,
		autoHideMenuBar: true,
		title: 'Instagram Desktop',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true
		}
	});

	main_window.loadURL('https://www.instagram.com/');

	setup_window_events(main_window);
	setup_navigation_handlers(main_window);

	return main_window;
};

const get_main_window = () => main_window;

module.exports = {
	create_main_window,
	get_main_window,
	set_quitting_flag
};
