pre_install() {
	useradd -U -l -M -r -c "{{description}}" {{name}}
}

post_install() {
	systemctl daemon-reload
	systemctl enable {{name}}
}

pre_upgrade() {
	systemctl stop {{name}}
}

post_upgrade() {
	systemctl daemon-reload
	systemctl start {{name}}
}

pre_remove() {
	systemctl stop {{name}}
	systemctl disable {{name}}
}

post_remove() {
	systemctl daemon-reload
	userdel {{name}}
	groupdel {{name}}
}
