/**
 * SettingsApp 页面实现分片 - Fingo 页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「Fingo」页面成员
 * （renderFingo、Fingo 隐私/加密/永久保存相关），必须紧跟在
 * js/apps/settings.js 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    renderFingo(container) {
        // 隐私
        const privSection = this.createSection(t('settings.fingo-privacy'));
        privSection.appendChild(FluentUI.SettingItem({
            label: t('settings.fingo-uxplan'),
            description: t('settings.fingo-uxplan-desc'),
            control: FluentUI.Toggle({
                checked: State.settings.fingoUXPlan || false,
                onChange: (v) => {
                    State.updateSettings({ fingoUXPlan: v });
                    this.addRecentSetting(t('settings.fingo-uxplan'), v ? t('settings.on') : t('settings.off'), 'fingo');
                }
            })
        }));
        container.appendChild(privSection);

        // 对话模式
        const modeSection = this.createSection(t('settings.fingo-mode'));
        const customEnabled = State.settings.fingoCustomMode || false;
        let customOptionsWrap = null;
        modeSection.appendChild(FluentUI.SettingItem({
            label: t('settings.fingo-custom'),
            description: t('settings.fingo-custom-desc'),
            control: FluentUI.Toggle({
                checked: customEnabled,
                onChange: (v) => {
                    if (this._fingoModeAnimating) return;
                    if (v) {
                        const enableCustomMode = () => {
                            State.updateSettings({ fingoCustomMode: true });
                            this.addRecentSetting(t('settings.fingo-custom'), t('settings.on'), 'fingo');
                            this._pendingFingoCustomEnter = true;
                            this._fingoCustomRiskAcknowledgedForCsp = false;
                            this.render();
                        };

                        const promptEnableCsp = () => {
                            this._showFingoCustomRequireCspDialog().then((goEnableCsp) => {
                                if (goEnableCsp) {
                                    this._goPrivacyAndHighlightStrictCsp();
                                    return;
                                }
                                this.render();
                            });
                        };

                        const strictEnabled = State.settings.strictCspEnabled === true;
                        if (this._fingoCustomRiskAcknowledgedForCsp) {
                            if (strictEnabled) enableCustomMode();
                            else promptEnableCsp();
                            return;
                        }

                        this._showFingoCustomRiskDialog().then((accepted) => {
                            if (!accepted) {
                                this.render();
                                return;
                            }
                            if (State.settings.strictCspEnabled !== true) {
                                this._fingoCustomRiskAcknowledgedForCsp = true;
                                promptEnableCsp();
                                return;
                            }
                            enableCustomMode();
                        });
                        return;
                    }

                    this.addRecentSetting(t('settings.fingo-custom'), t('settings.off'), 'fingo');

                    const finishDisable = () => {
                        State.updateSettings({ fingoCustomMode: false });
                        this._fingoCustomRiskAcknowledgedForCsp = false;
                        this.render();
                        this._fingoModeAnimating = false;
                    };

                    this._fingoModeAnimating = true;
                    if (customOptionsWrap) {
                        customOptionsWrap.classList.remove('anim-in');
                        customOptionsWrap.classList.add('anim-out');
                        setTimeout(finishDisable, 430);
                    } else {
                        finishDisable();
                    }
                }
            })
        }));

        if (customEnabled) {
            customOptionsWrap = document.createElement('div');
            customOptionsWrap.className = 'settings-fingo-custom-options';

            const providerItem = FluentUI.SettingItem({
                label: t('settings.fingo-provider'),
                control: FluentUI.Select({
                    options: [
                        { value: 'openai', label: 'OpenAI' },
                        { value: 'siliconflow', label: '硅基流动 (SiliconFlow)' }
                    ],
                    value: State.settings.fingoProvider || 'openai',
                    onChange: (v) => State.updateSettings({ fingoProvider: v })
                })
            });
            providerItem.style.setProperty('--fingo-stagger-index', '0');
            customOptionsWrap.appendChild(providerItem);

            const saveModeItem = FluentUI.SettingItem({
                label: t('settings.fingo-key-save-mode'),
                description: t('settings.fingo-key-save-mode-desc'),
                control: FluentUI.Select({
                    options: [
                        { value: 'temporary', label: t('settings.fingo-key-mode-temporary') },
                        { value: 'permanent', label: t('settings.fingo-key-mode-permanent') }
                    ],
                    value: State.settings.fingoApiSaveMode === 'permanent' ? 'permanent' : 'temporary',
                    onChange: (v) => State.updateSettings({ fingoApiSaveMode: v })
                })
            });
            saveModeItem.style.setProperty('--fingo-stagger-index', '1');
            customOptionsWrap.appendChild(saveModeItem);

            const keyWrapper = document.createElement('div');
            keyWrapper.className = 'fluent-setting-item';
            keyWrapper.style.cssText = 'display:flex;flex-direction:column;align-items:stretch;gap:10px';
            keyWrapper.style.setProperty('--fingo-stagger-index', '2');
            const keyLabel = document.createElement('div');
            keyLabel.className = 'fluent-setting-item-label';
            keyLabel.textContent = t('settings.fingo-apikey');
            const keyRow = document.createElement('div');
            keyRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap';
            const currentStorageType = (typeof Fingo !== 'undefined' && typeof Fingo.getApiKeyStorageType === 'function')
                ? Fingo.getApiKeyStorageType()
                : (State.settings.fingoApiStorageType || 'none');
            const sessionKey = (typeof Fingo !== 'undefined' && typeof Fingo.getSessionApiKey === 'function')
                ? (Fingo.getSessionApiKey() || '')
                : '';
            const encryptedLocked = currentStorageType === 'permanent-encrypted' && !sessionKey;
            const uiKeyValue = (typeof Fingo !== 'undefined' && typeof Fingo.getSessionApiKey === 'function')
                ? (Fingo.getSessionApiKey() || '')
                : '';
            const keyInput = FluentUI.Input({
                type: 'password',
                placeholder: encryptedLocked ? t('settings.fingo-key-encrypted-placeholder') : t('settings.fingo-apikey-placeholder'),
                value: uiKeyValue
            });
            keyInput.style.flex = '1';
            keyInput.style.minWidth = '220px';
            const saveBtn = FluentUI.Button({
                text: t('settings.fingo-save'),
                variant: 'primary',
                onClick: async () => {
                    const val = (keyInput.getValue ? keyInput.getValue() : keyInput.querySelector('input').value).trim();
                    if (!val) {
                        if (encryptedLocked) {
                            FluentUI.Toast({
                                title: t('settings.fingo'),
                                message: t('settings.fingo-key-encrypted-use-tip'),
                                type: 'info'
                            });
                            return;
                        }
                        if (typeof Fingo !== 'undefined' && typeof Fingo.clearApiKey === 'function') {
                            Fingo.clearApiKey();
                        } else {
                            State.updateSettings({ fingoApiKey: '', fingoApiEncrypted: null, fingoApiStorageType: 'none' });
                        }
                        FluentUI.Toast({ title: t('settings.fingo'), message: t('settings.fingo-key-cleared'), type: 'success' });
                        this.render();
                        return;
                    }

                    const saveMode = State.settings.fingoApiSaveMode === 'permanent' ? 'permanent' : 'temporary';
                    if (saveMode === 'temporary') {
                        if (typeof Fingo !== 'undefined' && typeof Fingo.saveApiKeyTemporary === 'function') {
                            Fingo.saveApiKeyTemporary(val);
                        } else {
                            State.updateSettings({ fingoApiKey: '', fingoApiEncrypted: null, fingoApiStorageType: 'session' });
                        }
                        FluentUI.Toast({ title: t('settings.fingo'), message: t('settings.fingo-temp-saved'), type: 'success' });
                        this.render();
                        return;
                    }

                    this._handleFingoPermanentSave(val);
                }
            });
            const clearBtn = FluentUI.Button({
                text: t('settings.fingo-clear-key'),
                variant: 'secondary',
                onClick: () => {
                    if (typeof Fingo !== 'undefined' && typeof Fingo.clearApiKey === 'function') {
                        Fingo.clearApiKey();
                    } else {
                        State.updateSettings({ fingoApiKey: '', fingoApiEncrypted: null, fingoApiStorageType: 'none' });
                    }
                    FluentUI.Toast({ title: t('settings.fingo'), message: t('settings.fingo-key-cleared'), type: 'success' });
                    this.render();
                }
            });
            keyRow.appendChild(keyInput);
            keyRow.appendChild(saveBtn);
            keyRow.appendChild(clearBtn);
            const keyStatus = document.createElement('div');
            keyStatus.className = 'fluent-setting-item-desc';
            keyStatus.style.marginTop = '2px';
            keyStatus.textContent = this._getFingoApiStorageStatusText(
                (typeof Fingo !== 'undefined' && typeof Fingo.getApiKeyStorageType === 'function')
                    ? Fingo.getApiKeyStorageType()
                    : (State.settings.fingoApiStorageType || 'none')
            );
            keyWrapper.appendChild(keyLabel);
            keyWrapper.appendChild(keyRow);
            keyWrapper.appendChild(keyStatus);
            customOptionsWrap.appendChild(keyWrapper);

            modeSection.appendChild(customOptionsWrap);
            if (this._pendingFingoCustomEnter) {
                this._pendingFingoCustomEnter = false;
                requestAnimationFrame(() => {
                    customOptionsWrap?.classList.add('anim-in');
                    setTimeout(() => customOptionsWrap?.classList.remove('anim-in'), 660);
                });
            }
        }
        container.appendChild(modeSection);

        // 关于
        const aboutSection = this.createSection(t('settings.fingo-about'));
        const aboutText = document.createElement('div');
        aboutText.className = 'fluent-setting-item';
        aboutText.innerHTML = `<div class="fluent-setting-item-info"><div class="fluent-setting-item-desc" style="font-size:13px;line-height:1.6">${t('settings.fingo-about-text')}</div></div>`;
        aboutSection.appendChild(aboutText);
        container.appendChild(aboutSection);
    },

    _showFingoCustomRiskDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(false);
                return;
            }

            let timer = null;
            const dialogRef = FluentUI.Dialog({
                type: 'warning',
                title: t('settings.fingo-custom-risk-title'),
                content: `<div class="fingo-custom-risk-content">${t('settings.fingo-custom-risk-content')}</div>`,
                closeOnOverlay: false,
                buttons: [
                    { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                    { text: t('settings.fingo-custom-risk-ack'), variant: 'primary', value: 'confirm' }
                ],
                onClose: (result) => {
                    if (timer) clearInterval(timer);
                    resolve(result === 'confirm');
                }
            });

            const buttons = dialogRef?.dialog?.querySelectorAll('.fluent-dialog-footer .fluent-btn');
            const confirmBtn = buttons && buttons.length ? buttons[buttons.length - 1] : null;
            if (!confirmBtn) return;

            const textEl = confirmBtn.querySelector('.fluent-btn-text');
            const setConfirmText = (txt) => {
                if (textEl) textEl.textContent = txt;
                else confirmBtn.textContent = txt;
            };

            let remaining = 10;
            confirmBtn.disabled = true;
            setConfirmText(t('settings.fingo-custom-risk-ack-countdown', { seconds: remaining }));

            timer = setInterval(() => {
                remaining -= 1;
                if (remaining > 0) {
                    setConfirmText(t('settings.fingo-custom-risk-ack-countdown', { seconds: remaining }));
                    return;
                }
                clearInterval(timer);
                confirmBtn.disabled = false;
                setConfirmText(t('settings.fingo-custom-risk-ack'));
            }, 1000);
        });
    },

    _showFingoCustomRequireCspDialog() {
        return new Promise((resolve) => {
            if (typeof FluentUI === 'undefined' || !FluentUI || typeof FluentUI.Dialog !== 'function') {
                resolve(window.confirm(t('settings.fingo-custom-csp-required-content')));
                return;
            }

            FluentUI.Dialog({
                type: 'warning',
                title: t('settings.fingo-custom-csp-required-title'),
                content: `<div class="fingo-custom-risk-content">${t('settings.fingo-custom-csp-required-content')}</div>`,
                closeOnOverlay: false,
                buttons: [
                    { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                    { text: t('settings.fingo-custom-csp-required-go'), variant: 'primary', value: 'go' }
                ],
                onClose: (result) => resolve(result === 'go')
            });
        });
    },

    _goPrivacyAndHighlightStrictCsp() {
        this.navigateToPage('privacy', {
            after: () => this.highlightSettingByDataId('privacy-strict-csp', 1200),
            delay: 220
        });
    },

    _getFingoApiStorageStatusText(type) {
        switch (type) {
            case 'session':
                return t('settings.fingo-key-status-session');
            case 'permanent-plain':
                return t('settings.fingo-key-status-plain');
            case 'permanent-encrypted':
                return t('settings.fingo-key-status-encrypted');
            default:
                return t('settings.fingo-key-status-none');
        }
    },

    _promptFingoEncryptPassphrase() {
        return new Promise((resolve) => {
            FluentUI.InputDialog({
                title: t('settings.fingo-encrypt-passphrase-title'),
                placeholder: t('settings.fingo-encrypt-passphrase-placeholder'),
                inputType: 'password',
                minLength: 8,
                validateFn: (value) => value.length >= 8 || t('settings.fingo-encrypt-passphrase-error'),
                confirmText: t('ok'),
                cancelText: t('cancel'),
                onConfirm: (passphrase) => resolve(passphrase),
                onCancel: () => resolve(null)
            });
        });
    },

    _handleFingoPermanentSave(apiKey) {
        FluentUI.Dialog({
            type: 'warning',
            title: t('settings.fingo-perm-save-title'),
            content: t('settings.fingo-perm-save-content'),
            buttons: [
                { text: t('cancel'), variant: 'secondary', value: 'cancel' },
                { text: t('settings.fingo-perm-save-encrypted'), variant: 'primary', value: 'encrypted' }
            ],
            onClose: async (result) => {
                if (result !== 'encrypted') return;

                const passphrase = await this._promptFingoEncryptPassphrase();
                if (!passphrase) return;

                try {
                    if (typeof Fingo !== 'undefined' && typeof Fingo.saveApiKeyPermanentEncrypted === 'function') {
                        await Fingo.saveApiKeyPermanentEncrypted(apiKey, passphrase);
                    } else {
                        throw new Error(t('settings.fingo-webcrypto-unavailable'));
                    }
                    FluentUI.Toast({ title: t('settings.fingo'), message: t('settings.fingo-perm-encrypted-saved'), type: 'success' });
                    this.render();
                } catch (error) {
                    FluentUI.Toast({
                        title: t('settings.fingo'),
                        message: error?.message || t('settings.fingo-webcrypto-unavailable'),
                        type: 'error'
                    });
                }
            }
        });
    },

});
