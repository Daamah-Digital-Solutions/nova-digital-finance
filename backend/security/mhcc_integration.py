import requests
import json
import hashlib
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class MHCCClient:
    """
    MHCC (Cybersecurity Partner) Integration Client
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'MHCC_API_URL', 'https://api.mhcc.security')
        self.api_key = getattr(settings, 'MHCC_API_KEY', '')
        self.client_id = getattr(settings, 'MHCC_CLIENT_ID', 'nova-finance')
        self.enabled = getattr(settings, 'MHCC_MONITORING_ENABLED', True)
        self.timeout = 30
        
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': f'NovaFinance-MHCC-Client/1.0'
        })

    def report_security_incident(self, incident_data: Dict[str, Any]) -> bool:
        """Report security incident to MHCC"""
        if not self.enabled:
            return True
        
        try:
            # Enrich incident data
            enriched_data = self._enrich_incident_data(incident_data)
            
            # Send to MHCC
            response = self.session.post(
                f'{self.base_url}/incidents',
                json=enriched_data,
                timeout=self.timeout
            )
            
            if response.status_code == 201:
                logger.info(f"Security incident reported to MHCC: {incident_data.get('incident_id')}")
                return True
            else:
                logger.error(f"Failed to report incident to MHCC: {response.status_code}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"MHCC API error: {e}")
            return False

    def check_threat_intelligence(self, ip_address: str, domain: str = None) -> Dict[str, Any]:
        """Check IP/domain against MHCC threat intelligence"""
        if not self.enabled:
            return {'threat_level': 'unknown', 'details': 'MHCC monitoring disabled'}
        
        # Check cache first
        cache_key = f"mhcc_threat_check:{hashlib.md5(ip_address.encode()).hexdigest()}"
        cached_result = cache.get(cache_key)
        if cached_result:
            return cached_result
        
        try:
            params = {'ip': ip_address}
            if domain:
                params['domain'] = domain
            
            response = self.session.get(
                f'{self.base_url}/threat-intelligence/check',
                params=params,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                threat_data = response.json()
                # Cache result for 1 hour
                cache.set(cache_key, threat_data, 3600)
                return threat_data
            else:
                logger.warning(f"MHCC threat intelligence check failed: {response.status_code}")
                return {'threat_level': 'unknown', 'error': 'API error'}
                
        except requests.RequestException as e:
            logger.error(f"MHCC threat intelligence error: {e}")
            return {'threat_level': 'unknown', 'error': str(e)}

    def submit_malware_sample(self, file_content: bytes, filename: str, metadata: Dict[str, Any]) -> str:
        """Submit suspicious file for malware analysis"""
        if not self.enabled:
            return 'mhcc_disabled'
        
        try:
            files = {
                'file': (filename, file_content, 'application/octet-stream')
            }
            data = {
                'metadata': json.dumps(metadata),
                'client_id': self.client_id
            }
            
            response = self.session.post(
                f'{self.base_url}/malware/analyze',
                files=files,
                data=data,
                timeout=60  # Longer timeout for file uploads
            )
            
            if response.status_code == 202:  # Accepted for analysis
                result = response.json()
                analysis_id = result.get('analysis_id')
                logger.info(f"Malware sample submitted to MHCC: {analysis_id}")
                return analysis_id
            else:
                logger.error(f"Failed to submit malware sample: {response.status_code}")
                return 'submission_failed'
                
        except requests.RequestException as e:
            logger.error(f"MHCC malware submission error: {e}")
            return 'network_error'

    def get_analysis_result(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get malware analysis result"""
        if not self.enabled or analysis_id in ['mhcc_disabled', 'submission_failed', 'network_error']:
            return None
        
        try:
            response = self.session.get(
                f'{self.base_url}/malware/analyze/{analysis_id}',
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 202:
                return {'status': 'pending', 'message': 'Analysis in progress'}
            else:
                logger.error(f"Failed to get analysis result: {response.status_code}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"MHCC analysis result error: {e}")
            return None

    def report_anomaly(self, anomaly_data: Dict[str, Any]) -> bool:
        """Report behavioral anomaly for analysis"""
        if not self.enabled:
            return True
        
        try:
            enriched_data = {
                'client_id': self.client_id,
                'timestamp': timezone.now().isoformat(),
                'anomaly_type': anomaly_data.get('type', 'unknown'),
                'severity': anomaly_data.get('severity', 'medium'),
                'details': anomaly_data,
                'source': 'nova-finance-platform'
            }
            
            response = self.session.post(
                f'{self.base_url}/anomalies',
                json=enriched_data,
                timeout=self.timeout
            )
            
            if response.status_code == 201:
                logger.info("Anomaly reported to MHCC")
                return True
            else:
                logger.error(f"Failed to report anomaly to MHCC: {response.status_code}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"MHCC anomaly reporting error: {e}")
            return False

    def get_security_recommendations(self) -> Dict[str, Any]:
        """Get security recommendations from MHCC"""
        if not self.enabled:
            return {'recommendations': [], 'status': 'disabled'}
        
        try:
            response = self.session.get(
                f'{self.base_url}/recommendations',
                params={'client_id': self.client_id},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get recommendations: {response.status_code}")
                return {'recommendations': [], 'error': 'API error'}
                
        except requests.RequestException as e:
            logger.error(f"MHCC recommendations error: {e}")
            return {'recommendations': [], 'error': str(e)}

    def _enrich_incident_data(self, incident_data: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich incident data with additional context"""
        enriched = {
            'client_id': self.client_id,
            'platform': 'nova-finance',
            'timestamp': timezone.now().isoformat(),
            'incident_id': incident_data.get('incident_id', self._generate_incident_id()),
            **incident_data
        }
        
        # Add system context if available
        if hasattr(settings, 'DEPLOYMENT_ENVIRONMENT'):
            enriched['environment'] = settings.DEPLOYMENT_ENVIRONMENT
        
        return enriched

    def _generate_incident_id(self) -> str:
        """Generate unique incident ID"""
        timestamp = str(timezone.now().timestamp())
        return hashlib.md5(f"{self.client_id}_{timestamp}".encode()).hexdigest()[:12]


class SecurityMonitor:
    """
    Real-time security monitoring with MHCC integration
    """
    
    def __init__(self):
        self.mhcc_client = MHCCClient()
        self.alert_thresholds = {
            'failed_login_attempts': 5,
            'suspicious_api_calls': 10,
            'file_upload_anomalies': 3,
            'payment_fraud_indicators': 1
        }

    def monitor_login_attempts(self, ip_address: str, user_agent: str, success: bool) -> bool:
        """Monitor login attempts for suspicious patterns"""
        cache_key = f"login_attempts:{hashlib.md5(ip_address.encode()).hexdigest()}"
        attempts = cache.get(cache_key, [])
        
        # Add current attempt
        attempt = {
            'timestamp': timezone.now().isoformat(),
            'ip_address': ip_address,
            'user_agent': user_agent,
            'success': success
        }
        attempts.append(attempt)
        
        # Keep only last 24 hours
        cutoff_time = timezone.now() - timezone.timedelta(hours=24)
        attempts = [a for a in attempts if timezone.datetime.fromisoformat(a['timestamp'].replace('Z', '+00:00')) > cutoff_time]
        
        # Check for suspicious patterns
        failed_attempts = [a for a in attempts if not a['success']]
        
        if len(failed_attempts) >= self.alert_thresholds['failed_login_attempts']:
            # Report to MHCC
            incident_data = {
                'type': 'suspicious_login_activity',
                'severity': 'high',
                'ip_address': ip_address,
                'failed_attempts': len(failed_attempts),
                'user_agent': user_agent,
                'time_window': '24h'
            }
            
            self.mhcc_client.report_security_incident(incident_data)
            
            # Block IP temporarily
            cache.set(f"blocked_ip:{ip_address}", True, 3600)
            logger.warning(f"IP blocked due to suspicious login activity: {ip_address}")
            
        # Update cache
        cache.set(cache_key, attempts, 86400)  # 24 hours
        
        return len(failed_attempts) < self.alert_thresholds['failed_login_attempts']

    def analyze_api_behavior(self, user_id: str, endpoint: str, request_data: Dict[str, Any]) -> bool:
        """Analyze API usage patterns for anomalies"""
        cache_key = f"api_behavior:{user_id}"
        behavior_data = cache.get(cache_key, {'requests': [], 'patterns': {}})
        
        # Add current request
        request_info = {
            'timestamp': timezone.now().isoformat(),
            'endpoint': endpoint,
            'method': request_data.get('method', 'GET'),
            'size': len(str(request_data))
        }
        behavior_data['requests'].append(request_info)
        
        # Analyze patterns
        anomaly_detected = self._detect_api_anomalies(behavior_data)
        
        if anomaly_detected:
            incident_data = {
                'type': 'api_behavior_anomaly',
                'severity': 'medium',
                'user_id': user_id,
                'endpoint': endpoint,
                'request_count': len(behavior_data['requests']),
                'anomaly_indicators': anomaly_detected
            }
            
            self.mhcc_client.report_anomaly(incident_data)
        
        # Update cache
        cache.set(cache_key, behavior_data, 3600)  # 1 hour
        
        return not anomaly_detected

    def scan_uploaded_file(self, file_content: bytes, filename: str, user_id: str) -> Dict[str, Any]:
        """Scan uploaded file for malware"""
        metadata = {
            'user_id': user_id,
            'filename': filename,
            'file_size': len(file_content),
            'upload_timestamp': timezone.now().isoformat()
        }
        
        # Submit for analysis
        analysis_id = self.mhcc_client.submit_malware_sample(file_content, filename, metadata)
        
        # For immediate response, do basic checks
        scan_result = {
            'analysis_id': analysis_id,
            'immediate_threat': False,
            'requires_review': False
        }
        
        # Basic file type validation
        if self._is_suspicious_file_type(filename):
            scan_result['requires_review'] = True
            scan_result['reason'] = 'Suspicious file type'
        
        # File size validation
        if len(file_content) > 50 * 1024 * 1024:  # 50MB limit
            scan_result['requires_review'] = True
            scan_result['reason'] = 'File size exceeds limit'
        
        return scan_result

    def _detect_api_anomalies(self, behavior_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Detect API usage anomalies"""
        requests = behavior_data['requests']
        
        if len(requests) < 10:  # Need minimum data for analysis
            return None
        
        # Check request rate
        recent_requests = [r for r in requests if 
                          (timezone.now() - timezone.datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00'))).seconds < 300]
        
        if len(recent_requests) > self.alert_thresholds['suspicious_api_calls']:
            return {
                'type': 'high_request_rate',
                'requests_in_5min': len(recent_requests)
            }
        
        # Check for unusual endpoints
        endpoints = [r['endpoint'] for r in requests]
        unique_endpoints = set(endpoints)
        
        if len(unique_endpoints) > 20:  # Unusual endpoint diversity
            return {
                'type': 'unusual_endpoint_diversity',
                'unique_endpoints': len(unique_endpoints)
            }
        
        return None

    def _is_suspicious_file_type(self, filename: str) -> bool:
        """Check if file type is suspicious"""
        suspicious_extensions = {
            '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
            '.jar', '.py', '.sh', '.ps1', '.php', '.asp', '.jsp'
        }
        
        _, ext = os.path.splitext(filename.lower())
        return ext in suspicious_extensions


# Global instances
mhcc_client = MHCCClient()
security_monitor = SecurityMonitor()