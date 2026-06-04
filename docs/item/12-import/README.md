# 数据导入模块（前端）

本模块覆盖：

- Benchmark 导入（file/url/json/yaml）
- HumanEval 导入
- SWE-bench 导入
- CodeComplete 导入
- 异步导入任务（创建、查询、取消、上传）

- 详细 API：`./API.md`
- 错误码策略：`../00-overview/ERROR-CODES.md`
- 排错手册：`../00-overview/TROUBLESHOOTING.md`

## 前端对接重点

- 异步导入任务建议作为主流程（创建任务 + 轮询状态）。
- `dataset` 当前仅明确支持 `humaneval|mbpp`（通用任务接口）。
- 大文件建议先上传拿 `file_id`，再创建任务。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/import_task_handler.go`
- `internal/api/handler/benchmark_import_handler.go`
- `internal/api/handler/humaneval_import_handler.go`
- `internal/api/handler/swebench_import_handler.go`
- `internal/api/handler/codecomplete_import_handler.go`

更新时间：2026-03-04

