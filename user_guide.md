# Sequence Diagram Web Component — 使用指南

> 一个零依赖（对宿主页面而言）的 `<sequence-diagram>` 自定义元素，使用 JSON 数据渲染交互式时序图。内部使用 React + React Flow 渲染，并通过 Shadow DOM 与宿主页面样式完全隔离。

---

## 目录

1. [快速上手](#1-快速上手)
2. [如何把组件插入到 HTML 中](#2-如何把组件插入到-html-中)
3. [JSON 数据模型](#3-json-数据模型)
4. [HTML 属性（Attributes）参考](#4-html-属性attributes参考)
5. [JavaScript 属性（Properties）参考](#5-javascript-属性properties参考)
6. [方法（Methods）参考](#6-方法methods参考)
7. [事件（Events）参考](#7-事件events参考)
8. [CSS 自定义属性](#8-css-自定义属性)
9. [示例](#9-示例)
10. [浏览器支持与限制](#10-浏览器支持与限制)

---

## 1. 快速上手

最小可运行示例（两个参与者 + 一条同步消息）：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>Hello Sequence</title>
</head>
<body>

  <!-- 1. 引入组件（IIFE 版本，构建后文件位于 dist/） -->
  <script src="./sequence-diagram.iife.js"></script>

  <!-- 2. 在页面任意位置放置自定义元素，并嵌入 JSON -->
  <sequence-diagram id="hello" height="300px">
    <script type="application/json">
    {
      "schemaVersion": "1.0",
      "participants": [
        { "id": "alice", "label": "Alice" },
        { "id": "bob",   "label": "Bob" }
      ],
      "events": [
        {
          "id": "m1",
          "type": "message",
          "from": "alice",
          "to": "bob",
          "label": "你好！",
          "messageKind": "sync"
        }
      ]
    }
    </script>
  </sequence-diagram>

</body>
</html>
```

保存为 `hello.html`，通过任意静态服务器（如 `python3 -m http.server`）打开即可看到效果。

---

## 2. 如何把组件插入到 HTML 中

### 2.1 加载组件脚本

构建产物位于 `dist/`，提供两种入口：

| 文件 | 适用场景 | 用法 |
| --- | --- | --- |
| `dist/sequence-diagram.iife.js` | 普通静态 HTML，无构建工具 | `<script src="dist/sequence-diagram.iife.js"></script>` |
| `dist/sequence-diagram.es.js` | 现代打包工具（Vite、webpack、Rollup） | `<script type="module" src="dist/sequence-diagram.es.js"></script>` |

> 组件的样式会作为一段 `<style>` 内联进 Shadow DOM，因此**不需要**额外引入 CSS 文件。

### 2.2 三种向组件传递数据的方式

#### 方式 A：嵌入 `<script type="application/json">` 子节点（最常用）

```html
<sequence-diagram height="400px">
  <script type="application/json">
  { "schemaVersion": "1.0", "participants": [...], "events": [...] }
  </script>
</sequence-diagram>
```

组件在连接（`connectedCallback`）时会自动读取第一个匹配的 `<script>` 子节点并解析。

#### 方式 B：使用 `data-json` 属性

```html
<sequence-diagram data-json='{"schemaVersion":"1.0",...}'></sequence-diagram>
```

适合在 HTML 中完全内联、又不想再加一层 `<script>` 的场景。注意属性值必须用单引号包裹以避免与 JSON 内部的双引号冲突。

#### 方式 C：通过 JavaScript `data` 属性动态注入

```html
<sequence-diagram id="d" palette="ocean" height="400px"></sequence-diagram>
<script>
  customElements.whenDefined('sequence-diagram').then(() => {
    const el = document.getElementById('d');
    el.data = {
      schemaVersion: "1.0",
      participants: [{ id: "u", label: "用户" }, { id: "s", label: "服务器" }],
      events: [
        { id: "m1", type: "message", from: "u", to: "s", label: "请求", messageKind: "sync" }
      ]
    };
  });
</script>
```

> `el.data` 接受对象或 JSON 字符串，赋值为 `null` 可以清空。

三种方式可以混用：先在 HTML 中嵌入默认 JSON，再在脚本里用 `el.data = ...` 替换；后者会覆盖前者。

### 2.3 容器尺寸

`<sequence-diagram>` 自身是 `display: block` 的块级元素。**必须显式设置高度**，否则默认为 `520px`：

```html
<style>
  sequence-diagram {
    width: 100%;
    height: 500px;     /* 或通过 height="500px" HTML 属性 */
  }
</style>
```

---

## 3. JSON 数据模型

整个时序图由一份根 JSON 描述，根对象必填字段为 `schemaVersion`、`participants`、`events`。

### 3.1 根对象（`SequenceDiagramData`）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `schemaVersion` | `"1.0"` | ✅ | 固定字符串，标识数据模型版本。 |
| `id` | `string` | ❌ | 可选 ID，便于事件 detail 中识别。 |
| `title` | `string` | ❌ | 标题（当前不直接渲染，预留给未来扩展）。 |
| `description` | `string` | ❌ | 描述（当前不直接渲染）。 |
| `participants` | `Participant[]` | ✅ | 所有参与方，至少 1 个。 |
| `events` | `SequenceEvent[]` | ✅ | 事件序列。允许空数组。 |
| `options` | `DiagramDataOptions` | ❌ | 全局展示选项（见 3.6）。 |

### 3.2 参与方（`Participant`）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | 在整个数据中唯一，用于事件中引用。 |
| `label` | `string` | ✅ | 顶部显示的标题文字。最长 60 字符。 |
| `subtitle` | `string` | ❌ | 副标题，更小字号显示在 label 下方。 |
| `kind` | `ParticipantKind` | ❌ | 决定顶部图标的语义类型。可选值见下表。 |
| `icon` | `ParticipantIcon` | ❌ | 强制指定一个具体图标，覆盖 `kind` 的默认图标。可选值见下表。 |
| `accent` | `string` | ❌ | 自定义强调色（CSS 颜色字符串）。 |
| `metadata` | `Record<string, string \| number \| boolean \| null>` | ❌ | 任意附加元数据，宿主可通过事件获取。 |

**`kind` 取值：** `"actor" | "service" | "system" | "database" | "queue" | "external"`

**`icon` 取值：** `"person" | "server" | "database" | "queue" | "cloud" | "browser"`

### 3.3 事件联合类型（`SequenceEvent`）

每个事件都拥有 `id` 和 `type` 字段，根据 `type` 区分形态：

#### 3.3.1 消息事件 `type: "message"`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | 事件唯一 ID。 |
| `type` | `"message"` | ✅ | 固定值。 |
| `from` | `string` | ✅ | 发起方 `Participant.id`。 |
| `to` | `string` | ✅ | 接收方 `Participant.id`。**`from === to` 时渲染为自调用（self-call）弧线。** |
| `label` | `string` | ✅ | 消息文字。最长 500 字符。 |
| `messageKind` | `"sync" \| "async" \| "return"` | ❌ | 同步 / 异步 / 返回；默认 `"sync"`。 |
| `number` | `string \| number` | ❌ | 自定义序号，显示在箭头上。 |
| `status` | `"normal" \| "success" \| "warning" \| "error" \| "muted"` | ❌ | 颜色状态。默认 `"normal"`。 |
| `tooltip` | `string` | ❌ | 鼠标悬停时显示的提示文字。 |
| `metadata` | `Record<string, ...>` | ❌ | 任意附加元数据。 |

#### 3.3.2 注释事件 `type: "note"`

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | 事件唯一 ID。 |
| `type` | `"note"` | ✅ | 固定值。 |
| `text` | `string` | ✅ | 注释正文。最长 2000 字符。 |
| `over` | `string[]` | ✅ | 该注释跨越的参与者 ID 列表（至少 1 个）。 |
| `placement` | `"left" \| "right" \| "center"` | ❌ | 相对生命线位置，默认 `"right"`。 |
| `tone` | `"info" \| "success" \| "warning" \| "error" \| "neutral"` | ❌ | 颜色基调，默认 `"neutral"`。 |

#### 3.3.3 激活事件 `type: "activate"`

```json
{ "id": "a1", "type": "activate", "participant": "server" }
```

`participant` 为该生命线添加一段激活条（表示该对象正在处理请求）。

#### 3.3.4 解除激活事件 `type: "deactivate"`

```json
{ "id": "d1", "type": "deactivate", "participant": "server" }
```

必须与先前的 `activate` **配对**（同一参与者），否则会作为警告处理。组件会自动补齐在数据末尾缺失的 deactivate。

#### 3.3.5 分隔线事件 `type: "divider"`

```json
{ "id": "div1", "type": "divider", "label": "等待 2 秒" }
```

`label` 可选，缺省时为纯横线。

#### 3.3.6 复合片段事件 `type: "fragment"`

复合片段（combined fragment）用来表达 `alt` / `opt` / `loop` / `par` / `critical` / `break` 等控制结构。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | 事件唯一 ID。 |
| `type` | `"fragment"` | ✅ | 固定值。 |
| `fragmentKind` | `FragmentKind` | ✅ | 片段种类。 |
| `label` | `string` | ❌ | 片段标题。 |
| `participants` | `string[]` | ❌ | 该片段涉及的参与者 ID；不写则按事件动态推断。 |
| `branches` | `FragmentBranch[]` | ✅ | 分支列表，至少 1 个。 |

**`fragmentKind` 取值：**

| 取值 | 含义 | 分支建议数量 |
| --- | --- | --- |
| `"alt"` | 条件分支（if / else） | 2+ |
| `"opt"` | 可选分支（if） | 1 |
| `"loop"` | 循环 | 1 |
| `"par"` | 并行分支 | 2+ |
| `"critical"` | 临界区 | 1 |
| `"break"` | 中断跳出 | 1 |

**`FragmentBranch` 结构：**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | ✅ | 分支唯一 ID。 |
| `label` | `string` | ❌ | 分支条件文本，例如 `"已授权"`、`"while 未完成"`。 |
| `events` | `SequenceEvent[]` | ✅ | 该分支下的事件。允许嵌套 `fragment`（最大嵌套深度为 4）。 |

### 3.4 `options` 展示选项

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `showSequenceNumbers` | `boolean` | `false` | 在每条消息前显示自动序号。 |
| `showParticipantIcons` | `boolean` | `true` | 是否在参与方顶部显示图标。 |
| `messageLabelMaxWidth` | `number` | `220` | 消息文字的最大像素宽度。 |
| `participantWidth` | `number` | `140` | 每个参与方头部的像素宽度。 |
| `participantGap` | `number` | `40` | 参与方之间的像素间距。 |
| `rowGap` | `number` | `50` | 事件行之间的像素间距。 |

---

## 4. HTML 属性（Attributes）参考

所有属性都是**可观察**的（`observedAttributes`），通过 `setAttribute` 修改会触发重渲染。布尔属性的取值为 `"true" | "false" | "1"`，其他值会回退到默认值。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `theme` | `"light" \| "dark" \| "system"` | `"system"` | 颜色主题。`system` 时跟随操作系统的 `prefers-color-scheme`。 |
| `palette` | `"classic" \| "ocean" \| "forest" \| "violet" \| "sunset" \| "rose" \| "slate"` | `"classic"` | 调色板，决定强调色与各色阶。 |
| `height` | CSS 长度 | `"520px"` | 组件容器高度，支持 `px / em / rem / % / vh / vw`。 |
| `min-zoom` | `number` | `0.1` | 允许的最小缩放，限制在 `[0.01, 10]`。 |
| `max-zoom` | `number` | `2` | 允许的最大缩放，限制在 `[0.01, 10]`。 |
| `controls` | `boolean` | `true` | 是否显示 React Flow 的平移/缩放控件（右下角）。 |
| `minimap` | `boolean` | `false` | 是否显示缩略图。 |
| `fit-view` | `boolean` | `true` | 首次渲染时是否自动缩放到合适视口。 |
| `interactive` | `boolean` | `true` | 是否允许用户平移/缩放。设为 `false` 后只读。 |
| `show-background` | `boolean` | `false` | 是否显示点状背景网格。 |
| `aria-label` | `string` | `"auto"` | 屏幕阅读器朗读文本。设为 `"auto"` 时使用 `title` 或自动生成。 |
| `data-json` | `string` | — | 整段 JSON 字符串，与嵌入 `<script>` 等价。 |

### 4.1 7 种内置调色板速览

| 名称 | 风格 | 适合 |
| --- | --- | --- |
| `classic` | 中性蓝 | 默认通用 |
| `ocean` | 蓝绿 | 海洋 / 工程类文档 |
| `forest` | 翠绿 | 自然 / 可持续主题 |
| `violet` | 紫色 | 创意 / 设计类 |
| `sunset` | 橙红 | 暖色 / 报告类 |
| `rose` | 玫红 | 柔和 / 品牌化 |
| `slate` | 蓝灰 | 极简 / 印刷品 |

---

## 5. JavaScript 属性（Properties）参考

```ts
const el = document.querySelector('sequence-diagram');

el.data               // SequenceDiagramData | string | null
el.theme              // "light" | "dark" | "system"
el.palette            // PaletteName
el.config             // Partial<SequenceDiagramConfig>   （只读快照）
el.validationErrors   // SequenceDiagramError[]           （只读）
el.validationWarnings // SequenceDiagramWarning[]         （只读）
```

> 设置 `el.data` 时如果数据校验失败，`el.validationErrors` 会填充错误列表，并触发 `sequence-error` 事件。

`el.config` 对象的字段对应 `min-zoom`、`max-zoom`、`controls` 等所有同名的 HTML 属性。

---

## 6. 方法（Methods）参考

```ts
el.setData(data)               // 设置数据（对象或 JSON 字符串），等价于 el.data = data
el.getData()                   // 读取当前数据
el.validateData(data?)         // 校验数据。若不传参，则校验当前数据。
el.fitView({ padding?, duration? })  // 平滑缩放到合适视口
el.resetView()                 // 视口重置为 { x: 0, y: 0, zoom: 1 }
el.refresh()                   // 强制重新处理当前数据并重渲染
```

---

## 7. 事件（Events）参考

所有事件都 `bubbles: true, composed: true`——它们可以跨越 Shadow DOM 边界冒泡到宿主页面的普通监听器上。

| 事件名 | `event.detail` | 触发时机 |
| --- | --- | --- |
| `sequence-ready` | `{ id?, participantCount, eventCount }` | 数据校验通过、首次渲染就绪。 |
| `sequence-rendered` | `{ bounds, durationMs }` | 每次完整渲染完成（含 `requestAnimationFrame` 后）。 |
| `sequence-error` | `{ errors: [{ code, message, path?, details? }] }` | 校验或解析失败。 |
| `sequence-warning` | `{ warnings: [...] }` | 非致命问题（如孤立的 deactivate）。 |
| `sequence-message-click` | `{ message: { id, from, to, label, messageKind? }, nativeEvent? }` | 点击消息箭头。 |
| `sequence-participant-click` | `{ participant: { id, label, kind? } }` | 点击参与方头部。 |
| `sequence-fragment-click` | `{ fragment: { id, fragmentKind, label? } }` | 点击复合片段区域。 |
| `sequence-viewport-change` | `{ x, y, zoom }` | 用户平移或缩放时持续触发。 |

监听示例：

```js
const el = document.getElementById('d');
el.addEventListener('sequence-message-click', e => {
  console.log('点击了消息：', e.detail.message);
});
el.addEventListener('sequence-error', e => {
  console.error('校验失败：', e.detail.errors);
});
```

---

## 8. CSS 自定义属性

组件使用 Shadow DOM，**宿主页面的普通 CSS 不会渗透进来**。但你可以在宿主页面上针对 `<sequence-diagram>` 设置以下变量来微调尺寸与字体：

```css
sequence-diagram {
  /* 尺寸 / 字体 */
  --sd-font-family: system-ui, sans-serif;
  --sd-font-size: 13px;
  --sd-participant-width: 140px;
  --sd-participant-radius: 8px;
  --sd-line-width: 1.5px;
  --sd-message-label-size: 12px;
  --sd-control-size: 28px;

  /* 颜色（覆盖当前 palette） */
  --sd-accent: #2563eb;
  --sd-surface: #ffffff;
  --sd-surface-muted: #f3f4f6;
  --sd-text: #111827;
  --sd-text-muted: #6b7280;
  --sd-border: #e5e7eb;
  --sd-line: #374151;
  --sd-success: #059669;
  --sd-warning: #d97706;
  --sd-error: #dc2626;
  --sd-note: #fef9c3;
  --sd-fragment-fill: rgba(37, 99, 235, 0.05);
  --sd-shadow: rgba(0, 0, 0, 0.1);
}
```

---

## 9. 示例

### 示例 1：两个参与者的 Hello World

最简形式：把 JSON 嵌进 `<script>` 子节点。

```html
<sequence-diagram height="280px">
  <script type="application/json">
  {
    "schemaVersion": "1.0",
    "participants": [
      { "id": "u", "label": "用户" },
      { "id": "s", "label": "服务器" }
    ],
    "events": [
      { "id": "m1", "type": "message", "from": "u", "to": "s", "label": "你好", "messageKind": "sync" },
      { "id": "m2", "type": "message", "from": "s", "to": "u", "label": "你好，收到", "messageKind": "return" }
    ]
  }
  </script>
</sequence-diagram>
```

### 示例 2：消息种类、激活、自调用

```html
<sequence-diagram palette="ocean" height="360px">
  <script type="application/json">
  {
    "schemaVersion": "1.0",
    "participants": [
      { "id": "c",  "label": "客户端",  "kind": "actor" },
      { "id": "a",  "label": "API 网关", "kind": "service" },
      { "id": "db", "label": "数据库",   "kind": "database" }
    ],
    "events": [
      { "id": "m1", "type": "message", "from": "c", "to": "a", "label": "查询", "messageKind": "sync" },
      { "id": "a1", "type": "activate", "participant": "a" },
      { "id": "m2", "type": "message", "from": "a", "to": "a", "label": "本地鉴权", "messageKind": "sync" },
      { "id": "m3", "type": "message", "from": "a", "to": "db", "label": "SELECT *", "messageKind": "sync" },
      { "id": "m4", "type": "message", "from": "db", "to": "a", "label": "rows", "messageKind": "return" },
      { "id": "m5", "type": "message", "from": "a", "to": "c", "label": "200 OK", "messageKind": "return", "status": "success" },
      { "id": "d1", "type": "deactivate", "participant": "a" }
    ]
  }
  </script>
</sequence-diagram>
```

要点：

- `from === to` 的消息渲染为**自调用弧线**（`m2`）。
- `messageKind: "return"` 渲染为虚线返回箭头。
- `status: "success"` 让返回消息变成绿色。

### 示例 3：`alt` 条件片段

支付授权成功 / 失败两条分支：

```html
<sequence-diagram palette="forest" height="500px">
  <script type="application/json">
  {
    "schemaVersion": "1.0",
    "title": "支付流程",
    "participants": [
      { "id": "user", "label": "用户",  "kind": "actor" },
      { "id": "web",  "label": "网站",  "kind": "service" },
      { "id": "pay",  "label": "支付网关", "kind": "external" }
    ],
    "events": [
      { "id": "m1", "type": "message", "from": "user", "to": "web", "label": "提交订单", "messageKind": "sync" },
      {
        "id": "f1", "type": "fragment", "fragmentKind": "alt", "label": "支付结果",
        "branches": [
          {
            "id": "ok", "label": "已授权",
            "events": [
              { "id": "m2", "type": "message", "from": "web", "to": "pay", "label": "扣款", "messageKind": "sync" },
              { "id": "m3", "type": "message", "from": "pay", "to": "web", "label": "成功", "messageKind": "return", "status": "success" }
            ]
          },
          {
            "id": "fail", "label": "被拒绝",
            "events": [
              { "id": "m4", "type": "message", "from": "web", "to": "pay", "label": "扣款", "messageKind": "sync" },
              { "id": "m5", "type": "message", "from": "pay", "to": "web", "label": "余额不足", "messageKind": "return", "status": "error" },
              { "id": "n1", "type": "note", "text": "未写入订单", "over": ["web"], "tone": "warning" }
            ]
          }
        ]
      }
    ]
  }
  </script>
</sequence-diagram>
```

### 示例 4：`loop` 循环片段

```html
<sequence-diagram palette="violet" height="400px">
  <script type="application/json">
  {
    "schemaVersion": "1.0",
    "participants": [
      { "id": "client", "label": "客户端" },
      { "id": "server", "label": "服务器" }
    ],
    "events": [
      { "id": "m1", "type": "message", "from": "client", "to": "server", "label": "提交任务", "messageKind": "sync" },
      {
        "id": "loop1", "type": "fragment", "fragmentKind": "loop",
        "label": "每 2 秒轮询", "participants": ["client", "server"],
        "branches": [
          {
            "id": "iter", "label": "while 未完成",
            "events": [
              { "id": "m2", "type": "message", "from": "client", "to": "server", "label": "GET /status", "messageKind": "sync" },
              { "id": "m3", "type": "message", "from": "server", "to": "client", "label": "202 Pending", "messageKind": "return" },
              { "id": "d1", "type": "divider", "label": "等待 2 秒" }
            ]
          }
        ]
      },
      { "id": "m4", "type": "message", "from": "server", "to": "client", "label": "200 完成", "messageKind": "return", "status": "success" }
    ]
  }
  </script>
</sequence-diagram>
```

### 示例 5：动态加载并切换数据

```html
<sequence-diagram id="d" height="320px"></sequence-diagram>
<script>
  customElements.whenDefined('sequence-diagram').then(() => {
    const el = document.getElementById('d');

    // 直接用对象赋值
    el.data = {
      schemaVersion: "1.0",
      participants: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      events: [
        { id: "m1", type: "message", from: "a", to: "b", label: "同步请求", messageKind: "sync" }
      ]
    };

    // 监听点击消息
    el.addEventListener('sequence-message-click', e => {
      console.log('你点击了：', e.detail.message);
    });

    // 之后可以从字符串恢复
    setTimeout(() => {
      el.data = JSON.stringify({
        schemaVersion: "1.0",
        participants: [{ id: "p", label: "生产者" }, { id: "q", label: "队列" }, { id: "c", label: "消费者" }],
        events: [
          { id: "m1", type: "message", from: "p", to: "q", label: "发布", messageKind: "async" },
          { id: "m2", type: "message", from: "q", to: "c", label: "投递", messageKind: "sync" }
        ]
      });
    }, 4000);
  });
</script>
```

### 示例 6：跟随系统主题 + 调色板

```html
<style>
  .row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  sequence-diagram { width: 100%; height: 240px; display: block; }
</style>

<div class="row">
  <sequence-diagram theme="light"  palette="classic">
    <script type="application/json">
    { "schemaVersion": "1.0", "participants": [{"id":"a","label":"A"},{"id":"b","label":"B"}],
      "events": [{"id":"m1","type":"message","from":"a","to":"b","label":"请求","messageKind":"sync"}] }
    </script>
  </sequence-diagram>
  <sequence-diagram theme="dark"   palette="ocean">
    <script type="application/json">
    { "schemaVersion": "1.0", "participants": [{"id":"a","label":"A"},{"id":"b","label":"B"}],
      "events": [{"id":"m1","type":"message","from":"a","to":"b","label":"请求","messageKind":"sync"}] }
    </script>
  </sequence-diagram>
  <sequence-diagram theme="system" palette="forest">
    <script type="application/json">
    { "schemaVersion": "1.0", "participants": [{"id":"a","label":"A"},{"id":"b","label":"B"}],
      "events": [{"id":"m1","type":"message","from":"a","to":"b","label":"请求","messageKind":"sync"}] }
    </script>
  </sequence-diagram>
</div>
```

`system` 模式会监听 `prefers-color-scheme` 媒体查询并自动重渲染。

### 示例 7：完整事件监听

```html
<sequence-diagram id="d" palette="sunset" height="320px">
  <script type="application/json">
  {
    "schemaVersion": "1.0",
    "participants": [{ "id": "c", "label": "客户端" }, { "id": "s", "label": "服务器" }],
    "events": [
      { "id": "m1", "type": "message", "from": "c", "to": "s", "label": "GET /data", "messageKind": "sync" },
      { "id": "m2", "type": "message", "from": "s", "to": "c", "label": "200 OK",    "messageKind": "return" }
    ]
  }
  </script>
</sequence-diagram>

<pre id="log" style="font-family: monospace; font-size: 12px;"></pre>
<script>
  const el = document.getElementById('d');
  const log = document.getElementById('log');
  const dump = (e) => log.textContent += `[${e.type}] ${JSON.stringify(e.detail)}\n`;

  ['sequence-ready','sequence-rendered','sequence-error','sequence-warning',
   'sequence-message-click','sequence-participant-click','sequence-fragment-click',
   'sequence-viewport-change'].forEach(name => {
    el.addEventListener(name, dump);
  });
</script>
```

### 示例 8：多实例 + 错误处理

```html
<sequence-diagram id="bad" height="200px"></sequence-diagram>
<pre id="err"></pre>
<script>
  customElements.whenDefined('sequence-diagram').then(() => {
    const el = document.getElementById('bad');
    el.addEventListener('sequence-error', e => {
      document.getElementById('err').textContent = JSON.stringify(e.detail, null, 2);
    });
    el.data = { schemaVersion: "1.0", participants: [], events: [] }; // 空 participants
  });
</script>
```

如果数据不合法，组件会在区域内显示一张错误卡片，并派发 `sequence-error` 事件。

---

## 10. 浏览器支持与限制

### 10.1 浏览器要求

| 浏览器 | 最低版本 |
| --- | --- |
| Chrome / Edge | 89+ |
| Firefox | 90+ |
| Safari | 15.4+ |

依赖：Custom Elements v1、Shadow DOM v1、ResizeObserver、ES2022。

### 10.2 软限制（超出后给出警告事件，但不崩溃）

| 限制 | 上限 |
| --- | --- |
| 参与方数量 | 20 |
| 展开后事件行数 | 300 |
| 片段嵌套深度 | 4 |
| JSON 整体大小 | 1 MB |
| 消息文字长度 | 500 字符 |
| 注释文字长度 | 2000 字符 |
| 参与方 label 长度 | 60 字符 |
| 片段 label 长度 | 100 字符 |

### 10.3 常见问题

**Q：图渲染不出来，控制台有 `Failed to load sequence-diagram.iife.js`？**
A：`<script>` 标签路径错误。直接打开 `file://` 会被浏览器拒绝加载本地脚本，必须通过 HTTP 服务器访问（`python3 -m http.server` 或 `npm run dev`）。

**Q：嵌入的 JSON 改了但图没刷新？**
A：嵌入 `<script>` 的方式只在首次 `connectedCallback` 读取一次。后续修改请使用 `el.data = ...`。

**Q：想完全只读？**
A：设置 `interactive="false"` 与 `controls="false"` 即可。

**Q：多条消息堆在一起看不清？**
A：增加 `rowGap`（如 `"rowGap": 60`），或减小 `messageLabelMaxWidth` 让长消息换行。

---

## 附录：内置示例 JSON

仓库 `examples/` 目录下提供可直接 fetch 加载的完整示例：

- `examples/basic.json` — 三参与方 + sync/return
- `examples/checkout-alt.json` — `alt` 条件分支（支付成功/失败）
- `examples/polling-loop.json` — `loop` 循环 + 激活 + 分隔线
- `examples/parallel-services.json` — `par` 并行分支
- `examples/nested-fragments.json` — 4 层嵌套：`loop > alt > par > opt`

通过 `fetch('examples/basic.json').then(r => r.json()).then(d => el.data = d)` 即可动态加载。
