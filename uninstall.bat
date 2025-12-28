@echo off
chcp 65001 >nul
title Ask Continue - 卸载

echo ============================================
echo    Ask Continue - 卸载脚本
echo ============================================
echo.

:: 卸载 VS Code 扩展
echo [1/2] 卸载 VS Code 扩展...
code --uninstall-extension niumaMCP.ask-continue >nul 2>&1
echo [OK] 已尝试卸载扩展

:: 移除 MCP 配置（仅移除 ask-continue，保留其他配置）
echo.
echo [2/2] 清理 MCP 配置...
python "%~dp0mcp-server-python\install_mcp_config.py" --uninstall
if errorlevel 1 (
    echo [警告] MCP 配置清理可能未完成
)

echo.
echo ============================================
echo    卸载完成！
echo ============================================
echo.
pause
