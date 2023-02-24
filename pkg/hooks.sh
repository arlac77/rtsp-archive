post_install() {
	systemctl daemon-reload
	systemctl enable rtsp-archive
	systemctl enable rtsp-archive.socket
	systemctl start rtsp-archive.socket
}

pre_upgrade() {
	systemctl stop rtsp-archive.socket
	systemctl stop rtsp-archive
}

post_upgrade() {
	systemctl daemon-reload
	systemctl start rtsp-archive.socket
}

pre_remove() {
	systemctl stop rtsp-archive.socket
	systemctl disable rtsp-archive.socket
	systemctl stop rtsp-archive
	systemctl disable rtsp-archive
}
