#!/usr/bin/env python3
"""
MCP 配置安装脚本
安全地将 ask-continue 配置合并到现有的 mcp_config.json 中，不会覆盖其他配置
"""

import json
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime


def get_mcp_config_path():
    """获取 Windsurf MCP 配置文件路径"""
    home = Path.home()
    return home / ".codeium" / "windsurf" / "mcp_config.json"


def get_server_path():
    """获取 server.py 的绝对路径（使用正斜杠）"""
    script_dir = Path(__file__).parent.resolve()
    server_path = script_dir / "server.py"
    # 转换为正斜杠格式
    return str(server_path).replace("\\", "/")


def backup_config(config_path: Path):
    """备份现有配置文件"""
    if config_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = config_path.with_suffix(f".backup_{timestamp}.json")
        shutil.copy2(config_path, backup_path)
        print(f"[备份] 已备份原配置到: {backup_path}")
        return backup_path
    return None


def load_existing_config(config_path: Path) -> dict:
    """加载现有配置，如果不存在或无效则返回空配置"""
    if not config_path.exists():
        return {"mcpServers": {}}
    
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if not content:
                return {"mcpServers": {}}
            config = json.loads(content)
            # 确保 mcpServers 字段存在
            if "mcpServers" not in config:
                config["mcpServers"] = {}
            return config
    except json.JSONDecodeError as e:
        print(f"[警告] 现有配置文件 JSON 格式无效: {e}")
        print("[提示] 将创建新配置，原文件已备份")
        return {"mcpServers": {}}
    except Exception as e:
        print(f"[警告] 读取配置文件失败: {e}")
        return {"mcpServers": {}}


def install_mcp_config():
    """安装/更新 MCP 配置"""
    config_path = get_mcp_config_path()
    server_path = get_server_path()
    
    print(f"[信息] MCP 配置路径: {config_path}")
    print(f"[信息] Server 路径: {server_path}")
    
    # 确保目录存在
    config_path.parent.mkdir(parents=True, exist_ok=True)
    
    # 备份现有配置
    backup_config(config_path)
    
    # 加载现有配置
    config = load_existing_config(config_path)
    
    # 检查是否已存在 ask-continue 配置
    if "ask-continue" in config["mcpServers"]:
        print("[信息] 检测到已有 ask-continue 配置，将更新")
    
    # 添加/更新 ask-continue 配置
    config["mcpServers"]["ask-continue"] = {
        "command": "python",
        "args": [server_path]
    }
    
    # 写入配置
    try:
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        print(f"[OK] MCP 配置已更新: {config_path}")
        
        # 显示当前所有配置的 MCP 服务器
        servers = list(config["mcpServers"].keys())
        print(f"[信息] 当前已配置的 MCP 服务器: {', '.join(servers)}")
        return True
    except Exception as e:
        print(f"[错误] 写入配置失败: {e}")
        return False


def uninstall_mcp_config():
    """卸载 ask-continue 配置（保留其他配置）"""
    config_path = get_mcp_config_path()
    
    if not config_path.exists():
        print("[信息] 配置文件不存在，无需卸载")
        return True
    
    # 备份
    backup_config(config_path)
    
    # 加载配置
    config = load_existing_config(config_path)
    
    # 移除 ask-continue
    if "ask-continue" in config["mcpServers"]:
        del config["mcpServers"]["ask-continue"]
        print("[OK] 已移除 ask-continue 配置")
    else:
        print("[信息] ask-continue 配置不存在")
    
    # 写回
    try:
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        servers = list(config["mcpServers"].keys())
        if servers:
            print(f"[信息] 保留的 MCP 服务器: {', '.join(servers)}")
        else:
            print("[信息] 当前无其他 MCP 服务器配置")
        return True
    except Exception as e:
        print(f"[错误] 写入配置失败: {e}")
        return False


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--uninstall":
        success = uninstall_mcp_config()
    else:
        success = install_mcp_config()
    
    sys.exit(0 if success else 1)
