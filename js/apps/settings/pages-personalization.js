/**
 * SettingsApp 页面实现分片 - 个性化页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「个性化」页面成员
 * （renderPersonalization、renderPersonalizationAdvanced），必须紧跟在
 * js/apps/settings.js 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    renderPersonalization(container) {
        const wallpapers = [
            'Theme/Picture/Fluent-1.png', 'Theme/Picture/Fluent-2.png', 'Theme/Picture/Fluent-3.jpg',
            'Theme/Picture/Fluent-4.jpg', 'Theme/Picture/Fluent-5.png', 'Theme/Picture/Fluent-6.jpg'
        ];
        
        // 桌面壁纸
        const desktopSection = this.createSection(t('settings.desktop-wallpaper'));
        
        // 壁纸操作工具栏
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px;';
        
        // 1. Bing 壁纸按钮
        const bingBtn = FluentUI.Button({
            text: t('settings.bing-wallpaper'),
            icon: 'Image',
            onClick: async () => {
                // 添加加载状态
                const btn = bingBtn.querySelector('button') || bingBtn; // FluentUI.Button 返回的是 button 元素
                const originalText = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<span class="fluent-btn-spinner"></span> ...';
                
                try {
                    // 使用第三方 API 获取 Bing 壁纸 URL (支持 CORS)
                    const response = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN');
                    const data = await response.json();
                    if (data && data.url) {
                        const wp = data.url;
                        await State.setWallpaper('desktop', wp, { sourceType: 'bing', sourceUrl: wp });
                        await Desktop.updateWallpaper();
                        this.addRecentSetting(t('settings.desktop-wallpaper'), t('settings.bing-wallpaper'), 'personalization');
                        State.addNotification({ title: t('settings.desktop-wallpaper'), message: t('settings.bing-applied'), type: 'success' });
                        desktopGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                    } else {
                        throw new Error('Invalid response');
                    }
                } catch (e) {
                    console.error('Bing wallpaper fetch failed', e);
                    State.addNotification({ title: t('settings.error'), message: t('settings.bing-fail'), type: 'error' });
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                }
            }
        });
        
        // 2. 上传壁纸按钮
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = 'image/*';
        uploadInput.style.display = 'none';
        uploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await State.setWallpaper('desktop', file, { sourceType: 'upload', name: file.name, mime: file.type });
                    await Desktop.updateWallpaper();
                    this.addRecentSetting(t('settings.desktop-wallpaper'), t('settings.custom-applied'), 'personalization');
                    State.addNotification({ title: t('settings.desktop-wallpaper'), message: t('settings.custom-applied'), type: 'success' });
                    desktopGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                } catch (error) {
                    console.error('Desktop wallpaper cache failed', error);
                    State.addNotification({ title: t('settings.error'), message: t('settings.custom-wallpaper-fail'), type: 'error' });
                }
            }
            e.target.value = '';
        };
        
        const uploadBtn = FluentUI.Button({
            text: t('settings.upload-wallpaper'),            icon: 'Upload',
            onClick: () => uploadInput.click()
        });
        
        toolbar.appendChild(bingBtn);
        toolbar.appendChild(uploadBtn);
        desktopSection.appendChild(toolbar);

        const desktopGrid = this.createWallpaperGrid(wallpapers, State.settings.wallpaperDesktop, 'desktop');
        desktopSection.appendChild(desktopGrid);
        container.appendChild(desktopSection);
        
        // 锁屏壁纸
        const lockSection = this.createSection(t('settings.lock-wallpaper'));
        
        // 锁屏壁纸工具栏
        const lockToolbar = document.createElement('div');
        lockToolbar.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';
        
        const lockBingBtn = FluentUI.Button({
            text: t('settings.bing-wallpaper'),
            icon: 'Globe',
            onClick: async () => {
                try {
                    State.addNotification({ title: t('settings.lock-wallpaper'), message: t('settings.bing-fetching'), type: 'info' });
                    const response = await fetch('https://bing.biturl.top/?resolution=1920&format=json&index=0&mkt=zh-CN');
                    const data = await response.json();
                    if (data.url) {
                        await State.setWallpaper('lock', data.url, { sourceType: 'bing', sourceUrl: data.url });
                        if (LockScreen.updateWallpaper) await LockScreen.updateWallpaper();
                        State.addNotification({ title: t('settings.lock-wallpaper'), message: t('settings.lock-bing-applied'), type: 'success' });
                        lockGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                    }
                } catch (err) {
                    State.addNotification({ title: t('settings.error'), message: t('settings.lock-bing-fail'), type: 'error' });
                }
            }
        });
        
        const lockUploadInput = document.createElement('input');
        lockUploadInput.type = 'file';
        lockUploadInput.accept = 'image/*';
        lockUploadInput.style.display = 'none';
        lockUploadInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await State.setWallpaper('lock', file, { sourceType: 'upload', name: file.name, mime: file.type });
                    if (LockScreen.updateWallpaper) await LockScreen.updateWallpaper();
                    State.addNotification({ title: t('settings.lock-wallpaper'), message: t('settings.lock-custom-applied'), type: 'success' });
                    lockGrid.querySelectorAll('.wallpaper-item').forEach(item => item.classList.remove('selected'));
                } catch (error) {
                    console.error('Lock wallpaper cache failed', error);
                    State.addNotification({ title: t('settings.error'), message: t('settings.custom-wallpaper-fail'), type: 'error' });
                }
            }
            e.target.value = '';
        };
        
        const lockUploadBtn = FluentUI.Button({
            text: t('settings.upload-wallpaper'),
        });
        
        lockToolbar.appendChild(lockBingBtn);
        lockToolbar.appendChild(lockUploadBtn);
        lockSection.appendChild(lockToolbar);
        
        const lockGrid = this.createWallpaperGrid(wallpapers, State.settings.wallpaperLock, 'lock');
        lockSection.appendChild(lockGrid);
        container.appendChild(lockSection);
        
        // 外观设置
        const appearanceSection = this.createSection(t('settings.appearance'));
        appearanceSection.classList.add('settings-appearance-section');
        
        // 主题选择 - 使用 FluentUI.SettingItem + FluentUI.Select
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.theme'),
            description: t('settings.theme.desc'),
            control: FluentUI.Select({
                options: [
                    { value: 'light', label: t('settings.theme.light') },
                    { value: 'dark', label: t('settings.theme.dark') },
                    { value: 'auto', label: t('settings.theme.auto') }
                ],
                value: State.settings.theme,
                onChange: (v) => {
                    State.updateSettings({ theme: v });
                    State.applyTheme();
                    const themeLabel = v === 'light' ? t('settings.theme.light') : v === 'dark' ? t('settings.theme.dark') : t('settings.theme.auto');
                    this.addRecentSetting(t('settings.theme'), themeLabel, 'personalization');
                    State.addNotification({ title: t('settings.theme'), message: t('settings.theme-changed'), type: 'success' });
                }
            })
        }));

        appearanceSection.appendChild(this.createAccentColorPanel());
        
        // 模糊效果
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.blur'),
            description: t('settings.blur.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableBlur,
                onChange: (v) => {
                    State.updateSettings({ enableBlur: v });
                    this.addRecentSetting(t('settings.blur'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({ title: t('settings.blur'), message: t('settings.blur-changed', { status: v ? t('settings.on') : t('settings.off') }), type: 'success' });
                }
            })
        }));
        
        // 动画效果
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.animation'),
            description: t('settings.animation.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableAnimation,
                onChange: (v) => {
                    State.updateSettings({ enableAnimation: v });
                    this.addRecentSetting(t('settings.animation'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({ title: t('settings.animation'), message: t('settings.animation-changed', { status: v ? t('settings.on') : t('settings.off') }), type: 'success' });
                }
            })
        }));
        
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.window-blur'),
            description: t('settings.window-blur.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableWindowBlur === true,
                onChange: (v) => {
                    State.updateSettings({ enableWindowBlur: v });
                    const mode = v ? t('settings.window-blur.glass') : t('settings.window-blur.solid');
                    this.addRecentSetting(t('settings.window-blur'), mode, 'personalization');
                    State.addNotification({
                        title: t('settings.window-blur'),
                        message: t('settings.window-blur-changed', { mode }),
                        type: 'success'
                    });
                }
            })
        }));
        
        appearanceSection.appendChild(FluentUI.SettingItem({
            label: t('settings.auto-fullscreen'),
            description: t('settings.auto-fullscreen.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.autoEnterFullscreen !== false,
                onChange: (v) => {
                    State.updateSettings({ autoEnterFullscreen: v });
                    this.addRecentSetting(t('settings.auto-fullscreen'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({
                        title: t('settings.auto-fullscreen'),
                        message: t('settings.auto-fullscreen-changed', { status: v ? t('settings.on') : t('settings.off') }),
                        type: 'success'
                    });
                }
            })
        }));
        
        container.appendChild(appearanceSection);

        const advancedSection = this.createSection(t('settings.advanced-options'));
        const advancedItem = FluentUI.SettingItem({
            label: t('settings.advanced-options'),
            description: t('settings.advanced-options.desc'),
            control: (() => {
                const arrow = document.createElement('img');
                arrow.className = 'settings-entry-arrow';
                arrow.src = 'Theme/Icon/Symbol_icon/stroke/Arrow Right.svg';
                arrow.alt = '';
                return arrow;
            })(),
            className: 'settings-advanced-entry'
        });
        advancedItem.style.cursor = 'pointer';
        advancedItem.addEventListener('click', () => {
            this.navigateToPage('personalization-advanced');
        });
        advancedSection.appendChild(advancedItem);
        container.appendChild(advancedSection);
    },

    renderPersonalizationAdvanced(container) {
        container.className = 'settings-content settings-material-page settings-secondary-page';

        container.appendChild(this.createSecondaryBackBar(t('settings.personalization'), () => {
            container.classList.add('slide-out');
            setTimeout(() => this.navigateToPage('personalization'), 240);
        }));

        const section = this.createSection(t('settings.advanced-options'));
        const currentMaterial = State.settings.materialType === 'mica' ? 'mica' : 'gaussian';
        const materialLabels = {
            gaussian: t('settings.material.gaussian'),
            mica: t('settings.material.mica')
        };

        const preview = document.createElement('div');
        preview.className = `material-preview material-preview-${currentMaterial}`;
        preview.innerHTML = `
            <div class="material-preview-wallpaper"></div>
            <div class="material-preview-panel">
                <div class="material-preview-title">${t('settings.material')}</div>
                <div class="material-preview-subtitle">${materialLabels[currentMaterial]}</div>
            </div>
        `;
        section.appendChild(preview);

        let blurItem = null;

        const setMaterialMode = (value) => {
            State.updateSettings({ materialType: value });
            preview.className = `material-preview material-preview-${value}`;
            preview.querySelector('.material-preview-subtitle').textContent = materialLabels[value] || value;
            if (blurItem) {
                const isMica = value === 'mica';
                blurItem.classList.toggle('settings-mica-hidden', isMica);
                const blurSlider = blurItem.querySelector('.fluent-slider');
                const blurSliderWrapper = blurItem.querySelector('.fluent-slider-wrapper');
                if (blurSlider) blurSlider.disabled = isMica;
                if (blurSliderWrapper) blurSliderWrapper.classList.toggle('fluent-slider-disabled', isMica);
            }
            this.addRecentSetting(t('settings.material'), materialLabels[value] || value, 'personalization');
            State.addNotification({
                title: t('settings.material'),
                message: t('settings.material.changed', { material: materialLabels[value] || value }),
                type: 'success'
            });
        };

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.material'),
            description: t('settings.material.desc'),
            control: FluentUI.Select({
                value: currentMaterial,
                options: [
                    { value: 'gaussian', label: t('settings.material.gaussian') },
                    { value: 'mica', label: t('settings.material.mica') }
                ],
                onChange: setMaterialMode
            })
        }));

        const blur = Math.max(10, Math.min(70, Number(State.settings.blurIntensity ?? 40)));
        blurItem = FluentUI.SettingItem({
            label: t('settings.blur-intensity'),
            description: t('settings.blur-intensity.desc'),
            control: FluentUI.Slider({
                min: 10,
                max: 70,
                value: blur,
                step: 1,
                disabled: currentMaterial === 'mica',
                showValue: true,
                onChange: (v) => State.updateSettings({ blurIntensity: v })
            }),
            className: `settings-blur-strength-item ${currentMaterial === 'mica' ? 'settings-mica-hidden' : ''}`
        });
        section.appendChild(blurItem);

        section.appendChild(FluentUI.SettingItem({
            label: t('settings.button-glow-effect'),
            description: t('settings.button-glow-effect.desc'),
            control: FluentUI.Toggle({
                checked: State.settings.enableButtonGlowEffect !== false,
                onChange: (v) => {
                    State.updateSettings({ enableButtonGlowEffect: v });
                    this.addRecentSetting(t('settings.button-glow-effect'), v ? t('settings.on') : t('settings.off'), 'personalization');
                    State.addNotification({
                        title: t('settings.button-glow-effect'),
                        message: v ? t('settings.on') : t('settings.off'),
                        type: 'info'
                    });
                }
            })
        }));

        container.appendChild(section);
    },

});
