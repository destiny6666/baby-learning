# 宝贝学习乐园

适合三岁半亲子陪玩的静态网页。无需后端，学习进度保存在浏览器中，可导出、导入备份。

- 每轮约 10 个小练习，可中途休息并继续。
- 有语音反馈时，播完自动继续；无语音时等待 3 秒，也可手动继续。
- 英语每轮随机选择 3 个单词，新一轮避开上一轮的词；续玩和错题复习保留原词组。
- 成长乐园包含生活习惯与情绪表达，各 10 个图片活动。
- 新版保存到 `wb_baole_pro_v2`，首次可只读迁移旧版 `wb_baole_pro_v1`，不覆盖旧站进度。

## 本地运行与测试

使用 Node.js 22 或更高版本，安装依赖后在项目根目录启动任意静态 HTTP 服务（测试默认端口为 5173）。

```sh
pnpm install --frozen-lockfile
node scripts/run-unit-coverage.cjs
node --test --test-concurrency=2 *.test.cjs
```

浏览器测试需要安装 Playwright 和 Microsoft Edge，运行时静音。单元测试使用 JSDOM 与可控时钟，不播放真实声音。覆盖率统计包括全部业务 JavaScript（HTML 内联及功能文件），不包括生成的音频数据清单。业务代码行覆盖率门槛为 95%，完整报告生成在 `coverage/index.html`。

## 音频

`audio/` 中有配套 MP3，文本与文件映射在 `speech-catalog.js`。新增文案时：

1. `node scripts/build-speech-catalog.cjs` 生成精确文本清单。
2. Windows 运行 `scripts/generate-speech.ps1` 合成缺失语音（需 Huihui、Zira 系统语音）。
3. 使用安装了 `lameenc` 的 Python 运行 `scripts/encode-speech.py` 压缩 MP3。

## GitHub Pages

旧版根入口保持原样，新版位于 `/baby-learning/play/`。将发布分支的旧站检出到 `.worktrees/mobile-release` 后运行：

```sh
node scripts/build-pages.cjs .worktrees/mobile-release/play
```

构建仅复制静态运行文件和音频，不上传测试、覆盖率、依赖或本地用户数据。提交发布目录并推送 Pages 使用的分支后，验证手机链接和语音资源。
