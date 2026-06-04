const fs = require('fs');
let hook = fs.readFileSync('src/hooks/useSWEWebSocket.ts', 'utf8');

hook = hook.replace(/case 'progress':/, "case 'task.progress':");
hook = hook.replace(/if \(data\.progress\) \{/g, "if (data.data) { const progressData = data.data as SWETaskProgressData;");
hook = hook.replace(/updateTaskProgress\(data\.progress\.task_id, \{/, "updateTaskProgress(progressData.task_id, progressData.progress, progressData.phase);");
hook = hook.replace(/status: data\.progress\.status,/g, '');
hook = hook.replace(/phase: data\.progress\.phase,/g, '');
hook = hook.replace(/progress: data\.progress\.progress,/g, '');
hook = hook.replace(/\n\s*\}\);/g, ''); // Close bracket for updateTaskProgress
hook = hook.replace(/onProgress\?\.\(data\.progress\);/, "onProgress?.(progressData);\n              }");

hook = hook.replace(/case 'phase':/, "case 'task.phase':");
hook = hook.replace(/if \(data\.phase\) onPhaseChange\?\.\(data\.phase\);/, "if (data.data) onPhaseChange?.(data.data as SWEPhaseData);");

hook = hook.replace(/case 'log':/, "case 'task.log':");
hook = hook.replace(/if \(data\.log\) onLog\?\.\(data\.log\);/, "if (data.data) onLog?.(data.data as SWELogData);");

hook = hook.replace(/case 'completed':/, "case 'task.completed' as any:");
hook = hook.replace(/case 'failed':/, "case 'task.failed' as any:");
hook = hook.replace(/if \(data\.taskId && data\.error\) onFailed\?\.\(data\.taskId, data\.error\);/, "if (data.taskId && data.data) onFailed?.(data.taskId, (data.data as any).error || 'Unknown error');");

hook = hook.replace(/case 'ping':/, "case 'system.ping' as any:");

fs.writeFileSync('src/hooks/useSWEWebSocket.ts', hook);
console.log('Fixed WS Types');
