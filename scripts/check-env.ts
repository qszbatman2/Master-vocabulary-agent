/**
 * 检查所有环境变量
 */

const { execSync } = require('child_process');

const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

try {
  const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
    encoding: 'utf-8',
    timeout: 10000,
  });

  console.log('所有环境变量:');
  console.log(output);
} catch (err) {
  console.error('获取环境变量失败:', err);
}
