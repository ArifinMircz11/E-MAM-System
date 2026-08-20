#!/bin/bash

echo "================================"
echo "Entity Registry Governance Audit"
echo "================================"

echo ""
echo "[1] Repository Entity Usage"
echo ""

grep -Rho 'super(["'\''][^"'\'']*["'\'']' src/repositories \
| sed "s/super(['\"]//;s/['\"]//g" \
| sort -u \
> /tmp/repository_entities.txt


echo ""
echo "[2] Registered Entities"
echo ""

grep -Rho 'register(["'\''][^"'\'']*["'\'']' src/domain/registry \
| sed "s/register(['\"]//;s/['\"]//g" \
| sort -u \
> /tmp/registered_entities.txt


echo ""
echo "[3] Missing Entity Contracts"
echo ""

comm -23 \
/tmp/repository_entities.txt \
/tmp/registered_entities.txt


echo ""
echo "Audit Completed"
