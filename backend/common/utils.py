import hashlib
import secrets
import string


def generate_reference(prefix: str = "NDF", length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    random_part = "".join(secrets.choice(chars) for _ in range(length))
    return f"{prefix}-{random_part}"


def generate_verification_code(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def generate_document_number(prefix: str = "DOC") -> str:
    return generate_reference(prefix=prefix, length=10)
