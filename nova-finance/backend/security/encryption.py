import os
import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    """
    Encryption service for sensitive data protection
    """
    
    def __init__(self):
        self.encryption_key = self._get_or_create_key()
        self.fernet = Fernet(self.encryption_key)

    def _get_or_create_key(self) -> bytes:
        """Get or create encryption key"""
        key_path = getattr(settings, 'ENCRYPTION_KEY_PATH', 'encryption.key')
        
        if os.path.exists(key_path):
            with open(key_path, 'rb') as key_file:
                return key_file.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_path, 'wb') as key_file:
                key_file.write(key)
            logger.info("New encryption key generated")
            return key

    def encrypt_string(self, plaintext: str) -> str:
        """Encrypt a string"""
        if not plaintext:
            return plaintext
        
        try:
            encrypted_bytes = self.fernet.encrypt(plaintext.encode('utf-8'))
            return base64.b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            raise

    def decrypt_string(self, encrypted_text: str) -> str:
        """Decrypt a string"""
        if not encrypted_text:
            return encrypted_text
        
        try:
            encrypted_bytes = base64.b64decode(encrypted_text.encode('utf-8'))
            decrypted_bytes = self.fernet.decrypt(encrypted_bytes)
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            raise

    def encrypt_file(self, file_content: bytes) -> bytes:
        """Encrypt file content"""
        try:
            return self.fernet.encrypt(file_content)
        except Exception as e:
            logger.error(f"File encryption error: {e}")
            raise

    def decrypt_file(self, encrypted_content: bytes) -> bytes:
        """Decrypt file content"""
        try:
            return self.fernet.decrypt(encrypted_content)
        except Exception as e:
            logger.error(f"File decryption error: {e}")
            raise

    def hash_password(self, password: str, salt: str = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = os.urandom(32)
        elif isinstance(salt, str):
            salt = salt.encode('utf-8')
        
        # Use PBKDF2 for password hashing
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        password_hash = kdf.derive(password.encode('utf-8'))
        return base64.b64encode(password_hash).decode('utf-8'), base64.b64encode(salt).decode('utf-8')

    def verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        try:
            computed_hash, _ = self.hash_password(password, base64.b64decode(salt.encode('utf-8')))
            return computed_hash == password_hash
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False

    def generate_secure_token(self, length: int = 32) -> str:
        """Generate cryptographically secure random token"""
        return base64.urlsafe_b64encode(os.urandom(length)).decode('utf-8')

    def hash_data(self, data: str) -> str:
        """Create SHA-256 hash of data"""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()


class PIIProtection:
    """
    Personally Identifiable Information (PII) protection utilities
    """
    
    def __init__(self):
        self.encryption_service = EncryptionService()
        
        # Define PII fields that should be encrypted
        self.pii_fields = {
            'ssn', 'social_security_number', 'passport_number', 'driver_license',
            'bank_account_number', 'credit_card_number', 'phone_number',
            'date_of_birth', 'mother_maiden_name', 'personal_id_number'
        }

    def protect_pii_data(self, data: dict) -> dict:
        """Encrypt PII fields in data dictionary"""
        protected_data = data.copy()
        
        for field_name, value in data.items():
            if self._is_pii_field(field_name) and value:
                protected_data[field_name] = self.encryption_service.encrypt_string(str(value))
        
        return protected_data

    def unprotect_pii_data(self, data: dict) -> dict:
        """Decrypt PII fields in data dictionary"""
        unprotected_data = data.copy()
        
        for field_name, value in data.items():
            if self._is_pii_field(field_name) and value:
                try:
                    unprotected_data[field_name] = self.encryption_service.decrypt_string(value)
                except Exception:
                    # If decryption fails, assume data is already unencrypted
                    pass
        
        return unprotected_data

    def mask_sensitive_data(self, data: dict) -> dict:
        """Mask sensitive data for logging/display"""
        masked_data = data.copy()
        
        for field_name, value in data.items():
            if self._is_pii_field(field_name) and value:
                masked_data[field_name] = self._mask_value(str(value))
        
        return masked_data

    def _is_pii_field(self, field_name: str) -> bool:
        """Check if field contains PII"""
        field_lower = field_name.lower()
        return any(pii_field in field_lower for pii_field in self.pii_fields)

    def _mask_value(self, value: str) -> str:
        """Mask sensitive value"""
        if len(value) <= 4:
            return '*' * len(value)
        else:
            return value[:2] + '*' * (len(value) - 4) + value[-2:]


class DocumentSecurity:
    """
    Security utilities for document handling
    """
    
    def __init__(self):
        self.encryption_service = EncryptionService()

    def encrypt_document(self, document_content: bytes, metadata: dict) -> tuple:
        """Encrypt document with metadata"""
        try:
            # Encrypt document content
            encrypted_content = self.encryption_service.encrypt_file(document_content)
            
            # Create document hash for integrity verification
            document_hash = hashlib.sha256(document_content).hexdigest()
            
            # Encrypt sensitive metadata
            pii_protection = PIIProtection()
            protected_metadata = pii_protection.protect_pii_data(metadata)
            protected_metadata['document_hash'] = document_hash
            
            return encrypted_content, protected_metadata
        except Exception as e:
            logger.error(f"Document encryption error: {e}")
            raise

    def decrypt_document(self, encrypted_content: bytes, metadata: dict) -> tuple:
        """Decrypt document and verify integrity"""
        try:
            # Decrypt document content
            decrypted_content = self.encryption_service.decrypt_file(encrypted_content)
            
            # Verify document integrity
            current_hash = hashlib.sha256(decrypted_content).hexdigest()
            stored_hash = metadata.get('document_hash')
            
            if stored_hash and current_hash != stored_hash:
                raise ValueError("Document integrity check failed")
            
            # Decrypt metadata
            pii_protection = PIIProtection()
            unprotected_metadata = pii_protection.unprotect_pii_data(metadata)
            
            return decrypted_content, unprotected_metadata
        except Exception as e:
            logger.error(f"Document decryption error: {e}")
            raise

    def generate_secure_filename(self, original_filename: str, user_id: str) -> str:
        """Generate secure filename with user context"""
        # Extract file extension
        name, ext = os.path.splitext(original_filename)
        
        # Create secure hash-based filename
        hash_input = f"{user_id}_{name}_{os.urandom(16).hex()}"
        secure_name = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
        
        return f"{secure_name}{ext}"


# Global instances
encryption_service = EncryptionService()
pii_protection = PIIProtection()
document_security = DocumentSecurity()