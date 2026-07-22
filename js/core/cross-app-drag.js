/** Cross-App drag routing and live destination previews. */
(function () {
    'use strict';

    const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg']);
    const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']);
    const TEXT_EXTENSIONS = new Set(['txt', 'md', 'markdown', 'html', 'htm']);

    const CrossAppDrag = {
        _initialized: false,
        _previewWindow: null,
        _previewElement: null,

        init() {
            if (this._initialized || typeof document === 'undefined') return;
            this._initialized = true;
            document.addEventListener('dragover', (event) => this._onDragOver(event), true);
            document.addEventListener('dragleave', (event) => this._onDragLeave(event), true);
            document.addEventListener('drop', (event) => this._onDrop(event), true);
            document.addEventListener('dragend', () => this.hidePreview(), true);
            window.addEventListener('blur', () => this.hidePreview());
            State?.on?.('settingsChange', (updates) => {
                if (updates?.enableCrossAppDragDrop === false) this.hidePreview();
            });
        },

        enabled() {
            return State?.settings?.enableCrossAppDragDrop === true;
        },

        _types(dataTransfer) {
            return Array.from(dataTransfer?.types || []).map((value) => String(value || '').toLowerCase());
        },

        _extension(name) {
            const value = String(name || '');
            const index = value.lastIndexOf('.');
            return index >= 0 ? value.slice(index + 1).toLowerCase() : '';
        },

        _internalPayload(dataTransfer) {
            if (!this._types(dataTransfer).includes('application/fluent-file')) return null;
            try {
                const raw = dataTransfer.getData('application/fluent-file');
                return raw ? JSON.parse(raw) : null;
            } catch (_) {
                return null;
            }
        },

        _internalNodes(dataTransfer) {
            const payload = this._internalPayload(dataTransfer);
            if (!payload) return [];
            const ids = Array.isArray(payload.ids) ? payload.ids : [payload.id];
            return [...new Set(ids.filter(Boolean))]
                .map((id) => State?.findNode?.(id))
                .filter(Boolean);
        },

        _externalFiles(dataTransfer) {
            if (dataTransfer?.files?.length) return Array.from(dataTransfer.files);
            const files = [];
            Array.from(dataTransfer?.items || []).forEach((item) => {
                if (item?.kind !== 'file') return;
                const file = item.getAsFile?.();
                if (file) files.push(file);
            });
            return files;
        },

        _externalMimeTypes(dataTransfer) {
            return Array.from(dataTransfer?.items || [])
                .filter((item) => item?.kind === 'file')
                .map((item) => String(item.type || '').toLowerCase());
        },

        _hasExternalFiles(dataTransfer) {
            const types = this._types(dataTransfer);
            if (types.includes('application/fluent-file')) return false;
            return types.some((type) => type === 'files' || type.includes('file'))
                || Array.from(dataTransfer?.items || []).some((item) => item?.kind === 'file');
        },

        _plainText(dataTransfer) {
            if (this._types(dataTransfer).includes('application/fluent-file')) return '';
            return String(dataTransfer?.getData('text/uri-list') || dataTransfer?.getData('text/plain') || '').trim();
        },

        _matchesNodes(nodes, extensions, mimePrefix = '') {
            return nodes.length > 0 && nodes.every((node) => {
                const extension = this._extension(node?.name);
                const mime = String(node?.mime || '').toLowerCase();
                return extensions.has(extension) || (mimePrefix && mime.startsWith(mimePrefix));
            });
        },

        _matchesExternal(dataTransfer, extensions, mimePrefix = '') {
            const files = this._externalFiles(dataTransfer);
            if (files.length) {
                return files.every((file) => extensions.has(this._extension(file.name)) || String(file.type || '').toLowerCase().startsWith(mimePrefix));
            }
            const mimeTypes = this._externalMimeTypes(dataTransfer);
            return mimeTypes.length > 0 && mimeTypes.every((mime) => !mime || mime.startsWith(mimePrefix));
        },

        _getWindowData(target) {
            const windowElement = target instanceof Element ? target.closest('.window') : null;
            if (!windowElement || !Array.isArray(WindowManager?.windows)) return null;
            return WindowManager.windows.find((item) => item?.id === windowElement.id) || null;
        },

        _decision(windowData, dataTransfer) {
            if (!windowData || !dataTransfer) return null;
            const appId = windowData.appId;
            const nodes = this._internalNodes(dataTransfer);
            const internal = this._types(dataTransfer).includes('application/fluent-file');
            const external = this._hasExternalFiles(dataTransfer);
            const externalAllowed = globalThis.FileImport?.enabled?.() === true;
            const plainText = this._plainText(dataTransfer);

            if (appId === 'files' && (internal || (external && externalAllowed))) {
                return { labelKey: 'crossAppDrop.files', native: true };
            }
            if (appId === 'notes' && (
                (internal && this._matchesNodes(nodes, TEXT_EXTENSIONS, 'text/'))
                || (external && externalAllowed && this._matchesExternal(dataTransfer, TEXT_EXTENSIONS, 'text/'))
                || plainText
            )) return { labelKey: 'crossAppDrop.notes' };
            if (appId === 'photos' && (
                (internal && this._matchesNodes(nodes, IMAGE_EXTENSIONS, 'image/'))
                || (external && externalAllowed && this._matchesExternal(dataTransfer, IMAGE_EXTENSIONS, 'image/'))
            )) return { labelKey: 'crossAppDrop.photos' };
            if (appId === 'media' && (
                (internal && this._matchesNodes(nodes, AUDIO_EXTENSIONS, 'audio/'))
                || (external && externalAllowed && this._matchesExternal(dataTransfer, AUDIO_EXTENSIONS, 'audio/'))
            )) return { labelKey: 'crossAppDrop.media' };
            if (appId === 'browser' && (
                (internal && this._matchesNodes(nodes, TEXT_EXTENSIONS, 'text/')) || plainText
            )) return { labelKey: 'crossAppDrop.browser' };
            if (appId === 'terminal' && (internal || plainText || (external && externalAllowed))) {
                return { labelKey: 'crossAppDrop.terminal' };
            }
            return null;
        },

        _showPreview(windowData, decision) {
            if (!windowData?.element || !decision) return;
            if (this._previewWindow === windowData && this._previewElement?.isConnected) return;
            this.hidePreview();

            const config = WindowManager?.getAppConfig?.(windowData.appId);
            const overlay = document.createElement('div');
            overlay.className = 'cross-app-drop-preview';
            overlay.setAttribute('aria-hidden', 'true');
            const card = document.createElement('div');
            card.className = 'cross-app-drop-preview-card';
            if (config?.icon) {
                const icon = document.createElement('img');
                icon.src = config.icon;
                icon.alt = '';
                card.appendChild(icon);
            }
            const copy = document.createElement('span');
            const title = document.createElement('strong');
            title.textContent = t(decision.labelKey);
            const hint = document.createElement('small');
            hint.textContent = t('crossAppDrop.release');
            copy.append(title, hint);
            card.appendChild(copy);
            overlay.appendChild(card);
            windowData.element.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('show'));
            this._previewWindow = windowData;
            this._previewElement = overlay;
        },

        hidePreview() {
            const overlay = this._previewElement;
            this._previewElement = null;
            this._previewWindow = null;
            if (!overlay) return;
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 140);
        },

        _onDragOver(event) {
            if (!this.enabled()) {
                this.hidePreview();
                return;
            }
            const windowData = this._getWindowData(event.target);
            const decision = this._decision(windowData, event.dataTransfer);
            if (!decision) {
                this.hidePreview();
                return;
            }
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = decision.native ? (this._types(event.dataTransfer).includes('application/fluent-file') ? 'move' : 'copy') : 'copy';
            this._showPreview(windowData, decision);
        },

        _onDragLeave(event) {
            const windowElement = event.target instanceof Element ? event.target.closest('.window') : null;
            if (!windowElement || windowElement.contains(event.relatedTarget)) return;
            if (this._previewWindow?.id === windowElement.id) this.hidePreview();
        },

        _onDrop(event) {
            if (!this.enabled()) return;
            const windowData = this._getWindowData(event.target);
            const decision = this._decision(windowData, event.dataTransfer);
            this.hidePreview();
            if (!decision || decision.native) return;
            event.preventDefault();
            // Stop target App handlers while allowing other document-level
            // capture listeners to clear their own drag UI.
            event.stopPropagation();
            this._deliver(windowData, event.dataTransfer).catch((error) => {
                console.warn('[CrossAppDrag] Drop delivery failed', error);
            });
        },

        async _deliver(windowData, dataTransfer) {
            const component = windowData?.component || WindowManager?._getWindowComponent?.(windowData);
            if (!component) return false;
            const nodes = this._internalNodes(dataTransfer);
            const files = this._externalFiles(dataTransfer);
            const plainText = this._plainText(dataTransfer);

            if (windowData.appId === 'notes') {
                if (nodes[0]?.id && component.loadFile) {
                    component.loadFile(nodes[0].id);
                } else if (files.length && component.readExternalTextFile && component.createFileInFolder) {
                    const imported = [];
                    for (const file of files) {
                        const content = await component.readExternalTextFile(file);
                        const folder = component.getDefaultFolder();
                        const extension = this._extension(file.name) === 'md' ? '.md' : '.txt';
                        const desired = component.ensureFileExtension(file.name || component.tr('newFileBase'), extension);
                        const name = component.uniqueFileName(folder, desired);
                        imported.push(component.createFileInFolder(folder, name, content, {
                            mime: file.type || (extension === '.md' ? 'text/markdown' : 'text/plain'),
                            encoding: 'text'
                        }));
                    }
                    if (imported[0]) component.openEditor(imported[0].id, false);
                } else if (plainText && component.createFileInFolder) {
                    const folder = component.getDefaultFolder();
                    const name = component.uniqueFileName(folder, `${component.tr('newFileBase')}${component.tr('txtExt')}`);
                    const note = component.createFileInFolder(folder, name, plainText, { mime: 'text/plain', encoding: 'text' });
                    component.openEditor(note.id, true);
                }
            } else if (windowData.appId === 'photos') {
                if (nodes[0]?.id && component.loadFile) component.loadFile(nodes[0].id);
                else if (files.length && component.importFiles) await component.importFiles(files);
            } else if (windowData.appId === 'media') {
                if (nodes[0]?.id && component.loadFile) await component.loadFile(nodes[0].id);
                else if (files.length && component.importFiles) await component.importFiles(files);
            } else if (windowData.appId === 'browser') {
                const value = nodes[0]?.content || nodes[0]?.url || plainText;
                if (value && component.navigate) component.navigate(String(value).trim());
            } else if (windowData.appId === 'terminal') {
                const values = nodes.length
                    ? nodes.map((node) => node.name)
                    : (files.length ? files.map((file) => file.name) : [plainText]);
                const insertion = values.filter(Boolean).map((value) => /\s/.test(value) ? `"${value}"` : value).join(' ');
                if (component.input && insertion) {
                    const prefix = component.input.value && !component.input.value.endsWith(' ') ? ' ' : '';
                    component.input.value += `${prefix}${insertion}`;
                    component.input.focus();
                }
            }
            WindowManager?.focusWindow?.(windowData.id);
            return true;
        }
    };

    globalThis.CrossAppDrag = CrossAppDrag;
})();
