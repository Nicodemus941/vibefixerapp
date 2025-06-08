#!/bin/bash
set -e

echo "Before prisma generate:"
ls -l node_modules/@prisma/client || echo 'No client before'

npx prisma generate

echo "After prisma generate:"
ls -l node_modules/@prisma/client || echo 'No client after'

npm run build 