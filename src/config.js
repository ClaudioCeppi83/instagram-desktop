const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const get_config_path = () => {
	const base_dir = (app && app.getPath)
		? app.getPath('userData')
		: path.join(
			process.env.HOME || '/tmp',
			'.config',
			'instagram-desktop'
		);

	if (!fs.existsSync(base_dir)) {
		fs.mkdirSync(base_dir, { recursive: true });
	}
	return path.join(base_dir, 'config.json');
};

const get_default_config = () => {
	return {
		width: 1024,
		height: 768,
		x: undefined,
		y: undefined,
		autostart: false,
		notifications_enabled: true
	};
};

const load_config = () => {
	/*
	 * Loads app configuration from user data folder.
	 * Returns defaults if file is missing or invalid.
	 */
	const file_path = get_config_path();
	if (!fs.existsSync(file_path)) {
		return get_default_config();
	}
	try {
		const raw_data = fs.readFileSync(file_path, 'utf8');
		const parsed = JSON.parse(raw_data);
		return Object.assign(get_default_config(), parsed);
	} catch (err) {
		return get_default_config();
	}
};

const save_config = (config_data) => {
	/*
	 * Persists updated configuration object to JSON file.
	 */
	const file_path = get_config_path();
	try {
		const content = JSON.stringify(config_data, null, 2);
		fs.writeFileSync(file_path, content, 'utf8');
		return true;
	} catch (err) {
		return false;
	}
};

module.exports = {
	load_config,
	save_config
};
