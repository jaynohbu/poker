build-BackendFunction:
	npm ci
	npm run build
	rm -rf "$(ARTIFACTS_DIR)"
	mkdir -p "$(ARTIFACTS_DIR)"
	cp -R dist "$(ARTIFACTS_DIR)/dist"
	cp package.json package-lock.json "$(ARTIFACTS_DIR)"
	npm ci --omit=dev --prefix "$(ARTIFACTS_DIR)"
