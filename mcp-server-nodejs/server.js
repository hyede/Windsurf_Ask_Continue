// ==================================================
// Ask-Continue MCP Server v2.0.0
// ==================================================
// 作者：传康KK
// 微信：1837620622
// 邮箱：2040168455@qq.com
// 咸鱼/B站：万能程序员
// ==================================================
// 公告：使用 JS 绕过 MCP 限制，实现图片解析、多文件识别等功能
// ==================================================

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'http';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

// --------------------------------------------------
// 支持的图片格式及其 MIME 类型映射
// --------------------------------------------------
const IMAGE_EXTENSIONS = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif'
};

// --------------------------------------------------
// 支持的文档格式及其 MIME 类型映射
// --------------------------------------------------
const DOCUMENT_EXTENSIONS = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.py': 'text/x-python',
  '.java': 'text/x-java',
  '.c': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.h': 'text/x-c',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.log': 'text/plain',
  '.sh': 'text/x-shellscript',
  '.bat': 'text/x-batch',
  '.sql': 'text/x-sql',
  '.r': 'text/x-r',
  '.m': 'text/x-matlab'
};

// --------------------------------------------------
// 辅助函数：读取文件并转换为 base64 编码
// --------------------------------------------------
function readFileAsBase64(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      return { error: `文件不存在: ${filePath}` };
    }
    const buffer = fs.readFileSync(absolutePath);
    const base64 = buffer.toString('base64');
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeType = IMAGE_EXTENSIONS[ext] || DOCUMENT_EXTENSIONS[ext] || 'application/octet-stream';
    // dataUri 用于扩展预览，base64 用于 MCP 返回
    const dataUri = `data:${mimeType};base64,${base64}`;
    return { 
      base64,      // 纯 base64 数据，用于 MCP SDK ImageContent
      dataUri,     // 带前缀的 data URI，用于扩展预览
      mimeType, 
      fileName: path.basename(absolutePath), 
      size: buffer.length 
    };
  } catch (e) {
    return { error: `读取文件失败: ${e.message}` };
  }
}

// --------------------------------------------------
// 辅助函数：判断文件是否为图片
// --------------------------------------------------
function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext in IMAGE_EXTENSIONS;
}

// --------------------------------------------------
// 辅助函数：判断文件是否为文档
// --------------------------------------------------
function isDocumentFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext in DOCUMENT_EXTENSIONS;
}

// --------------------------------------------------
// 辅助函数：获取文件类型描述
// --------------------------------------------------
function getFileTypeDescription(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.pdf': 'PDF 文档',
    '.doc': 'Word 文档',
    '.docx': 'Word 文档',
    '.xls': 'Excel 表格',
    '.xlsx': 'Excel 表格',
    '.ppt': 'PPT 演示文稿',
    '.pptx': 'PPT 演示文稿',
    '.txt': '文本文件',
    '.md': 'Markdown 文档',
    '.json': 'JSON 数据',
    '.xml': 'XML 数据',
    '.csv': 'CSV 表格',
    '.html': 'HTML 网页',
    '.css': 'CSS 样式',
    '.js': 'JavaScript 代码',
    '.ts': 'TypeScript 代码',
    '.py': 'Python 代码',
    '.java': 'Java 代码',
    '.c': 'C 代码',
    '.cpp': 'C++ 代码',
    '.h': 'C/C++ 头文件',
    '.yaml': 'YAML 配置',
    '.yml': 'YAML 配置',
    '.log': '日志文件',
    '.sh': 'Shell 脚本',
    '.bat': 'Batch 脚本',
    '.sql': 'SQL 脚本',
    '.r': 'R 代码',
    '.m': 'Matlab 代码'
  };
  return typeMap[ext] || '未知文件';
}

