# 数据导出模块（前端）

本模块负责：

- 执行结果导出（HTML / PDF / Excel）
- 批量导出
- 导出格式查询

- 详细 API：`./API.md`
- 错误码策略：`../00-overview/ERROR-CODES.md`
- 排错手册：`../00-overview/TROUBLESHOOTING.md`

## 前端对接重点

- 推荐统一使用 `/export/executions/:id` 拿 `file_url` 下载。
- 批量导出可能“部分成功但 HTTP 200”，要看 `data.status`。
- `/export/executions/direct` 当前有实现缺陷，建议暂不使用。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/export_handler.go`
- `internal/application/report/exporter/*`
- `internal/domain/report/export/*`

更新时间：2026-03-04

