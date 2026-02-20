FROM --platform=$BUILDPLATFORM nginx:alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 最终镜像
FROM nginx:alpine

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制静态文件到nginx目录
COPY --from=builder /app /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
