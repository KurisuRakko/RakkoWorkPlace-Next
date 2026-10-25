/**
 * SettingsApp 页面实现分片 - 关于页面
 *
 * 本文件是设置应用（SettingsApp）的页面实现分片，承载「关于」页面成员
 * （aboutChangelog、renderAbout、renderAboutChangelog 等），必须紧跟在
 * js/apps/settings.js 之后加载（index.html 的 defer 文档顺序保证）。
 * 成员通过 Object.assign 挂回 SettingsApp，this 语义与拆分前完全一致。
 */
Object.assign(SettingsApp, {
    // 与当前仓库 git log 同步；同一天的提交共同组成一个日期版本。
    aboutChangelog: [
        { date: '2026-08-02', version: '2.5.260802', commits: [
            { hash: 'local', title: '进一步优化了触控体验，临时修复 AI Skill 文档下载问题。' },
            { hash: '7b60c1b', title: '本次更新完善了开发者中心自建 App 功能，新增 AI Skill 下载、三问式需求澄清、中英文自动适配、API 文档首次引导及打开提醒；权限改为安装后按需认证并记忆允许或拒绝结果；统一修复设置二级页面的返回按钮、羽化栏、弹性滚动和侧边栏高亮；同时加入全局触控优化，支持流畅手势滚动、长按呼出右键菜单，以及开始菜单长按 1 秒后才可拖动 App。' }
        ] },
        { date: '2026-07-23', version: '2.4.260723B', commits: [
            { hash: 'df647e5', title: '修复照片 App 设置锁屏壁纸不能立即生效。修复开启自动识别壁纸主题色后，更换壁纸不会立即重新识别并应用主题色的BUG。优化锁屏密码进入桌面的动画。App Shop 搜索页图标和文字跟随系统主题色。完善第三方 PWA 存储统计和卸载。存储未知的应用排在列表底部，并显示“未知”。设置 App 每次打开时只刷新一次存储数据。完善系统存储统计分类。引入动态导入容量：默认显示 1GB。导入文件超过 1GB 后扩展至 5GB。超过 5GB 后扩展至最高 10GB。新导入会导致总量超过 10GB 时阻止导入并提醒清理。文件 App 新增“音乐”文件夹：多媒体 App 导入的音乐自动出现在其中。修复了开始菜单文件名过长的显示异常问题。修复移动文件的时候会同时触发文件导入的BUG。修复了文件App内文件名过长的显示BUG。' }
        ] },
        { date: '2026-07-22', version: '2.4.260722A', commits: [
            { hash: '2198bd8', title: '完成了FluentOS青山湖阶段性重要功能更新，优化了系统响应速度和稳定性。修复照片、天气 App 的细节问题。调整了 Fluent App 安装器以及开发者中心安装包导入、源码查看和解包权限与逻辑。文件上传功能移至隐私设置并默认开启；大幅度整改实验室选项，移除弹窗与通知 Demo，新增跨 App 拖放和智能多开 App 窗口；特别注意“灵翼交互”即将下线，若有需要，请及时下载当前源码。新增系统交互音效，完善开机、关机、重启、通知与弹窗音效。优化小组件抽屉中锁屏与桌面之间可连续打断的非线性景深动画，并修复图标、文件拖动误触发上传的问题。统一控制中心滑块和悬停高光，修复通知中心布局、滚动、居中显示及单条通知模糊淡出、平滑补位。优化了 Fingo 对话卡片的进退场动画，同时保证背景模糊同步。改进了云母效果，现在云母效果可以正常显示。调整了个性化高级页面设置的实时预览窗，视觉更加协调，同时支持背景滚动以查看效果。修复开机加载圈动画卡顿的问题。' }
        ] },
        { date: '2026-07-21', version: '2.3.260721D', commits: [
            { hash: '258254b', title: '进一步清理了老旧无用代码，修复了部分已知BUG，提升了系统稳定性。' }
        ] },
        { date: '2026-07-20', version: '2.3.260720C', commits: [
            { hash: '86b835e', title: '修复了浏览器 App 被沙盒阻止本地存储，以及照片小组件切换到本机/收藏来源后无法加载、空库无提示的问题。新增第三方 PWA 与自建 App 的 storage.local 本地存储权限，覆盖制作、安装授权、安全校验、隔离读写和文档说明。' },
            { hash: 'a9c194d', title: '进一步优化了开发者中心App，完善了App安装逻辑和隐私权限获取逻辑，修复了大量BUG，新增全新App安装工具，正式采用新版fap格式作为App安装包，注意旧版安装包将不再适用，请重新导出安装包。' }
        ] },
        { date: '2026-07-18', version: '2.3.260718B', commits: [
            { hash: '49686ab', title: '修复了文件 App 中快捷方式拖动后消失、无法打开，以及双击启动缺少窗口动画的问题。 优化了窗口焦点、前后层级和全屏还原逻辑，彻底移除弹性效果，并让窗口与背景模糊动画保持同步。 修复了更换桌面或锁屏壁纸后，小组件静态模糊背景无法同步更新的问题。' }
        ] },
        { date: '2026-07-16', version: '2.3.260716A', commits: [
            { hash: '939a2ab', title: '彻底清理了老旧僵尸代码以及残留无用的 FluentOS 1.0 调用模块。大幅度提升了系统稳定性，修复设置 App 显示应用大小不显示总大小的 BUG；修复了新版窗口动画与多任务视图进入退出动画冲突的问题；修复了渲染滚动条不会实时跟随窗口的 BUG；修复了开发者中心自建 App 开启强制 FluentUI 导致的部分视觉 BUG；修复了多任务视图模式下 Alt+D 导致的动画冲突 BUG；增强了开发者中心 App 的稳定性和优化了部分页面下的动画视觉效果；修复了第三方自建专业App调用系统通知和弹窗API失败的BUG；修复了桌面上App图标删除逻辑的BUG。' }
        ] },
        { date: '2026-07-15', version: '2.3.260715', commits: [
            { hash: 'd22d04a', title: '修复了图片请求白名单仍会被拦截的 BUG' },
            { hash: '7c3479b', title: '调整了窗口动画和逻辑，修复大量开发中心(BETA)App的BUG，修复了一个严重安全漏洞：第三方自建App可能存在不规范的云端请求问题，现已支持沙箱拦截。' },
            { hash: '31b5189', title: '修复大量已知BUG，新增全新开发者中心(BETA)App，需要在实验室中启用。注意：当前App仍然处于开发中，可能存在大量未知问题，请谨慎使用。' }
        ] },
        { date: '2026-07-13', version: '2.2.260713', commits: [
            { hash: 'dca9cc5', title: '修复系统内无法彻底删除文件的严重BUG；重新调整了设置App的存储统计，改为了真实大小；引入全新终端App；进一步优化了系统体验，修复了部分视觉问题，并修复了部分场景内容滚动BUG' },
            { hash: '2ab5cdc', title: '进一步完成系统瘦身优化工作，更新了文件导入模块，引入全新进程管理 App' }
        ] },
        { date: '2026-07-12', version: '2.1.260712', commits: [
            { hash: 'aaa40e2', title: '完成对系统瘦身优化工作，删除大量不必要的重复组件' },
            { hash: '6decb2e', title: '紧急修复计时器的意外奔溃BUG' }
        ] },
        { date: '2026-07-10', version: '2.0.260710', commits: [
            { hash: '5ea6284', title: '大幅度提升系统稳定性，对多媒体、照片、小组件等多项功能和App针对性优化，并完善了从外部导入文件的逻辑，优化了桌面交互动画，修复了再某些情况下壁纸会丢失的BUG' },
            { hash: 'd1f013d', title: '完成系统版本号发布前最后的迭代，补充了更新日志的细节' }
        ] },
        { date: '2026-07-06', version: '2.0.260706', commits: [
            { hash: '112ae34', title: '优化 OOBE 视觉效果，新增“大功告成”完成页、交互式粒子动画与非线性桌面过渡' },
            { hash: '77859ed', title: '进一步优化时钟 App 体验，提醒事项支持及时通知' },
            { hash: '50d4526', title: '完成全新提示 App，帮助用户了解新功能并完成入门引导' }
        ] },
        { date: '2026-07-03', version: '2.0.260703.1', commits: [
            { hash: '7c07eac', title: '优化小组件位置自适应逻辑，并完善部分视觉效果' },
            { hash: 'e9f8832', title: '删除不再使用的额外图标资源' },
            { hash: '66422b8', title: '完成 FluentOS 青山湖首个正式版本' },
            { hash: '22a89c6', title: '进一步优化小组件体验，新增横向自适应位置调整' }
        ] },
        { date: '2026-07-02', version: '2.0.260702', commits: [
            { hash: 'ca4ffa9', title: '完成开机流程优化，大幅提高开机速度' },
            { hash: '8c6364f', title: '完善浏览器 App、收藏与搜索小组件联动，优化交互细节并修复已知 BUG' },
            { hash: '0a5b367', title: '修复已知 BUG，提升系统稳定性' },
            { hash: '6c5173f', title: '修复大量已知 BUG，提升系统稳定性，并优化 App Shop 交互动画' },
            { hash: '3c3c65b', title: '修复按钮图标错误请求导致的后台大量报错问题' },
            { hash: '6fd0587', title: '完成全新 FluentOS 青山湖 OOBE 界面开发工作，并统一 Fluent UI 组件库的开关控件设计语言' }
        ] },
        { date: '2026-06-30', version: '2.0.260630', commits: [
            { hash: '73e528e', title: '完成新版设置关于页面开发' }
        ] },
        { date: '2026-06-27', version: '2.0.260627', commits: [
            { hash: 'fcb7056', title: '修复已知视觉BUG，进一步优化了多媒体App' }
        ] },
        { date: '2026-06-26', version: '2.0.260626', commits: [
            { hash: '20833ed', title: '彻底修复大量已知BUG，大幅度提高系统稳定性' },
            { hash: 'd140b7b', title: '照片App大升级，采用新一代App框架，统一设计语言，并支持导入本地照片功能，和文件App完成联动，修复大量已知BUG，并调整了部分场景下的动画' }
        ] },
        { date: '2026-06-24', version: '2.0.260624', commits: [
            { hash: '110ff49', title: '完成对时钟App的日历方面重构，但仍需优化，新增提醒事项小组件，修复大量已知BUG，新增任务栏App窗口预览功能，彻底重构了相机App' }
        ] },
        { date: '2026-06-18', version: '2.0.260618', commits: [
            { hash: '72f21fa', title: '全新计算器App已上线，快记App新增大量编辑功能，进一步优化了快记App，修复大量已知BUG' },
            { hash: '16edb5e', title: '新增全新的性能工具开关，进一步优化了窗口逻辑' }
        ] },
        { date: '2026-06-17', version: '2.0.260617', commits: [
            { hash: '86fbd64', title: '进一步优化了小组件的设计，调整了天气、音乐卡片，新增日历小组件，优化了窗口逻辑，修复大量已知BUG' }
        ] },
        { date: '2026-06-14', version: '2.0.260614', commits: [
            { hash: 'e1d97c5', title: '基本完成对新一代Notes的开发工作80%' }
        ] },
        { date: '2026-06-13', version: '2.0.260613', commits: [
            { hash: '02916ed', title: '进一步完善了小组件编辑界面以及相关动画优化' }
        ] },
        { date: '2026-06-12', version: '2.0.260612', commits: [
            { hash: '62f2e02', title: '新增统一的小组件编辑功能，优化了窗口切换动画' }
        ] },
        { date: '2026-06-11', version: '2.0.260611', commits: [
            { hash: '5f85669', title: '修复大量已知BUG，天气App新增搜索和当前位置天气的功能，优化了小组件' },
            { hash: '5a6987c', title: '完善小组件交互细节，修复大量小组间产生的BUG' }
        ] },
        { date: '2026-06-10', version: '2.0.260610', commits: [
            { hash: '1ced11a', title: '解决实时模糊层可能会导致的意外白线/黑线出现过于频繁的问题，采用实时+静态模糊动态调整，大幅降低GPU渲染压力，大幅减少意外线条出现' },
            { hash: '695e4c8', title: '进一步完善小组件开发工作90%' },
            { hash: 'd49a310', title: '优化了侧边栏的UI，修复侧边栏不能滚动的BUG' },
            { hash: 'b5450d2', title: '基本完成全新小组件的功能开发80%' },
            { hash: '8c84760', title: '完成FluentOS全新UI开发，精简并统一了原生级App的窗口代码模块' }
        ] },
        { date: '2026-06-09', version: '2.0.260609', commits: [
            { hash: '845f78f', title: '完成一些小BUG的修补工作' }
        ] },
        { date: '2026-06-08', version: '2.0.260608', commits: [
            { hash: '5b1d15d', title: '完善窗口逻辑，新增全新自定义主题色' },
            { hash: '239c50e', title: 'App Shop全新版本基本完成开发' },
            { hash: 'c1a8214', title: 'App Shop新版开发工作60%' },
            { hash: '70ddb46', title: '完成App Shop应用扩充' }
        ] },
        { date: '2026-06-07', version: '2.0.260607', commits: [
            { hash: '45428a5', title: '完成全新高光效果开发' },
            { hash: 'fd9d197', title: '基本完成模糊程度+云母材质效果切换' },
            { hash: '544ea15', title: '更换图标并优化UI界面' }
        ] },
        { date: '2026-06-06', version: '2.0.260606', baseline: true, commits: [] }
    ],

    renderAbout(container) {
        container.className = 'settings-content settings-about';

        const section = this.createSection(t('settings.about-title'));
        const currentVersion = this.aboutChangelog[0].version;
        const qingshanLakeName = t('settings.about.qingshan-lake');
        const qingshanLakeCodename = qingshanLakeName && qingshanLakeName !== 'Qingshan Lake'
            ? `${t('settings.about.codename')}：${qingshanLakeName}`
            : 'Qingshan Lake';

        const heroCard = document.createElement('div');
        heroCard.className = 'fluent-setting-item settings-about-hero-card';
        heroCard.innerHTML = `
            <div class="settings-about-landscape" aria-hidden="true">
                <img class="settings-about-landscape-layer settings-about-landscape-sky" src="Theme/Qingshan_lake/03_sky_far_background_mountains.png" alt="">
                <img class="settings-about-landscape-layer settings-about-landscape-water-base" src="Theme/Qingshan_lake/04_water_base_gradient_bands.png" alt="">
                <img class="settings-about-landscape-layer settings-about-landscape-reflection" src="Theme/Qingshan_lake/05_water_reflection_bands.png" alt="">
                <img class="settings-about-landscape-layer settings-about-landscape-mountain-middle" src="Theme/Qingshan_lake/06_middle_colored_mountain_slopes.png" alt="">
                <img class="settings-about-landscape-layer settings-about-landscape-mountain-dark" src="Theme/Qingshan_lake/07_dark_mountain_peaks.png" alt="">
                <img class="settings-about-landscape-layer settings-about-landscape-land" src="Theme/Qingshan_lake/09_foreground_dark_land.png" alt="">
                <img class="settings-about-landscape-layer settings-about-landscape-trees" src="Theme/Qingshan_lake/10_tree_silhouettes.png" alt="">
            </div>
            <div class="settings-about-brand">
                <div class="settings-about-brand-logo">
                    <img class="settings-about-logo-light" src="Theme/Icon/Fluent_logo.png" alt="">
                    <img class="settings-about-logo-dark" src="Theme/Icon/Fluent_logo_dark.png" alt="">
                </div>
                <div class="settings-about-brand-name">RakkoWorkPlace-Next</div>
            </div>
            <div class="settings-about-card-codename">${qingshanLakeCodename}</div>
        `;
        section.appendChild(heroCard);
        const aboutTitleEl = section.querySelector('.settings-section-title');
        const bindDevTap = (el) => {
            if (!el) return;
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => this._handleAboutDeveloperTap());
        };
        bindDevTap(aboutTitleEl);
        bindDevTap(heroCard);

        const projectUrl = 'https://github.com/YoYoPAN1115/FluentOS-On-Web';
        const metaCard = document.createElement('div');
        metaCard.className = 'fluent-setting-item settings-about-meta-card';
        metaCard.innerHTML = `
            <div class="settings-about-meta-row">
                <div class="settings-about-meta-label">${t('settings.about.project-url')}</div>
                <a class="settings-about-meta-link" href="${projectUrl}" target="_blank" rel="noopener noreferrer">${projectUrl}</a>
            </div>
        `;
        section.appendChild(metaCard);

        const list = FluentUI.List({
            className: 'settings-about-list',
            items: [
                { id: 'changelog', title: t('settings.about.changelog'), description: t('settings.about.changelog-desc'), icon: 'Document', extra: '›' },
                { id: 'version', title: t('settings.version'), description: currentVersion, icon: 'Information Circle' },
                { id: 'tech', title: t('settings.tech-stack'), description: 'HTML5 + CSS3 + JavaScript', icon: 'Database 2' },
                { id: 'license', title: t('settings.license'), description: 'MIT License', icon: 'Document' }
            ],
            onItemClick: (id) => {
                if (id === 'changelog') this.navigateToPage('about-changelog');
            }
        });
        const changelogItem = list.querySelector('[data-id="changelog"]');
        if (changelogItem) {
            changelogItem.setAttribute('role', 'button');
            changelogItem.tabIndex = 0;
            changelogItem.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                this.navigateToPage('about-changelog');
            });
        }
        section.appendChild(list);
        container.appendChild(section);
    },

    renderAboutChangelog(container) {
        container.className = 'settings-content settings-about-changelog settings-secondary-page';

        const section = document.createElement('section');
        section.className = 'settings-section settings-changelog-page';

        container.appendChild(this.createSecondaryBackBar(t('settings.about-title'), () => {
            section.classList.add('slide-out');
            setTimeout(() => this.navigateToPage('about'), 240);
        }));

        const commitCount = this.aboutChangelog.reduce((total, release) => total + release.commits.length, 0);
        const header = document.createElement('header');
        header.className = 'settings-changelog-header';
        header.innerHTML = `
            <div>
                <h1 class="settings-changelog-title">${t('settings.about.changelog')}</h1>
                <p class="settings-changelog-subtitle">${t('settings.about.changelog-subtitle')}</p>
            </div>
            <div class="settings-changelog-count">${t('settings.about.commit-count', { count: commitCount })}</div>
        `;
        section.appendChild(header);

        const timeline = document.createElement('div');
        timeline.className = 'settings-changelog-timeline';

        this.aboutChangelog.forEach((release, index) => {
            const entry = document.createElement('article');
            entry.className = `fluent-setting-item settings-changelog-entry${release.baseline ? ' is-baseline' : ''}`;
            entry.style.setProperty('--log-index', index);

            const entryHead = document.createElement('div');
            entryHead.className = 'settings-changelog-entry-head';
            entryHead.innerHTML = `
                <div class="settings-changelog-version">${release.version}</div>
                <time class="settings-changelog-date" datetime="${release.date}">${release.date}</time>
            `;
            entry.appendChild(entryHead);

            if (release.baseline) {
                const baseline = document.createElement('div');
                baseline.className = 'settings-changelog-baseline';
                baseline.textContent = t('settings.about.baseline');
                entry.appendChild(baseline);
            } else {
                const commits = document.createElement('div');
                commits.className = 'settings-changelog-commits';
                release.commits.forEach(commit => {
                    const commitRow = document.createElement('div');
                    commitRow.className = 'settings-changelog-commit';

                    const hash = document.createElement('span');
                    hash.className = 'settings-changelog-hash';
                    hash.textContent = commit.hash;

                    const title = document.createElement('span');
                    title.className = 'settings-changelog-commit-title';
                    title.textContent = commit.title;

                    commitRow.append(hash, title);
                    commits.appendChild(commitRow);
                });
                entry.appendChild(commits);
            }

            timeline.appendChild(entry);
        });

        section.appendChild(timeline);
        container.appendChild(section);
    },

    _handleAboutDeveloperTap() {
        if (this._developerModeVisible === true) {
            this.currentPage = 'developer';
            this.render();
            return;
        }

        this._aboutDevTapCount += 1;

        const remain = 10 - this._aboutDevTapCount;
        if (remain > 0 && remain <= 3) {
            State.addNotification({
                title: t('settings.developer-title'),
                message: t('settings.developer-unlock-remaining', { count: remain }),
                type: 'info'
            });
        }
        if (this._aboutDevTapCount < 10) return;

        this._aboutDevTapCount = 0;
        this._developerModeVisible = true;
        State.addNotification({
            title: t('settings.developer-title'),
            message: t('settings.developer-unlocked'),
            type: 'success'
        });

        this.currentPage = 'developer';
        this.render();
    },

    formatTombstoneFreezeDelay(ms) {
        const seconds = Math.max(3, Math.min(600, Math.round(Number(ms || 60000) / 1000)));
        const isEn = typeof I18n !== 'undefined' && I18n.currentLang === 'en';
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const rest = seconds % 60;
        if (rest === 0) return isEn ? `${minutes} min` : `${minutes} 分钟`;
        return isEn ? `${minutes} min ${rest}s` : `${minutes} 分 ${rest} 秒`;
    },

    getTombstoneFreezeDelayMs() {
        const raw = State.settings.tombstoneFreezeDelayMs;
        if (State.normalizeTombstoneFreezeDelay) {
            return State.normalizeTombstoneFreezeDelay(raw);
        }
        const numeric = Number(raw);
        if (!Number.isFinite(numeric)) return 60 * 1000;
        return Math.max(3 * 1000, Math.min(10 * 60 * 1000, Math.round(numeric)));
    },

    createTombstoneFreezeDelayControl() {
        const currentMs = this.getTombstoneFreezeDelayMs();
        const control = document.createElement('div');
        control.className = 'settings-slider-control';

        const valueLabel = document.createElement('span');
        valueLabel.className = 'fluent-slider-value';
        valueLabel.style.minWidth = '68px';
        valueLabel.textContent = this.formatTombstoneFreezeDelay(currentMs);

        const slider = FluentUI.Slider({
            min: 3,
            max: 600,
            value: Math.round(currentMs / 1000),
            step: 1,
            showValue: false,
            onChange: (seconds) => {
                const nextMs = Math.max(3, Math.min(600, Number(seconds))) * 1000;
                valueLabel.textContent = this.formatTombstoneFreezeDelay(nextMs);
                State.updateSettings({ tombstoneFreezeDelayMs: nextMs });
            }
        });

        control.appendChild(slider);
        control.appendChild(valueLabel);
        return control;
    },

});
