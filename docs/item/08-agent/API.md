# Agent API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/agents` | `user-app` | Agent 列表 |
| POST | `/agents` | `user-app` | 创建 Agent |
| GET | `/agents/:id` | `user-app` | Agent 详情 |
| PUT | `/agents/:id` | `user-app` | 更新 Agent |
| DELETE | `/agents/:id` | `user-app` | 删除 Agent |
| GET | `/agents/:id/stats` | `user-app` | Agent 统计 |
| POST | `/agents/:id/execute` | `user-app` | 普通执行 |
| POST | `/agents/:id/execute/stream` | `user-app` | 流式执行（SSE） |
| GET | `/agents/:id/health` | `user-app` | 健康检查 |
| POST | `/agents/:id/sync` | `user-app` | 同步到注册表 |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

作用域说明（重要）：

- Agent 的读写与执行均按 `organization_id` 隔离。
- 跨组织访问会返回 `404001`（防资源枚举）。

---

## 2. 创建与更新

## 2.1 创建 `POST /agents`

```json
{
  "name": "agent-python",
  "display_name": "Python Agent",
  "description": "for python tasks",
  "type": "code_edit",
  "endpoint": "http://agent-service:8080",
  "api_key": "optional",
  "model_config": {
    "provider": "openai",
    "model_name": "gpt-4o-mini"
  },
  "capabilities": ["code_edit", "test"],
  "tools": {"terminal": true},
  "status": "active",
  "version": "v1",
  "metadata": {"team": "backend"}
}
```

关键约束：

- `name`、`type`、`endpoint` 必填
- `status` 为空默认 `active`
- 名称冲突返回 `400001`

## 2.2 更新 `PUT /agents/:id`

与创建字段基本一致，但都可选，按非空覆盖。

---

## 3. 执行接口

## 3.1 普通执行 `POST /agents/:id/execute`

```json
{
  "prompt": "Fix the failing test",
  "max_steps": 100,
  "timeout": 600000,
  "context": {
    "benchmark_id": "bm-1",
    "task_id": "task-1"
  },
  "tools": ["terminal", "apply_patch"]
}
```

说明：

- `prompt` 必填
- `max_steps` 默认 100
- `timeout` 默认 600000 ms（10 分钟）

## 3.2 流式执行 `POST /agents/:id/execute/stream`

- 返回 `Content-Type: text/event-stream`
- 事件形态：
  - `event: event`（执行过程）
  - `event: error`（错误）
  - `event: done`（完成）

前端建议：使用 `EventSource` 或 fetch stream 解析，并实现重连。

---

## 4. 健康检查与同步

- `GET /agents/:id/health`：检查 agent 是否可用
- `POST /agents/:id/sync`：手动将 agent 同步到核心注册表

若 registry 未配置，通常会返回 `500001`。

---

## 5. 常见错误码

- `400001`：Agent 名称重复
- `400002`：Agent 非 active 状态
- `400003`：不支持流式执行
- `404001`：Agent 不存在
- `500001`：Registry 未配置
- `500`：执行/同步内部错误

---

## 6. 前端建议

1. Agent 编辑表单拆成“基础信息 / 模型配置 / 能力与工具”三个区块。
2. 执行页将普通执行与流式执行做可切换模式。
3. 详情页优先展示 `stats` 和 `health`，方便用户判断可用性。


## 前端最小对接流程

1. 先接 `GET /agents` 列表与 `POST /agents` 创建。
2. 详情页接 `GET /agents/:id`，编辑/删除分别接 `PUT/DELETE /agents/:id`。
3. 执行入口接 `POST /agents/:id/execute`，再补流式执行 `POST /execute/stream`。
4. 运维能力补 `GET /agents/:id/health` 与 `POST /agents/:id/sync`。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `data.data[].id` | `agentTable.rowKey` | Agent 详情与操作主键 |
| `data.data[].name/display_name` | `agentTable.columns.name` | 列表主标题 |
| `data.data[].status` | `agentStatusTag` | 运行状态展示 |
| `detail.data.model_config` | `agentForm.modelConfig` | 模型配置表单回显 |
| `execute/stream 响应` | `executionConsole` | 普通/流式执行输出面板 |
| `health.data` | `healthCard` | 健康检查状态卡片 |


## 页面接口调用时序（建议）

