# 成本 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`（统计与试算）；`admin-app`（模型定价写操作）

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/cost/summary` | `user-app` | 成本汇总 |
| GET | `/cost/statistics` | `user-app` | 成本统计 |
| GET | `/cost/execution/:id` | `user-app` | 单次执行成本详情 |
| GET | `/cost/models` | `shared` | 模型定价列表 |
| POST | `/cost/models` | `admin-app` | 创建模型定价（系统管理员） |
| PUT | `/cost/models/:id` | `admin-app` | 更新模型定价（系统管理员） |
| DELETE | `/cost/models/:id` | `admin-app` | 删除模型定价（系统管理员） |
| POST | `/cost/calculate` | `user-app` | 成本试算 |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

权限补充（2026-03-04）：

- 模型定价写操作（`POST/PUT/DELETE /cost/models*`）仅系统管理员可用。
- 非系统管理员调用会返回 `403001`。

返回码风格说明：

- 成本模块历史上使用 `40001/40401/50001` 这类 5 位业务码（非 `400001` 风格）。

---

## 2. 汇总与统计

## 2.1 成本汇总 `GET /cost/summary`

Query：

- `start_date`（`YYYY-MM-DD`）
- `end_date`（`YYYY-MM-DD`）
- `currency`（默认 `USD`）

若不传日期：默认“本月起始到当前时间”。

返回示例：

```json
{
  "code": 0,
  "data": {
    "total_cost": 123.45,
    "total_tokens": 456789,
    "execution_count": 120,
    "currency": "USD",
    "avg_cost_per_exec": 1.02
  }
}
```

## 2.2 成本统计 `GET /cost/statistics`

常用 query：

- 时间：`start_date`、`end_date`（`YYYY-MM-DD`）
- 周期：`period`（默认 `day`）
- 货币：`currency`（默认 `USD`）
- 多选筛选：`agent_ids`、`benchmark_ids`、`providers`、`model_names`
- 区间筛选：`min_cost`、`max_cost`

若不传时间：默认最近 30 天。

---

## 3. 执行成本详情 `GET /cost/execution/:id`

- `:id` 必填
- 找不到时返回 404

---

## 4. 模型定价管理

## 4.1 列表 `GET /cost/models`

Query：

- `active_only`（默认 `true`）

返回：

```json
{
  "code": 0,
  "data": {
    "models": [],
    "total": 0
  }
}
```

## 4.2 创建 `POST /cost/models`

```json
{
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "input_price": 0.15,
  "output_price": 0.6,
  "currency": "USD",
  "effective_date": "2026-02-28T00:00:00Z",
  "expiry_date": null
}
```

约束：

- `provider`、`model_name` 必填
- `input_price`、`output_price` 必须 >= 0
- `effective_date` 为空时后端默认当前时间

## 4.3 更新 `PUT /cost/models/:id`

```json
{
  "input_price": 0.2,
  "output_price": 0.8,
  "currency": "USD",
  "is_active": true
}
```

字段均可选，但价格若传必须 >= 0。

---

## 5. 成本试算 `POST /cost/calculate`

```json
{
  "execution_id": "exec-1",
  "provider": "openai",
  "model_name": "gpt-4o-mini",
  "input_tokens": 1000,
  "output_tokens": 500,
  "currency": "USD"
}
```

说明：

- `provider/model_name/input_tokens/output_tokens` 必填
- `execution_id` 可选（用于关联）

---

## 6. 常见错误

- `40001`：参数错误（日期格式、价格、token 数值等）
- `40401`：执行成本不存在
- `50001`：服务内部错误
- `403001`：非系统管理员访问模型定价写接口

---

## 7. 前端建议

1. 时间筛选组件直接输出 `YYYY-MM-DD`，避免格式报错。
2. 统计页提供按模型/Agent/Benchmark 的维度切换。
3. 模型定价页加“生效时间线”说明，避免误改历史成本。


## 前端最小对接流程

1. 成本总览先接 `GET /cost/summary` 与 `GET /cost/statistics`。
2. 详情页补 `GET /cost/execution/:id`，关联执行记录展示单次成本。
3. 管理页接模型价格 CRUD（`/cost/models` 系列接口）。
4. 试算场景接 `POST /cost/calculate`，用于执行前预算评估。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `summary.data.total_cost` | `costOverview.totalCost` | 总成本指标卡 |
| `summary.data.total_tokens` | `costOverview.totalTokens` | Token 消耗指标卡 |
| `summary.data.execution_count` | `costOverview.executionCount` | 执行次数指标卡 |
| `statistics.data` | `costTrendChart.dataset` | 趋势图与分组统计 |
| `models.data.models[]` | `modelPriceTable.rows` | 模型定价管理表格 |
| `calculate.data` | `costEstimator.result` | 试算结果区域 |


## 页面接口调用时序（建议）

1. 成本总览首屏：`GET /cost/summary` + `GET /cost/statistics`。
2. 明细跳转：`GET /cost/execution/:id`。
3. 定价管理：`GET/POST/PUT/DELETE /cost/models*`。
4. 试算页提交：`POST /cost/calculate`，结果回填预算面板。
5. 非管理员隐藏模型定价新增/编辑/删除入口，仅保留只读列表。


## 前端联调检查清单

1. 请求头：成本接口统一带 `Authorization` + `X-Org-ID`。
2. 必填参数：试算接口需 `provider/model_name/input_tokens/output_tokens`。
3. 成功判定：汇总与统计返回后先判空再渲染图表，避免空数组报错。
4. 失败分支：日期格式错误应前端校验；`40401` 给出“成本记录不存在”。
5. 回流刷新：模型定价增删改后刷新定价列表及相关下拉选项。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 成本汇总 `GET /cost/summary`（query + 响应）

Query：

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `start_date` | string | 否 | 当月起始 | `YYYY-MM-DD` | 起始日期 |
| `end_date` | string | 否 | 当前日期 | `YYYY-MM-DD` | 截止日期 |
| `currency` | string | 否 | `USD` | 如 `USD/CNY` | 货币单位 |

响应核心字段：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `total_cost` | number | 是 | 总成本 |
| `total_tokens` | number | 是 | Token 总量 |
| `execution_count` | number | 是 | 执行次数 |
| `currency` | string | 是 | 币种 |
| `avg_cost_per_exec` | number | 否 | 平均单次成本 |

### B. 成本统计 `GET /cost/statistics`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `start_date` | string | 否 | 最近 30 天 | `YYYY-MM-DD` | 开始日期 |
| `end_date` | string | 否 | 当前日期 | `YYYY-MM-DD` | 结束日期 |
| `period` | string | 否 | `day` | `hour/day/week/month`（按后端支持） | 聚合周期 |
| `currency` | string | 否 | `USD` | - | 币种 |
| `agent_ids` | string[] | 否 | 空 | 可重复参数 | Agent 过滤 |
| `benchmark_ids` | string[] | 否 | 空 | 可重复参数 | Benchmark 过滤 |
| `providers` | string[] | 否 | 空 | 可重复参数 | 供应商过滤 |
| `model_names` | string[] | 否 | 空 | 可重复参数 | 模型过滤 |
| `min_cost` | number | 否 | 空 | >=0 | 最小成本过滤 |
| `max_cost` | number | 否 | 空 | >=0 | 最大成本过滤 |

### C. 模型定价写接口（admin-app）

创建 `POST /cost/models`：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 |
|---|---|---|---|---|---|
| `provider` | string | 是 | 否 | - | 非空 |
| `model_name` | string | 是 | 否 | - | 非空 |
| `input_price` | number | 是 | 否 | - | >=0 |
| `output_price` | number | 是 | 否 | - | >=0 |
| `currency` | string | 否 | 是 | `USD` | - |
| `effective_date` | string | 否 | 是 | 当前时间 | RFC3339 |
| `expiry_date` | string/null | 否 | 是 | null | RFC3339 或 null |

更新 `PUT /cost/models/:id`：
字段均可选，若传价格字段则必须 >=0。

### D. 成本试算 `POST /cost/calculate`

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|---|
| `execution_id` | string | 否 | 是 | 空 | - | 关联执行 |
| `provider` | string | 是 | 否 | - | 非空 | 模型供应商 |
| `model_name` | string | 是 | 否 | - | 非空 | 模型名称 |
| `input_tokens` | int | 是 | 否 | - | >=0 | 输入 token |
| `output_tokens` | int | 是 | 否 | - | >=0 | 输出 token |
| `currency` | string | 否 | 是 | `USD` | - | 币种 |

## 状态机与终态语义（深度版）

### A. 成本查询页状态机

`idle -> loading -> success|empty|error`

前端建议：
1. `success` 与 `empty` 分离，空数据不显示错误态。
2. 切换筛选条件时保留上次结果占位，避免图表闪烁。

### B. 模型定价管理状态机（admin-app）

`view -> creating|updating|deleting -> success|error`

规则：
1. 非管理员不应进入写操作状态，直接只读展示。
2. 写操作成功后必须回源刷新列表，避免本地状态漂移。

## 页面级验收清单（新增）

1. 日期筛选统一输出 `YYYY-MM-DD`，错误格式在前端拦截。  
2. 统计图在空数据场景显示 empty，不报错。  
3. 试算接口对 token 非法值（负数/非数字）做前置校验。  
4. 非 admin 登录时模型定价写按钮不可见，且 403 时仍能兜底提示。  
5. 模型定价增删改后，列表和下拉筛选项同步刷新。  
6. 成本详情 `40401` 场景展示“记录不存在或无权限”。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/cost_handler.go`
- `internal/application/cost/service.go`
- `internal/domain/cost/models.go`

更新时间：2026-03-05

