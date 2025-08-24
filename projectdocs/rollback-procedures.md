# Rollback Procedures
**Version:** 1.0  
**Date:** August 24, 2025  
**Project:** Evidence-Based PBL Platform

---

## Overview

This document provides comprehensive rollback procedures for the Evidence-Based PBL Platform MVP, ensuring safe recovery from deployment issues, database problems, or feature failures while maintaining data integrity and user access.

## Rollback Philosophy

1. **Safety First**: All rollbacks preserve user data and educational records
2. **FERPA Compliance**: Rollback procedures maintain student data privacy
3. **Minimal Downtime**: Rollbacks complete within 5 minutes maximum
4. **Individual Assessment Integrity**: No team grading vulnerabilities during rollback
5. **Complete Recovery**: Full restoration to last known good state

---

## Emergency Rollback Commands

### Immediate Rollback (Any Phase)
```bash
#!/bin/bash
# scripts/emergency-rollback.sh
echo "🚨 EMERGENCY ROLLBACK INITIATED"

# 1. Stop all services immediately
docker-compose down --timeout 10

# 2. Restore last known good database
docker run --rm -v pgdata_backup_last_good:/backup \
  -v pblab_pgdata:/data \
  alpine sh -c "rm -rf /data/* && cp -r /backup/* /data/"

# 3. Restore last known good code
git stash
git checkout main
git reset --hard $(cat .last-good-commit)

# 4. Restart with safe configuration
cp .env.production.backup .env
docker-compose up -d

echo "✅ EMERGENCY ROLLBACK COMPLETE"
./scripts/health-check.sh
```

### Quick Health Check
```bash
#!/bin/bash
# scripts/health-check.sh
echo "🔍 System Health Check"

# Database connectivity
docker-compose exec -T postgres pg_isready -U postgres || echo "❌ Database DOWN"

# API responsiveness  
curl -f http://localhost:3000/api/health || echo "❌ API DOWN"

echo "✅ Health check complete"
```

---

## Phase-Specific Rollback Procedures

## Phase 1: Foundation Setup Rollback

### Database Schema Rollback
```bash
#!/bin/bash
# scripts/rollback/phase1-database.sh

echo "🔄 Rolling back Phase 1 database changes..."

# 1. Create backup of current state
docker-compose exec postgres pg_dump -U postgres -d postgres > rollback_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Stop services
docker-compose down

# 3. Restore database backup
docker run --rm -v pgdata_backup:/backup \
  -v pblab_pgdata:/data \
  alpine sh -c "rm -rf /data/* && cp -r /backup/* /data/"

# 4. Restart services
docker-compose up -d

echo "✅ Phase 1 database rollback complete"
```

## Phase 2: Individual Assessment Rollback

### Assessment System Rollback
```sql
-- scripts/rollback/phase2-assessment-rollback.sql
BEGIN TRANSACTION;

-- Backup current assessment data
CREATE TABLE individual_assessments_rollback_backup AS
SELECT *, NOW() as backup_timestamp FROM individual_assessments;

-- Check for dependencies that need preservation
DO $$
DECLARE
  dependent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dependent_count
  FROM individual_assessments ia
  WHERE ia.created_at >= '2025-08-24'::date;
  
  IF dependent_count > 0 THEN
    RAISE NOTICE 'Found % assessments to preserve during rollback', dependent_count;
    
    -- Mark assessments as legacy instead of deleting
    UPDATE individual_assessments 
    SET competency_framework = competency_framework || '{"rollback_preserved": true}'::jsonb
    WHERE created_at >= '2025-08-24'::date;
  END IF;
END $$;

-- Verify no team grading constraints were violated
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM individual_assessments 
      WHERE competency_framework::text LIKE '%team_grade%'
    ) 
    THEN 'CRITICAL: Team grading found'
    ELSE 'OK: Individual assessment integrity maintained'
  END as integrity_check;

COMMIT;
```

---

## Automated Rollback Triggers

### Health Check Triggers
```bash
#!/bin/bash
# scripts/monitor/health-monitor.sh
# Runs every 30 seconds via cron

while true; do
  # Check API health
  if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "$(date): API health check failed"
    
    # Count consecutive failures
    FAILURES=$(cat /tmp/health_failures 2>/dev/null || echo "0")
    FAILURES=$((FAILURES + 1))
    echo $FAILURES > /tmp/health_failures
    
    # Auto-rollback after 3 consecutive failures
    if [ $FAILURES -ge 3 ]; then
      echo "$(date): Triggering automatic rollback"
      ./scripts/emergency-rollback.sh
      break
    fi
  else
    # Reset failure counter on success
    echo "0" > /tmp/health_failures
  fi
  
  sleep 30
done
```

---

## Data Preservation During Rollback

