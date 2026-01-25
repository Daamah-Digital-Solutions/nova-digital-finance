# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nova Digital Finance is a fintech platform for digital currency financing. Django REST Framework backend with React TypeScript frontend, providing loan processing, investments, document management, and payments using the proprietary PRN (Pronova) token system (pegged 1:1 with USD).

## Development Commands

### Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows (or: source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://localhost:8000
```

**Testing:**
```bash
python manage.py test                    # All tests
python manage.py test authentication     # Single app
python manage.py test authentication.tests.test_password_reset  # Single module
```

**Other commands:**
```bash
python manage.py makemigrations
python manage.py createsuperuser
python manage.py shell
```

### Frontend (React + TypeScript)

```bash
cd frontend
npm install
npm start  # http://localhost:3000, proxies API to :8000
```

**Build & Quality:**
```bash
npm run build              # Production build
npm test                   # Unit tests (watch mode)
npm run test:ci            # Tests with coverage (CI mode)
npm run test:integration   # Playwright e2e tests
npm run lint               # ESLint with auto-fix
npm run lint:check         # ESLint check only (CI)
npm run type-check         # TypeScript check
npm run format             # Prettier format
npm run format:check       # Prettier check only (CI)
```

### Docker

```bash
docker-compose up -d       # Full stack: postgres, redis, backend, frontend, monitoring
docker-compose logs -f backend
```

The docker-compose.yml includes production-ready setup with Prometheus, Grafana, ELK stack, and Falco security.

## Architecture

### Backend Architecture

**Settings:** Split into `nova_backend/settings/` with `base.py`, `development.py`, `production.py`. Environment selected via `DJANGO_ENV`.

**App Pattern:** models → serializers → services → views

**Core Apps:**

| App | Purpose |
|-----|---------|
| **authentication** | Custom User (UUID PKs), KYC workflow, JWT auth |
| **pronova** | PRN token system - wallets, transactions (issue/pledge/unpledge/transfer/burn) |
| **loans** | Loan applications, multi-stage approval, auto-PRN issuance on approval |
| **payments** | Stripe integration, loan repayments, webhooks |
| **documents** | PDF generation (ReportLab), electronic signatures, auto-generated certificates |
| **investments** | Portfolio management, investment positions |
| **contracts** | Contract templates and instances |
| **currencies** | Multi-currency support, exchange rates |
| **capimax** | External Capimax platform integration |
| **requests** | User service requests |
| **security** | Middleware: SecurityHeaders, RateLimit, AuditLog, MHCCIntegration |
| **notifications** | Email and in-app notifications |
| **wallets** | Digital wallet tracking |

**Service Layer:** Business logic in `{app}/services.py`:
- `pronova/services.py` - PRN wallet operations (always use this, never modify balances directly)
- `documents/services.py` - DocumentGenerationService for PDFs
- `payments/services.py` - Stripe payment processing
- `contracts/services.py`, `investments/services.py`, `capimax/services.py`, `requests/services.py`

**Signals:**
- `authentication/models.py` - Auto-generates KYC reports on user approval
- `loans/models.py` - Auto-issues PRN and generates certificates on loan approval

**API Endpoints:**
```
/admin/              - Django admin interface
/api/health/         - Health check (DB + cache status)
/api/ready/          - Readiness check
/api/auth/           - Authentication (JWT)
/api/loans/          - Loan applications
/api/payments/       - Payment processing
/api/documents/      - Document management
/api/investments/    - Investments
/api/pronova/        - PRN wallets/transactions
/api/contracts/      - Contracts
/api/currencies/     - Currencies
/api/requests/       - Service requests
/api/capimax/        - Capimax integration
```

### Frontend Architecture

**Stack:** React 18 + TypeScript, TailwindCSS + Headless UI, React Query, React Hook Form, i18next, Recharts, Stripe

**Key Contexts:** `AuthContext.tsx`, `ThemeContext.tsx`, `LanguageContext.tsx`

**Structure:**
- `pages/Auth/` - Login, Register, KYC
- `pages/Dashboard.tsx` - Main dashboard
- `pages/Loans/` - Loan application and payment
- `pages/Investments/` - Portfolio management
- `pages/Documents/` - Document viewing and signing
- `components/Layout/` - Header, Footer, PageContainer
- `components/Payment/` - Stripe forms
- `components/PWA/` - Install banner, offline indicator

**API Proxy:** Configured in package.json to proxy `/api` to `http://localhost:8000`

## Key Business Logic

### PRN Token System
- PRN is pegged 1:1 with USD, used for all loan disbursements
- `available_balance = balance - pledged_balance`
- Always use `pronova/services.py` for wallet operations - never modify balances directly

### Loan Workflow
1. User submits application (status: 'submitted')
2. Admin reviews (status: 'under_review')
3. On approval: PRN issued → PRN pledged as collateral → Certificate auto-generated
4. Repayment unpledges PRN proportionally

### Document Auto-Generation
- KYC reports auto-generated when `user.kyc_status = 'approved'`
- Loan certificates auto-generated on loan approval
- Use `DocumentGenerationService` from `documents/services.py`
- PDFs stored in `media/documents/`

## Database

- **Development:** SQLite | **Production:** PostgreSQL
- User IDs use UUID primary keys
- Use Decimal fields for monetary values

## Environment Variables

See `backend/.env.example` for development, `.env.example` for production.

Key variable: `DJANGO_ENV` (development/production) - controls which settings module is loaded via `nova_backend/settings/__init__.py`.

## Common Patterns

**Adding a new feature:**
1. Create/modify models in `app/models.py`
2. Run `python manage.py makemigrations`
3. Add serializers in `app/serializers.py`
4. Add business logic in `app/services.py`
5. Create views in `app/views.py` (use DRF viewsets/APIView)
6. Register URLs in `app/urls.py`
7. Add tests in `app/tests/`
8. For auto-actions, use Django signals

## Logs

- `backend/logs/nova_finance.log` - General logs
- `backend/logs/security.log` - Auth and security events

JSON format in production, verbose in development.
