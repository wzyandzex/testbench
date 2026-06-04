# Project Evaluation 模块（前端）

本模块用于“项目上传后自动识别并执行自适配评测流程”。

- 详细接口：`./API.md`
- 路由总览：`../00-overview/API-ROUTES.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 对接重点

1. 所有接口必须带 `Authorization` + `X-Org-ID`。
2. 任务创建支持 `full|delta` 两种 scope；`delta` 必须传 `changed_files`。
3. 策略更新接口仅组织管理员可用（`/project-evals/policies/organization`）。
4. 洞察接口用于仪表盘，不替代任务详情接口。

## 可信来源

- `internal/api/router/router.go`
- `internal/api/handler/project_eval_handler.go`
- `internal/application/projecteval/service.go`

更新时间：2026-03-09

