const { app, ipcMain } = require('electron');

/* Disable GPU hardware acceleration on Linux to prevent process crashes */
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

const { create_main_window, get_main_window, set_quitting_flag } =
	require('./window');
const { create_system_tray, update_tray_tooltip } = require('./tray');
const { check_for_updates } = require('./updater');

const setup_single_instance = () => {
	/*
	 * Ensures only one instance of Instagram Desktop runs at a time.
	 */
	const got_lock = app.requestSingleInstanceLock();
	if (!got_lock) {
		app.quit();
		return false;
	}

	app.on('second-instance', () => {
		const win = get_main_window();
		if (win) {
			if (win.isMinimized()) {
				win.restore();
			}
			win.show();
			win.focus();
		}
	});
	return true;
};

const handle_key_shortcut = (win_obj, input) => {
	const key_lower = input.key.toLowerCase();
	const is_ctrl = input.control;

	if (input.key === 'F5' || (is_ctrl && key_lower === 'r')) {
		win_obj.webContents.reload();
	} else if (
		input.key === 'F12' ||
		(is_ctrl && input.shift && key_lower === 'i')
	) {
		win_obj.webContents.toggleDevTools();
	} else if (is_ctrl && (input.key === '=' || input.key === '+')) {
		const current = win_obj.webContents.getZoomLevel();
		win_obj.webContents.setZoomLevel(current + 0.5);
	} else if (is_ctrl && input.key === '-') {
		const current = win_obj.webContents.getZoomLevel();
		win_obj.webContents.setZoomLevel(current - 0.5);
	} else if (is_ctrl && input.key === '0') {
		win_obj.webContents.setZoomLevel(0);
	}
};

const register_shortcuts = (win_obj) => {
	/*
	 * Binds keyboard shortcuts for reload, devtools, and zoom.
	 */
	if (!win_obj) {
		return;
	}
	win_obj.webContents.on('before-input-event', (event, input) => {
		if (input.type === 'keyDown') {
			handle_key_shortcut(win_obj, input);
		}
	});
};

const setup_ipc_listeners = () => {
	ipcMain.on('unread-count', (event, count_val) => {
		update_tray_tooltip(count_val);
	});
};

const initialize_app = () => {
	/*
	 * Application bootstrap pipeline.
	 */
	app.setName('Instagram Desktop');
	if (process.platform === 'linux') {
		app.setAppUserModelId('com.instagram.desktop');
	}

	const win = create_main_window();
	create_system_tray();
	register_shortcuts(win);
	setup_ipc_listeners();

	setTimeout(() => {
		check_for_updates(false);
	}, 5000);
};

if (setup_single_instance()) {
	app.whenReady().then(() => {
		initialize_app();

		app.on('activate', () => {
			const win = get_main_window();
			if (win) {
				win.show();
			} else {
				create_main_window();
			}
		});
	});

	app.on('before-quit', () => {
		set_quitting_flag(true);
	});

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') {
			/* Keep running in background tray until user quits via tray */
		}
	});
}
