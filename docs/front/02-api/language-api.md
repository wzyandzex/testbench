# 语言配置接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/languages` |
| 需要认证 | 否 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | 说明 |
|--------|------|
| 404001 | 语言不存在 |
| 400 | 请求参数无效 |
| 500 | 服务器内部错误 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/languages` | 获取支持的语言列表 |
| GET | `/languages/:name` | 获取语言配置详情 |
| GET | `/languages/:name/extensions` | 获取支持的文件扩展名 |
| POST | `/languages/:name/reload` | 重新加载语言配置 |
| GET | `/languages/:name/docker-command` | 获取 Docker 执行命令 |
| GET | `/languages/:name/test-command` | 获取测试命令 |

---

## 1. 获取支持的语言列表

### 请求

```http
GET /api/v1/languages
```

### 响应

```typescript
interface LanguagesResponse {
  code: number;
  message: string;
  data: LanguageConfig[];
}

interface LanguageConfig {
  name: string;
  display_name: string;
  description: string;
  extensions: string[];
  docker_image: string;
  test_command: string[];
  syntax_highlight: string;
  version_command: string;
  compile_command?: string;
  run_command?: string;
  dependencies: string[];
  environment: Record<string, string>;
}
```

---

## 2. 获取语言配置详情

### 请求

```http
GET /api/v1/languages/:name
```

### 响应

```typescript
interface LanguageConfigResponse {
  code: number;
  message: string;
  data: LanguageConfig;
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | 语言不存在 |

---

## 3. 获取支持的文件扩展名

### 请求

```http
GET /api/v1/languages/:name/extensions
```

### 响应

```typescript
interface ExtensionsResponse {
  code: number;
  message: string;
  data: string[];
}
```

---

## 4. 重新加载语言配置

### 请求

```http
POST /api/v1/languages/:name/reload
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "language config reloaded successfully"
  }
}
```

---

## 5. 获取 Docker 执行命令

### 请求

```http
GET /api/v1/languages/:name/docker-command?script_path=/app/test.py
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| script_path | string | 脚本路径（必填） |

### 响应

```typescript
interface DockerCommandResponse {
  code: number;
  message: string;
  data: {
    command: string[];
  };
}
```

---

## 6. 获取测试命令

### 请求

```http
GET /api/v1/languages/:name/test-command?project_path=/app
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| project_path | string | 项目路径（必填） |

### 响应

```typescript
interface TestCommandResponse {
  code: number;
  message: string;
  data: {
    command: string[];
  };
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/language.ts

export interface LanguageConfig {
  name: string;
  display_name: string;
  description: string;
  extensions: string[];
  docker_image: string;
  test_command: string[];
  syntax_highlight: string;
  version_command: string;
  compile_command?: string;
  run_command?: string;
  dependencies: string[];
  environment: Record<string, string>;
}

export interface ExtensionsResponse {
  code: number;
  message: string;
  data: string[];
}

export interface DockerCommandResponse {
  code: number;
  message: string;
  data: {
    command: string[];
  };
}

export interface TestCommandResponse {
  code: number;
  message: string;
  data: {
    command: string[];
  };
}

// 错误码
export const LanguageErrorCode = {
  NOT_FOUND: 404001,
} as const;
```
