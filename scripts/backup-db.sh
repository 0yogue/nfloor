#!/bin/bash

# =============================================================================
# NFloor - Script de Backup do Banco de Dados
# =============================================================================

set -e

# Configurações
BACKUP_DIR="${HOME}/backups"
DB_NAME="nfloor_prod"
DB_USER="nfloor_user"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/nfloor_backup_${DATE}.sql"

# Criar diretório de backup se não existir
mkdir -p ${BACKUP_DIR}

echo "🔄 Iniciando backup do banco ${DB_NAME}..."

# Fazer backup
pg_dump -U ${DB_USER} -h localhost ${DB_NAME} > ${BACKUP_FILE}

# Comprimir
gzip ${BACKUP_FILE}

# Manter apenas os últimos 7 backups
ls -t ${BACKUP_DIR}/nfloor_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "✅ Backup criado: ${BACKUP_FILE}.gz"
echo "📊 Tamanho: $(du -h ${BACKUP_FILE}.gz | cut -f1)"

# Listar backups existentes
echo ""
echo "Backups existentes:"
ls -lh ${BACKUP_DIR}/nfloor_backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
