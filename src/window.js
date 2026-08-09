const path = require('path');
const { BrowserWindow, shell, session } = require('electron');
const { load_config, save_config } = require('./config');

const DESKTOP_USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
	'(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

let main_window = null;
let is_quitting_app = false;

const set_quitting_flag = (flag_val) => {
	is_quitting_app = flag_val;
};

const setup_session_headers = () => {
	/*
	 * Configures global session User-Agent and permission handlers
	 * required for Instagram E2EE Direct Messages.
	 */
	const default_sess = session.defaultSession;
	default_sess.setUserAgent(DESKTOP_USER_AGENT);

	default_sess.setPermissionRequestHandler((wc, permission, callback) => {
		callback(true);
	});
};

const handle_external_link = (target_url) => {
	/*
	 * Opens external non-instagram links in default Linux web browser.
	 */
	if (!target_url.includes('instagram.com')) {
		shell.openExternal(target_url);
		return { action: 'deny' };
	}
	return { action: 'allow' };
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
	 * Binds close-to-tray, resize, and move listeners.
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
};

const setup_navigation_handlers = (win_obj) => {
	win_obj.webContents.setWindowOpenHandler(({ url }) => {
		return handle_external_link(url);
	});

	win_obj.webContents.on('will-navigate', (event, url) => {
		if (!url.includes('instagram.com')) {
			event.preventDefault();
			shell.openExternal(url);
		}
	});
};

const create_main_window = () => {
	/*
	 * Instantiates the primary Electron window with Instagram webapp.
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
			contextIsolation: true,
			partition: 'persist:instagram'
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
