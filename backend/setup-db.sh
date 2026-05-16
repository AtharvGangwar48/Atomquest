#!/bin/bash
# Run database migrations and seed

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running database seed..."
npx ts-node prisma/seed.ts

echo "✅ Database setup complete!"