// --------------------------------------------------
// 辅助函数：格式化文件大小显示
// --------------------------------------------------
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// --------------------------------------------------
// 辅助函数：获取文件信息（文本文件读取内容，图片读取 base64）
// --------------------------------------------------
function getFileInfo(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      return { error: `文件不存在: ${filePath}`, filePath };
    }
    const stats = fs.statSync(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const fileName = path.basename(absolutePath);
    
    if (isImageFile(absolutePath)) {
      // 图片文件：返回 base64 数据和 dataUri
      const buffer = fs.readFileSync(absolutePath);
      const base64 = buffer.toString('base64');
      const mimeType = IMAGE_EXTENSIONS[ext];
      return {
        filePath: absolutePath,
        fileName,
        type: 'image',
        mimeType,
        size: stats.size,
        base64,
        dataUri: `data:${mimeType};base64,${base64}`
      };
    } else if (isDocumentFile(absolutePath)) {
      // 文档文件：返回 base64 数据（PDF、Word 等二进制文件）
      const buffer = fs.readFileSync(absolutePath);
      const base64 = buffer.toString('base64');
      const mimeType = DOCUMENT_EXTENSIONS[ext];
      const isBinary = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext);
      
      if (isBinary) {
        return {
          filePath: absolutePath,
          fileName,
          type: 'document',
          mimeType,
          size: stats.size,
          base64,
          dataUri: `data:${mimeType};base64,${base64}`,
          typeDescription: getFileTypeDescription(absolutePath)
        };
      } else {
        // 文本类文档：读取内容
        const maxSize = 1024 * 100;
        let content = '';
        try {
          content = fs.readFileSync(absolutePath, 'utf-8');
          if (content.length > maxSize) {
            content = `[文件过大，仅显示前 ${maxSize} 字节]\n` + content.slice(0, maxSize);
          }
        } catch {
          content = '[无法读取文件内容]';
        }
        return {
          filePath: absolutePath,
          fileName,
          type: 'text',
          mimeType,
          size: stats.size,
          content,
          typeDescription: getFileTypeDescription(absolutePath)
        };
      }
    } else {
      // 其他文件：尝试作为文本读取
      const maxSize = 1024 * 100;
      let content = '';
      try {
        content = fs.readFileSync(absolutePath, 'utf-8');
        if (content.length > maxSize) {
          content = `[文件过大，仅显示前 ${maxSize} 字节]\n` + content.slice(0, maxSize);
        }
      } catch {
        content = '[无法读取文件内容，可能是二进制文件]';
      }
      return {
        filePath: absolutePath,
        fileName,
        type: 'text',
        size: stats.size,
        content
      };
    }
  } catch (e) {
    return { error: `处理文件失败: ${e.message}`, filePath };
  }
}

const EXTENSION_PORT = 23983;
let callbackPort = 0;

// 存储待处理的请求
const pendingRequests = new Map();

// 启动回调服务器（动态端口）
function startCallbackServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/response') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const pending = pendingRequests.get(data.requestId);
            if (pending) {
              pending.resolve(data);
              pendingRequests.delete(data.requestId);
            }
            res.writeHead(200);
            res.end('OK');
          } catch (e) {
            res.writeHead(400);
            res.end('Error');
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      callbackPort = server.address().port;
      resolve();
    });
  });
}

await startCallbackServer();