1. 列表页加载：`GET /agents`。
2. 创建或编辑：`POST /agents`、`PUT /agents/:id`。
3. 执行链路：`POST /agents/:id/execute`（或 `/execute/stream`）。
4. 运维检查：`GET /agents/:id/health`，必要时 `POST /agents/:id/sync`。


## 前端联调检查清单

1. 请求头：Agent 相关接口统一带 `Authorization` + `X-Org-ID`。
2. 必填参数：创建至少传 `name/type/endpoint`，执行至少传 `prompt`。
3. 成功判定：流式执行需收到 `done` 事件才算完成，不可只看首帧。
4. 失败分支：`400001`（重名）做表单级提示；执行失败记录 message 到控制台面板。
5. 回流刷新：创建/更新/删除后刷新列表；执行后刷新详情统计信息。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 创建 Agent `POST /agents`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `name` | string | 是 | 否 | - | 组织内唯一 | Agent 名称 |
| `display_name` | string | 否 | 是 | `name` | <=255 | 展示名 |
| `description` | string | 否 | 是 | 空 | <=2000（建议） | 描述 |
| `type` | string | 是 | 否 | - | 业务类型枚举 | Agent 类型 |
| `endpoint` | string | 是 | 否 | - | URL | Agent 服务地址 |
| `api_key` | string | 否 | 是 | 空 | 密文存储（后端） | 访问密钥 |
| `model_config.provider` | string | 否 | 是 | 空 | 如 `openai/claude/...` | 模型提供方 |
| `model_config.model_name` | string | 否 | 是 | 空 | - | 模型名 |
| `capabilities` | string[] | 否 | 是 | 空数组 | - | 能力列表 |
| `tools` | object | 否 | 是 | `{}` | - | 工具开关配置 |
| `status` | string | 否 | 是 | `active` | `active/inactive`（常见） | 运行状态 |
| `version` | string | 否 | 是 | 空 | - | 版本 |
| `metadata` | object | 否 | 是 | `{}` | - | 扩展元数据 |

### B. 更新 Agent `PUT /agents/:id`（请求体）

说明：字段与创建一致，均为可选，按“传入覆盖”更新。

| 规则 | 说明 |
|---|---|
| 空更新 | 建议前端阻止提交，避免无效请求 |
| 重名校验 | 更新后若名称冲突返回 `400001` |

### C. 执行 `POST /agents/:id/execute`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|---|
| `prompt` | string | 是 | 否 | - | 非空 | 用户输入指令 |
| `max_steps` | int | 否 | 是 | 100 | >0 | 最大步数 |
| `timeout` | int | 否 | 是 | 600000 | ms | 超时时间 |
| `context` | object | 否 | 是 | `{}` | - | 上下文 |
| `tools` | string[] | 否 | 是 | 空数组 | 后端支持工具集 | 执行工具白名单 |

### D. 流式执行 `POST /agents/:id/execute/stream`（响应）

SSE 事件类型：

| event | 含义 | 前端动作 |
|---|---|---|
| `event` | 过程事件 | 追加控制台输出 |
| `error` | 过程错误 | 标记失败并展示错误 |
| `done` | 执行完成 | 收尾并更新 UI 状态 |

## 状态机与终态语义（深度版）

### A. Agent 状态机（管理维度）

`active <-> inactive`

规则：
1. `inactive` 时通常不允许执行（可能返回 `400002`）。
2. 删除后应在前端列表立即移除，并清空详情页缓存。

### B. 执行会话状态机（页面维度）

普通执行：`idle -> submitting -> running -> completed|failed|timeout`  
流式执行：`idle -> connecting -> streaming -> done|error|closed`

前端行为：
1. `streaming` 期间禁用重复提交。
2. 未收到 `done` 前不判定成功。
3. 连接异常进入 `error/closed` 时保留日志上下文。

## 页面级验收清单（新增）

1. 创建与更新表单对 `name/type/endpoint`、`prompt` 做前置校验。  
2. 流式执行必须以 `done` 事件作为完成条件。  
3. `400001`（名称冲突）和 `400002`（非 active）有明确业务文案。  
4. 详情页健康检查失败时，不阻断基础信息展示。  
5. 同步注册表 `POST /sync` 后，UI 能回流刷新最新状态。  
6. 跨组织访问 Agent 统一提示“资源不存在或无访问权限”。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/agent_handler.go`
- `internal/application/agent/service.go`
- `internal/domain/agent/agent.go`

更新时间：2026-03-05

