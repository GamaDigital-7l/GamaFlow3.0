# --- Stage 1: Build the React App ---
FROM node:20-alpine as builder

WORKDIR /app

# Copia package.json e package-lock.json para instalar dependências
COPY package*.json ./
RUN npm install

# Copia o restante do código
COPY . .

# Executa o build de produção
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:stable-alpine as production

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração customizada do Nginx (com o fallback para index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos gerados pelo build para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão do Nginx)
EXPOSE 80

# Comando padrão para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]