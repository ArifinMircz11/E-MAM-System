#!/bin/bash

# e-Mam System - Firestore TTL Setup Script
# This script automates the activation of TTL policies for security logs.
# Requirements: gcloud CLI authenticated with project permissions.

echo "🚀 Starting Firestore TTL Configuration..."

# 1. Audit Logs (90 Days Retention)
echo "Setting TTL for audit_logs (field: timestamp)..."
gcloud firestore fields ttls update timestamp \
    --collection-group=audit_logs \
    --async

# 2. Login Logs (30 Days Retention)
echo "Setting TTL for login_logs (field: timestamp)..."
gcloud firestore fields ttls update timestamp \
    --collection-group=login_logs \
    --async

# 3. Error Logs (Optional, 30 Days Retention)
echo "Setting TTL for error_logs (field: timestamp)..."
gcloud firestore fields ttls update timestamp \
    --collection-group=error_logs \
    --async

echo "✅ TTL Update commands sent to Google Cloud."
echo "Note: It may take several minutes for the policies to become active in the console."
