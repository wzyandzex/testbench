const fs = require('fs');

let service = fs.readFileSync('src/pages/import/service.ts', 'utf8');

if (!service.includes('pollImportTask')) {
  const template = `

/**
 * 轮询导入任务状态 (Frontend Integration Standard)
 */
export async function pollImportTask(taskId: string, onUpdate: (task: ImportTask) => void): Promise<ImportTask> {
  const maxAttempts = 300;
  for (let i = 0; i < maxAttempts; i++) {
    const task = await getImportTask(taskId);
    onUpdate(task);

    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return task;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('polling timeout');
}`;
  
  service = service + template;
  fs.writeFileSync('src/pages/import/service.ts', service);
  console.log('Added pollImportTask to import service');
}
