
pre_install() {
	useradd -U -l -M -r -s /usr/bin/nologin -d /var/lib/{{name}} -G http -c "{{description}}" {{name}}
}

post_install() {
	systemctl daemon-reload
	systemctl enable {{name}}
	systemctl enable {{name}}.socket
	systemctl start {{name}}
}

pre_upgrade() {
	usermod -G http {{name}}
	systemctl stop {{name}}.socket
	systemctl stop {{name}}
}

post_upgrade() {
	systemctl daemon-reload
	systemctl start {{name}}
}

pre_remove() {
	systemctl stop {{name}}.socket
	systemctl disable {{name}}.socket
	systemctl stop {{name}}
	systemctl disable {{name}}
}

post_remove() {
	systemctl daemon-reload
	userdel {{name}}
	groupdel {{name}}
}
