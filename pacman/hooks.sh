post_install() {
	systemctl enable {{name}}
	systemctl enable {{name}}.socket
	systemctl start {{name}}
}

pre_upgrade() {
	systemctl stop {{name}}.socket
	systemctl stop {{name}}
}

post_upgrade() {
	systemctl start {{name}}
}

pre_remove() {
	systemctl stop {{name}}.socket
	systemctl disable {{name}}.socket
	systemctl stop {{name}}
	systemctl disable {{name}}
}

post_remove() {
}
