@echo off
echo 重新初始化数据库...

REM 连接到MySQL并执行初始化脚本
echo 正在执行初始化脚本...
mysql -u emotion_user -pemotion123 emotion_management < init.sql

echo 数据库初始化完成！
pause
