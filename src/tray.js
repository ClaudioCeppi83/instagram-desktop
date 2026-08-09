const path = require('path');
const { Tray, Menu, app } = require('electron');
const { get_main_window, set_quitting_flag } = require('./window');
const { load_config, save_config } = require('./config');
const { check_for_updates } = require('./updater');

let tray_instance = null;
let current_unread_count = 0;

const toggle_window_visibility = () => {
	/*
	 * Toggles main window visibility when clicking tray icon.
	 */
	const win = get_main_window();
	if (!win) {
		return;
	}
	if (win.isVisible() && !win.isMinimized()) {
		win.hide();
	} else {
		win.show();
		win.focus();
	}
};

const handle_autostart_toggle = (item_checked) => {
	/*
	 * Updates system autostart settings and persists preference.
	 */
	app.setLoginItemSettings({
		openAtLogin: item_checked,
		path: app.getPath('exe')
	});
	const cfg = load_config();
	cfg.autostart = item_checked;
	save_config(cfg);
};

const handle_quit_app = () => {
	set_quitting_flag(true);
	app.quit();
};

const build_context_menu = () => {
	/*
	 * Constructs tray right-click context menu options.
	 */
	const win = get_main_window();
	const cfg = load_config();

	return Menu.buildFromTemplate([
		{
			label: 'Mostrar / Ocultar',
			click: () => toggle_window_visibility()
		},
		{ type: 'separator' },
		{
			label: 'Recargar página',
			click: () => win && win.webContents.reload()
		},
		{
			label: 'Notificaciones',
			type: 'checkbox',
			checked: cfg.notifications_enabled,
			click: (item) => {
				cfg.notifications_enabled = item.checked;
				save_config(cfg);
			}
		},
		{
			label: 'Iniciar al encender',
			type: 'checkbox',
			checked: cfg.autostart,
			click: (item) => handle_autostart_toggle(item.checked)
		},
		{
			label: 'Buscar actualizaciones...',
			click: () => check_for_updates(true)
		},
		{ type: 'separator' },
		{
			label: 'Salir',
			click: () => handle_quit_app()
		}
	]);
};

const update_tray_tooltip = (count_val) => {
	current_unread_count = count_val;
	if (!tray_instance) {
		return;
	}
	if (current_unread_count > 0) {
		tray_instance.setToolTip(
			`Instagram Desktop (${current_unread_count} no leídos)`
		);
	} else {
		tray_instance.setToolTip('Instagram Desktop');
	}
};

const create_system_tray = () => {
	/*
	 * Instantiates tray icon and attaches event listeners.
	 */
	const icon_path = path.join(__dirname, '..', 'assets', 'icon-tray.png');
	tray_instance = new Tray(icon_path);

	tray_instance.setToolTip('Instagram Desktop');
	tray_instance.setContextMenu(build_context_menu());

	tray_instance.on('click', () => {
		toggle_window_visibility();
	});

	return tray_instance;
};

module.exports = {
	create_system_tray,
	update_tray_tooltip
};
