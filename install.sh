#!/usr/bin/env bash
set -e

# 使用 UTF-8
export LANG=en_US.UTF-8

echo "============================================"
echo "   Ask Continue - 继续牛马 MCP 工具 chmod +x install.sh && ./install.sh"
echo "   macOS 一键安装脚本"
echo "============================================"
echo

# 保存用户当前工作目录
USER_PROJECT_DIR="$(pwd)"

# --------------------------------------------------
# [1/5] 检查 Python
# --------------------------------------------------
echo "[1/5] 检查 Python 环境..."
if ! command -v python3 >/dev/null 2>&1; then
  echo "[错误] 未找到 Python3，请先安装 Python 3.10+"
  echo "安装方式："
  echo "  brew install python"
  echo "或前往：https://www.python.org/downloads/"
  exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "[OK] Python 已安装: $PYTHON_VERSION"

# --------------------------------------------------
# [2/5] 安装 Python 依赖
# --------------------------------------------------
echo
echo "[2/5] 安装 MCP Server 依赖..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/mcp-server-python"

python3 -m pip install --upgrade pip >/dev/null
python3 -m pip install -r requirements.txt

echo "[OK] Python 依赖已安装"

# --------------------------------------------------
# [3/5] 配置 MCP
# --------------------------------------------------
echo
echo "[3/5] 配置 MCP..."

SERVER_PATH="$SCRIPT_DIR/mcp-server-python/server.py"

# Windsurf MCP 配置路径（macOS）
WINDSURF_MCP_DIR="$HOME/.codeium/windsurf"
WINDSURF_MCP_FILE="$WINDSURF_MCP_DIR/mcp_config.json"

mkdir -p "$WINDSURF_MCP_DIR"

cat > "$WINDSURF_MCP_FILE" <<EOF
{
  "mcpServers": {
    "ask-continue": {
      "command": "python3",
      "args": ["$SERVER_PATH"]
    }
  }
}
EOF

echo "[OK] MCP 配置已写入:"
echo "     $WINDSURF_MCP_FILE"

# --------------------------------------------------
# [4/5] 安装 Windsurf 扩展（提示）
# --------------------------------------------------
echo
echo "[4/5] 安装 Windsurf 扩展..."

VSIX_FILE="$SCRIPT_DIR/windsurf-ask-continue-1.1.0.vsix"

if [ ! -f "$VSIX_FILE" ]; then
  echo "[警告] VSIX 文件不存在:"
  echo "       $VSIX_FILE"
else
  echo "[提示] 请手动安装 VSIX 扩展："
  echo "  1. 打开 Windsurf"
  echo "  2. Cmd + Shift + P"
  echo "  3. 输入: Extensions: Install from VSIX"
  echo "  4. 选择该文件"
  echo
  echo "正在打开文件位置..."
  open -R "$VSIX_FILE"
fi

# --------------------------------------------------
# [5/5] 配置全局规则文件
# --------------------------------------------------
echo
echo "[5/5] 配置全局规则文件..."

RULES_SRC="$SCRIPT_DIR/rules/example-windsurfrules.txt"
RULES_DST="$HOME/.windsurfrules"

if [ ! -f "$RULES_SRC" ]; then
  echo "[警告] 规则模板文件不存在:"
  echo "       $RULES_SRC"
else
  if [ -f "$RULES_DST" ]; then
    cp "$RULES_DST" "$RULES_DST.backup"
    echo "[备份] 旧规则已备份到:"
    echo "       $RULES_DST.backup"
  fi

  cp "$RULES_SRC" "$RULES_DST"
  echo "[OK] 全局规则已更新:"
  echo "     $RULES_DST"
fi

# --------------------------------------------------
# 完成
# --------------------------------------------------
echo
echo "============================================"
echo "   安装完成！"
echo "============================================"
echo
echo "下一步："
echo "  [1] 重启 Windsurf"
echo "  [2] 开始对话，AI 完成任务后会自动弹窗"
echo
echo "全局规则: $HOME/.windsurfrules"
echo "MCP 配置: $HOME/.codeium/windsurf/mcp_config.json"
echo
read -p "按 Enter 键退出..."
