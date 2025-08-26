import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class SecurityIncident(models.Model):
    """
    Model for tracking security incidents
    """
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    INCIDENT_TYPES = [
        ('failed_login', 'Failed Login Attempt'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('malware_detected', 'Malware Detected'),
        ('data_breach', 'Data Breach'),
        ('unauthorized_access', 'Unauthorized Access'),
        ('api_abuse', 'API Abuse'),
        ('ddos_attack', 'DDoS Attack'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    incident_type = models.CharField(max_length=50, choices=INCIDENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Source information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    affected_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Timestamps
    occurred_at = models.DateTimeField(default=timezone.now)
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # MHCC Integration
    mhcc_incident_id = models.CharField(max_length=100, blank=True)
    reported_to_mhcc = models.BooleanField(default=False)
    
    # Additional data (JSON)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['incident_type', 'severity']),
            models.Index(fields=['status', 'detected_at']),
            models.Index(fields=['ip_address']),
        ]
    
    def __str__(self):
        return f"{self.incident_type} - {self.severity} - {self.detected_at}"


class SecurityAuditLog(models.Model):
    """
    Model for security audit logging
    """
    ACTION_TYPES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('password_change', 'Password Change'),
        ('profile_update', 'Profile Update'),
        ('loan_application', 'Loan Application'),
        ('payment', 'Payment'),
        ('document_access', 'Document Access'),
        ('admin_action', 'Admin Action'),
        ('api_call', 'API Call'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    action = models.CharField(max_length=200)
    
    # Request information
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    request_method = models.CharField(max_length=10)
    request_path = models.CharField(max_length=500)
    
    # Response information
    status_code = models.IntegerField()
    response_size = models.IntegerField(default=0)
    duration_ms = models.FloatField(default=0.0)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Additional data
    details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
            models.Index(fields=['status_code', 'timestamp']),
        ]
    
    def __str__(self):
        user_info = f"User {self.user.username}" if self.user else "Anonymous"
        return f"{user_info} - {self.action} - {self.timestamp}"


class BlockedIP(models.Model):
    """
    Model for managing blocked IP addresses
    """
    BLOCK_REASONS = [
        ('failed_login', 'Failed Login Attempts'),
        ('suspicious_activity', 'Suspicious Activity'),
        ('malware', 'Malware Detection'),
        ('ddos', 'DDoS Attack'),
        ('manual', 'Manual Block'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ip_address = models.GenericIPAddressField(unique=True)
    reason = models.CharField(max_length=50, choices=BLOCK_REASONS)
    description = models.TextField(blank=True)
    
    # Block details
    blocked_at = models.DateTimeField(auto_now_add=True)
    blocked_until = models.DateTimeField(null=True, blank=True)  # null = permanent
    is_active = models.BooleanField(default=True)
    
    # Related incident
    incident = models.ForeignKey(SecurityIncident, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Block count
    block_count = models.IntegerField(default=1)
    last_attempt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-blocked_at']
        indexes = [
            models.Index(fields=['ip_address', 'is_active']),
            models.Index(fields=['blocked_until']),
        ]
    
    def __str__(self):
        return f"{self.ip_address} - {self.reason}"
    
    def is_expired(self):
        if not self.blocked_until:
            return False
        return timezone.now() > self.blocked_until


class MalwareAnalysis(models.Model):
    """
    Model for tracking malware analysis results
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('analyzing', 'Analyzing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    THREAT_LEVELS = [
        ('clean', 'Clean'),
        ('suspicious', 'Suspicious'),
        ('malicious', 'Malicious'),
        ('unknown', 'Unknown'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    analysis_id = models.CharField(max_length=100, unique=True)
    
    # File information
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    file_hash = models.CharField(max_length=64)  # SHA-256
    mime_type = models.CharField(max_length=100, blank=True)
    
    # User and upload info
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Analysis results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    threat_level = models.CharField(max_length=20, choices=THREAT_LEVELS, default='unknown')
    
    # MHCC Analysis
    mhcc_response = models.JSONField(default=dict, blank=True)
    analysis_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Actions taken
    file_quarantined = models.BooleanField(default=False)
    user_notified = models.BooleanField(default=False)
    incident_created = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['analysis_id']),
            models.Index(fields=['file_hash']),
            models.Index(fields=['uploaded_by', 'uploaded_at']),
            models.Index(fields=['status', 'threat_level']),
        ]
    
    def __str__(self):
        return f"{self.filename} - {self.threat_level} - {self.uploaded_at}"


class SecurityConfiguration(models.Model):
    """
    Model for storing security configuration settings
    """
    SETTING_TYPES = [
        ('boolean', 'Boolean'),
        ('integer', 'Integer'),
        ('string', 'String'),
        ('json', 'JSON'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, default='string')
    description = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    class Meta:
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def get_typed_value(self):
        """Return value with appropriate type casting"""
        if self.setting_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.setting_type == 'integer':
            return int(self.value)
        elif self.setting_type == 'json':
            import json
            return json.loads(self.value)
        else:
            return self.value