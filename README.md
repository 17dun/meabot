# Meabot

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge" alt="Manifest V3">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge" alt="Version">
</p>

> 自媒体账号分析神器 - 一键拆解小红书和抖音账号质量

Meabot 是一款专注于自媒体账号分析的 Chrome 浏览器扩展程序，支持对小红书和抖音账号进行深度数据分析，帮助内容创作者、运营人员和品牌方快速评估账号价值。

## ✨ 特性

- **多平台支持** - 同时支持小红书和抖音两大主流平台
- **智能评分体系** - 基于互动率、内容稳定性、受欢迎程度等维度综合评估账号质量
- **数据可视化** - 折线图直观展示近期作品表现趋势
- **高赞作品挖掘** - 自动识别并高亮显示超越平均水平的爆款内容
- **自动分析模式** - 支持开启自动分析，访问目标账号即自动完成分析
- **用户配置中心** - 灵活调整分析参数，满足个性化需求

## 📋 前提要求

- Chromium 内核浏览器（Chrome / Edge / Arc / Brave 等）
- Chrome 扩展程序开发者模式已开启

## 🚀 快速开始

### 安装步骤

1. 克隆或下载本项目到本地：
   ```bash
   git clone https://github.com/17dun/meabot.git
   ```

2. 打开浏览器扩展管理页面：
   - Chrome: 访问 `chrome://extensions`
   - Edge: 访问 `edge://extensions`

3. 开启右上角的「开发者模式」

4. 点击「加载已解压的扩展程序」

5. 选择本项目的根目录

### 使用方法

1. 访问小红书或抖音的用户主页
2. 点击浏览器工具栏中的扩展图标，或点击页面上的「开始分析」按钮
3. 等待分析完成，查看分析结果

## 📖 功能说明

### 核心分析维度

| 维度 | 说明 |
|------|------|
| 粉丝数 | 账号粉丝总量 |
| 获赞数 | 账号获得的总点赞数 |
| 互动率 | 点赞/粉丝比例，反映粉丝活跃度 |
| 内容稳定性 | 作品发布的频率和规律性 |
| 爆款率 | 高于平均点赞作品的比例 |

### 界面功能

- **质量得分** - 0-100分的综合评分
- **趋势图表** - 展示近30个作品的点赞趋势
- **高赞作品** - 列出表现优异的作品列表
- **自动高亮** - 在原页面中高亮爆款作品

## ⚙️ 配置选项

通过扩展弹出窗口可进行以下配置：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| 自动分析 | 访问目标页面时自动执行分析 | 关闭 |
| 高赞阈值 | 判断高赞作品的灵敏度 | 1.5倍 |

## 📁 项目结构

```
meabot/
├── manifest.json          # 扩展配置文件
├── background.js          # 后台 Service Worker
├── content.js             # 内容脚本（核心分析逻辑）
├── popup.html             # 弹出窗口界面
├── popup.js               # 弹出窗口逻辑
├── config.js              # 配置文件
├── icon.png               # 扩展图标
└── LICENSE                # 开源许可证
```

## 🔧 技术栈

- **语言**: Vanilla JavaScript (ES6+)
- **标记**: HTML5, CSS3
- **标准**: Chrome Manifest V3
- **存储**: chrome.storage.sync

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/awesome-feature`)
3. 提交更改 (`git commit -m 'Add some awesome feature'`)
4. 推送分支 (`git push origin feature/awesome-feature`)
5. 打开 Pull Request

## 📄 开源许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](LICENSE) 文件。

## ⚠️ 免责声明

- 本工具仅供学习和研究使用
- 请勿频繁请求造成平台压力
- 分析结果仅供参考，不保证准确性
- 使用本工具即表示同意承担相关风险

## 📬 联系方式

- 问题反馈: [GitHub Issues](https://github.com/your-repo/meabot/issues)
- 功能建议: [GitHub Issues](https://github.com/your-repo/meabot/issues)
- 欢迎微信技术交流: <img src="weixin.png" width="150" alt="微信二维码">

---