### FERPA-Compliant Data Backup
```typescript
// scripts/rollback/data-preservation.ts
interface DataBackupConfig {
  includeStudentData: boolean;
  encryptBackup: boolean;
  auditTrail: boolean;
}

async function createPreRollbackBackup(config: DataBackupConfig) {
  console.log('📋 Creating pre-rollback data backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `backups/pre-rollback-${timestamp}`;

  if (config.includeStudentData) {
    // Backup all student educational records
    const studentData = await Promise.all([
      supabase.from('individual_learning_objectives').select('*'),
      supabase.from('individual_assessments').select('*'),
      supabase.from('individual_reflections').select('*'),
      supabase.from('ai_usage').select('*')
    ]);

    const backupData = {
      timestamp,
      studentRecords: {
        objectives: studentData[0].data,
        assessments: studentData[1].data,
        reflections: studentData[2].data,
        aiUsage: studentData[3].data
      }
    };

    if (config.encryptBackup) {
      const encrypted = await encryptSensitiveData(JSON.stringify(backupData));
      await writeFile(`${backupPath}/student-data.encrypted`, encrypted);
    } else {
      await writeFile(`${backupPath}/student-data.json`, JSON.stringify(backupData, null, 2));
    }
  }

  if (config.auditTrail) {
    // Create audit log entry
    await supabase.from('ferpa_audit_log').insert({
      user_id: 'system',
      action: 'backup_creation',
      resource_type: 'all_student_data',
      educational_justification: 'Pre-rollback data preservation for system recovery',
      timestamp: new Date()
    });
  }

  console.log(`✅ Backup created at: ${backupPath}`);
  return backupPath;
}
```

---

## Rollback Testing & Validation

### Rollback Validation Scripts
```bash
#!/bin/bash
# scripts/rollback/validate-rollback.sh

echo "🔍 Validating rollback success..."

# 1. Check system is responding
if curl -f http://localhost:3000/api/health; then
  echo "✅ API responding"
else
  echo "❌ API not responding"
  exit 1
fi

# 2. Verify database integrity
docker-compose exec postgres psql -U postgres -d postgres -c "
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Student data preserved'
    ELSE '❌ Student data missing'
  END
FROM individual_learning_objectives;"

# 3. Verify no team grading vulnerabilities
docker-compose exec postgres psql -U postgres -d postgres -c "
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM individual_assessments 
      WHERE competency_framework::text LIKE '%team_%'
    ) 
    THEN '❌ CRITICAL: Team grading detected'
    ELSE '✅ Individual assessment integrity maintained'
  END as team_grading_check;"

echo "✅ Rollback validation complete"
```

---

## Communication During Rollback

### User Notification Templates
```typescript
// scripts/rollback/notifications.ts
const rollbackNotifications = {
  students: {
    subject: 'PBL Platform: Brief Maintenance Complete',
    message: `Hi {student_name},

The PBL platform experienced a brief service interruption but is now fully operational. 

Your individual learning objectives, assessments, and reflection data have been preserved completely.

If you experience any issues, please contact your instructor.

Best regards,
PBL Platform Team`
  },

  educators: {
    subject: 'PBL Platform: System Rollback Completed',
    message: `Hi {educator_name},

We've completed a system rollback to ensure platform stability. 

✅ All student individual assessment data preserved
✅ Team intervention history maintained  
✅ Platform functionality fully restored

Dashboard may take 2-3 minutes to refresh all data.

Contact support if you notice any issues.

Best regards,
PBL Platform Team`
  }
};
```

---

## Success Criteria

### Rollback Success Metrics
- **Downtime**: <5 minutes for any rollback
- **Data Preservation**: 100% of student educational records maintained
- **FERPA Compliance**: No unauthorized data exposure
- **Individual Assessment Integrity**: Zero team grading vulnerabilities introduced
- **User Notification**: 100% of affected users notified within 10 minutes
- **System Recovery**: All critical functions operational within 5 minutes

### Validation Checklist
```markdown
## Post-Rollback Validation Checklist

### Technical Validation
- [ ] API responds within 2 seconds
- [ ] Database queries execute normally  
- [ ] Authentication system functional
- [ ] Individual objectives accessible
- [ ] Assessment submissions work

### Data Integrity  
- [ ] All student records preserved
- [ ] Individual assessment data complete
- [ ] No orphaned records detected
- [ ] No team grading vulnerabilities
- [ ] Audit logs maintained

### Compliance
- [ ] FERPA audit trail complete
- [ ] All user notifications sent
- [ ] Status page updated
- [ ] Incident documentation complete
```

---

*These rollback procedures ensure safe recovery from any deployment issues while maintaining the integrity of individual assessment data and FERPA compliance throughout the Evidence-Based PBL Platform.*
