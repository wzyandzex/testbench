# AuthPage 登录注册页专项优化追踪计划

## 🎯 问题诊断 (Problem Diagnosis)
通过对 `http://localhost:3000/auth` 的深入审查，我发现了导致“排版布局不对劲”和“样式诡异”的几个核心问题：

1. **Flexbox 布局断层问题 (Layout Gap)**:
   - 原 CSS 中 `.auth-brand` 设置了固定比例 `flex: 0 0 60%; max-width: 60%`，而 `.auth-form-section` 设置了 `flex: 0 0 40%` 但又强制了 `max-width: 560px`。
   - **后果**：在大屏显示器（如 1920px）下，60% 是 1152px，表单达到上限 560px，加起来只有 1712px。屏幕右侧会直接空出几百像素的纯黑/纯白断层黑边，导致排版严重失衡！
2. **浅色模式强覆盖失效 (Light Mode Contrast)**:
   - 之前修复了部分暗黑模式，但浅色模式下，Ant Design 的 Input 输入框、Tabs 切换条的字体颜色默认继承了外层的白色，导致“白底白字”看不清。
   - 分隔符 (Divider) 和 底部的 Social 按钮在浅色模式下的 Hover 状态突兀。
3. **响应式媒体查询冗余 (Responsive Bloat)**:
   - 大量的 `@media` 修改 `:root` 的百分比变量，导致中间分辨率段出现卡顿式的跳跃布局，不够流畅。

---

## 📅 专项调整与优化计划 (Action Plan)

### 阶段 1：流式排版重构 (Fluid Layout Refactoring) ✅ [已完成]
- [x] **品牌侧自适应**: 将 `.auth-brand` 从写死的百分比改为 `flex: 1`，让其自动填满表单剩余的所有空间，根除右侧黑边问题。
- [x] **表单侧弹性约束**: 将 `.auth-form-section` 约束为 `width: 100%; max-width: 480px` (或更优雅的变量)，使其保持恒定可读宽度。
- [x] **清理冗余媒体查询**: 删除依赖硬编码百分比 (`--auth-brand-width`) 的过渡断点，依赖 Flex 自身的弹性计算。

### 阶段 2：深浅主题精细化映射 (Theme Mapping) ✅ [已完成]
- [x] **浅色模式输入框**: 修复白底环境下的 `placeholder` 和输入文字的对比度。
- [x] **Tabs 选中态与动效**: 调整 `.ant-tabs-tab-active` 在浅色模式下的背景高亮与文字颜色 (`#667eea` 品牌色)。
- [x] **背景色反转边界**: 确保浅色模式下左侧 (Brand) 和右侧 (Form) 背景呈现出优雅的高级灰与纯白对比 (`#f8fafc` vs `#ffffff`)，取代现有的突兀过渡。

### 阶段 3：微交互与细节抛光 (Micro-interactions) ✅ [已完成]
- [x] 按钮的 Loading 态避免宽度抖动。
- [x] 社交登录按钮 (Social Buttons) 增加品牌色 Hover 特效。
- [x] 输入框 Focus 时的光晕 (box-shadow) 在浅/深色模式下的透明度映射。

---
*追踪状态已建立。将自动执行修复脚本。*