// --------------------------------------------------
// 发送请求到扩展（通用函数，支持多种请求类型）
// --------------------------------------------------
function sendToExtension(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      ...data,
      callbackPort: callbackPort
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: EXTENSION_PORT,
      path: '/ask',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`扩展返回错误状态码: ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 等待用户响应
function waitForResponse(requestId, timeout) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve({ cancelled: true, userInput: '', error: 'timeout' });
    }, timeout);

    pendingRequests.set(requestId, {
      resolve: (data) => {
        clearTimeout(timer);
        resolve(data);
      }
    });
  });
}

const server = new Server(
  { name: 'ask-continue', version: '2.0.0' },
  { capabilities: { tools: {} } }
);

// --------------------------------------------------
// 注册工具列表：包含 ask_continue、analyze_image、analyze_files
// --------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // 工具 1: 继续对话工具
    {
      name: 'ask_continue',
      description: '在每次回复结束前调用此工具，等待用户输入继续对话。',
      inputSchema: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: '简要说明已完成的工作' }
        },
        required: ['reason']
      }
    },
    // 工具 2: 图片解析工具
    {
      name: 'analyze_image',
      description: '解析图片文件，支持本地文件路径或 base64 编码数据。可用于图片内容识别、OCR 文字提取、图表分析等场景。',
      inputSchema: {
        type: 'object',
        properties: {
          imagePath: { 
            type: 'string', 
            description: '图片文件的本地路径（支持 jpg/jpeg/png/gif/webp/bmp/svg 格式）' 
          },
          imageBase64: { 
            type: 'string', 
            description: '图片的 base64 编码数据（如果提供了 imagePath 则可不填）' 
          },
          mimeType: { 
            type: 'string', 
            description: '图片的 MIME 类型，如 image/png（仅在使用 imageBase64 时需要）' 
          },
          question: { 
            type: 'string', 
            description: '关于图片的具体问题或分析要求（可选）' 
          }
        }
      }
    },
    // 工具 3: 多文件识别工具
    {
      name: 'analyze_files',
      description: '批量分析多个文件，支持图片和文本文件混合处理。可用于代码审查、文档分析、多图对比等场景。',
      inputSchema: {
        type: 'object',
        properties: {
          filePaths: { 
            type: 'array', 
            items: { type: 'string' },
            description: '文件路径数组，支持图片和文本文件' 
          },
          question: { 
            type: 'string', 
            description: '关于这些文件的具体问题或分析要求（可选）' 
          }
        },
        required: ['filePaths']
      }
    }
  ]
}));

// --------------------------------------------------
// 工具调用处理器：根据工具名称分发到对应的处理逻辑
// --------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments || {};
  const requestId = randomUUID();

  // --------------------------------------------------
  // 工具 1: ask_continue - 继续对话
  // --------------------------------------------------
  if (toolName === 'ask_continue') {
    const reason = args.reason || '任务已完成';
    
    try {
      await sendToExtension({
        type: 'ask_continue',
        requestId,
        reason
      });
    } catch (e) {
      return { content: [{ type: 'text', text: `扩展连接失败: ${e.message}` }], isError: true };
    }
    
    const res = await waitForResponse(requestId, 300000);
    
    if (res.error) {
      return { content: [{ type: 'text', text: `等待失败: ${res.error}` }], isError: true };
    }
    
    if (res.cancelled) {
      return { content: [{ type: 'text', text: '用户取消了对话' }] };
    }
    
    return { 
      content: [{ 
        type: 'text', 
        text: res.userInput ? `用户回复: ${res.userInput}` : '用户选择继续' 
      }] 
    };
  }

  // --------------------------------------------------
  // 工具 2: analyze_image - 图片解析
  // --------------------------------------------------
  if (toolName === 'analyze_image') {
    let imageData = null;
    
    // 优先使用文件路径读取图片
    if (args.imagePath) {
      const result = readFileAsBase64(args.imagePath);
      if (result.error) {
        return { content: [{ type: 'text', text: result.error }], isError: true };
      }
      imageData = {
        base64: result.base64,
        dataUri: result.dataUri,
        mimeType: result.mimeType,
        fileName: result.fileName,
        size: result.size
      };
    } 
    // 使用 base64 数据
    else if (args.imageBase64) {
      const mimeType = args.mimeType || 'image/png';
      imageData = {
        base64: args.imageBase64,
        dataUri: `data:${mimeType};base64,${args.imageBase64}`,
        mimeType: mimeType,
        fileName: 'uploaded_image',
        size: Buffer.from(args.imageBase64, 'base64').length
      };
    } 
    // 没有提供图片数据
    else {
      return { 
        content: [{ type: 'text', text: '请提供图片路径 (imagePath) 或 base64 数据 (imageBase64)' }], 
        isError: true 
      };
    }

    try {
      // 注意：统一使用 ask_continue 类型，通过 subType 区分功能
      await sendToExtension({
        type: 'ask_continue',
        subType: 'analyze_image',
        requestId,
        reason: `图片分析请求: ${imageData.fileName} (${formatFileSize(imageData.size)})`,
        image: imageData,
        question: args.question || '请分析这张图片的内容'
      });
    } catch (e) {
      return { content: [{ type: 'text', text: `扩展连接失败: ${e.message}` }], isError: true };
    }

    const res = await waitForResponse(requestId, 300000);

    if (res.error) {
      return { content: [{ type: 'text', text: `等待失败: ${res.error}` }], isError: true };
    }

    if (res.cancelled) {
      return { content: [{ type: 'text', text: '用户取消了图片分析' }] };
    }

    // 返回图片内容和分析结果
    const contentItems = [
      { 
        type: 'image', 
        data: imageData.base64, 
        mimeType: imageData.mimeType 
      },
      { 
        type: 'text', 
        text: res.userInput || res.analysis || '图片已接收，等待分析结果' 
      }
    ];

    return { content: contentItems };
  }

  // --------------------------------------------------
  // 工具 3: analyze_files - 多文件识别
  // --------------------------------------------------
  if (toolName === 'analyze_files') {
    const filePaths = args.filePaths || [];
    
    if (filePaths.length === 0) {
      return { 
        content: [{ type: 'text', text: '请提供至少一个文件路径' }], 
        isError: true 
      };
    }

    // 读取所有文件信息
    const filesData = filePaths.map(fp => getFileInfo(fp));
    
    // 检查是否有错误
    const errors = filesData.filter(f => f.error);
    if (errors.length > 0) {
      const errorMsg = errors.map(e => `${e.filePath}: ${e.error}`).join('\n');
      return { 
        content: [{ type: 'text', text: `部分文件读取失败:\n${errorMsg}` }], 
        isError: true 
      };
    }

    // 统计文件类型
    const imageFiles = filesData.filter(f => f.type === 'image');
    const textFiles = filesData.filter(f => f.type === 'text');

    try {
      // 注意：统一使用 ask_continue 类型，通过 subType 区分功能
      await sendToExtension({
        type: 'ask_continue',
        subType: 'analyze_files',
        requestId,
        reason: `文件分析请求: 共 ${filesData.length} 个文件 (图片: ${imageFiles.length}, 文本: ${textFiles.length})`,
        files: filesData,
        summary: {
          total: filesData.length,
          images: imageFiles.length,
          texts: textFiles.length
        },
        question: args.question || '请分析这些文件的内容'
      });
    } catch (e) {
      return { content: [{ type: 'text', text: `扩展连接失败: ${e.message}` }], isError: true };
    }

    const res = await waitForResponse(requestId, 300000);

    if (res.error) {
      return { content: [{ type: 'text', text: `等待失败: ${res.error}` }], isError: true };
    }

    if (res.cancelled) {
      return { content: [{ type: 'text', text: '用户取消了文件分析' }] };
    }

    // 构建返回内容：图片使用 image 类型，文本使用 text 类型
    const contentItems = [];
    
    // 添加文件摘要信息
    contentItems.push({
      type: 'text',
      text: `文件分析摘要:\n- 总文件数: ${filesData.length}\n- 图片文件: ${imageFiles.length}\n- 文本文件: ${textFiles.length}`
    });

    // 添加图片内容
    for (const img of imageFiles) {
      contentItems.push({
        type: 'image',
        data: img.base64,
        mimeType: img.mimeType
      });
      contentItems.push({
        type: 'text',
        text: `[图片] ${img.fileName} (${formatFileSize(img.size)})`
      });
    }

    // 添加文本文件内容摘要
    for (const txt of textFiles) {
      const preview = txt.content.length > 500 
        ? txt.content.slice(0, 500) + '...[内容已截断]' 
        : txt.content;
      contentItems.push({
        type: 'text',
        text: `[文本] ${txt.fileName} (${formatFileSize(txt.size)}):\n${preview}`
      });
    }

    // 添加用户分析结果
    if (res.userInput || res.analysis) {
      contentItems.push({
        type: 'text',
        text: `\n分析结果: ${res.userInput || res.analysis}`
      });
    }

    return { content: contentItems };
  }

  // --------------------------------------------------
  // 未知工具
  // --------------------------------------------------
  return { content: [{ type: 'text', text: `未知工具: ${toolName}` }], isError: true };
});

const transport = new StdioServerTransport();
server.connect(transport);