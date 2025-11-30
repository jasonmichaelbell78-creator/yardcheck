# YardCheck Security & Feature Roadmap

## Overview

This document outlines the planned phases of security improvements and feature enhancements for the YardCheck application.

---

## Phase 1: Basic Authentication ✅ COMPLETE

**Status:** ✅ Completed  
**Completed:** November 2025

### Goals
Replace the insecure dropdown-based login with proper email/password authentication.

### Completed Items

| Feature | Description | PR |
|---------|-------------|-----|
| Email/Password Login | Replace dropdown with email/password form | - |
| Firebase Authentication | Integrate Firebase Auth for user management | - |
| Force Password Change | Require password change on first login | #47 |
| Role-Based Routing | Admins → Dashboard, Inspectors → Trucks | #49 |
| Navigation Buttons | Admin button on Trucks, Start Inspection on Dashboard | #49 |
| Firebase Hosting Rewrites | Add /change-password route | #50 |
| Firestore Rules Update | Allow self-update of mustChangePassword | #51 |
| User Guide Update | Document new authentication flow | #52 |

### Technical Details
- Inspectors are created in Firebase Auth with a temporary password (set by admin)
- `mustChangePassword` flag in Firestore forces password change on first login
- Firestore rules allow users to update only their own `mustChangePassword` field
- Admins retain full control over all inspector documents

---

## Phase 2: Password Management 🔲 PLANNED

**Status:** 🔲 Not Started

### Goals
Add self-service password management features.

### Planned Items

| Feature | Description | Priority |
|---------|-------------|----------|
| Forgot Password | Email-based password reset flow | High |
| Change Password (Settings) | Allow users to change password anytime | Medium |
| Password Strength Meter | Visual feedback on password strength | Low |
| Password Requirements | Enforce complexity (uppercase, numbers, etc.) | Medium |

### Technical Considerations
- Use Firebase Auth `sendPasswordResetEmail()` for forgot password
- Add a Settings/Profile page for password changes
- Consider re-authentication requirement for password changes

---

## Phase 3: Admin User Management 🔲 PLANNED

**Status:** 🔲 Not Started

### Goals
Allow admins to manage inspectors directly from the app (no Firebase Console needed).

### Planned Items

| Feature | Description | Priority |
|---------|-------------|----------|
| Create Inspector | Admin form to add new inspectors | High |
| Edit Inspector | Update inspector name, email, admin status | High |
| Deactivate Inspector | Soft-delete (set active: false) | High |
| Reset Password | Admin can reset an inspector's password | High |
| View Inspector List | See all inspectors with status | Medium |
| Activity Log | See last login time for each inspector | Low |

### Technical Considerations
- Use Firebase Admin SDK via Cloud Functions for user creation
- Cannot create Firebase Auth users directly from client
- Consider email notification when account is created

---

## Phase 4: Session Security 🔲 PLANNED

**Status:** 🔲 Not Started

### Goals
Improve session management and security.

### Planned Items

| Feature | Description | Priority |
|---------|-------------|----------|
| Session Timeout | Auto-logout after inactivity (e.g., 30 min) | Medium |
| Single Session | Prevent login from multiple devices | Low |
| Login History | Track login times and devices | Low |
| Logout All Sessions | Admin can force logout for a user | Low |

### Technical Considerations
- Firebase Auth tokens expire after 1 hour by default
- Consider using Firebase Auth session cookies for longer sessions
- Balance security with mobile app usability (inspectors in the field)

---

## Phase 5: Audit & Compliance 🔲 PLANNED

**Status:** 🔲 Not Started

### Goals
Add audit logging for compliance and troubleshooting.

### Planned Items

| Feature | Description | Priority |
|---------|-------------|----------|
| Login Audit Log | Record all login attempts (success/failure) | Medium |
| Action Audit Log | Record who changed what and when | Medium |
| Inspection Audit Trail | Track all changes to inspections | High |
| Export Audit Logs | Admin can download logs for compliance | Low |

### Technical Considerations
- Store audit logs in a separate Firestore collection
- Consider retention period (30 days, 90 days, etc.)
- May need Cloud Functions for secure logging

---

## Phase 6: Advanced Security 🔲 FUTURE

**Status:** 🔲 Future Consideration

### Potential Items

| Feature | Description | Priority |
|---------|-------------|----------|
| Two-Factor Authentication (2FA) | Additional security for admin accounts | Low |
| IP Allowlisting | Restrict access by IP range | Low |
| Rate Limiting (Login) | Prevent brute force attacks | Medium |
| Security Headers | Add CSP, HSTS, etc. | Low |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | November 2025 | Initial roadmap created after Phase 1 completion |

---

## Notes

- Priorities may shift based on user feedback and business needs
- Each phase should be fully tested before moving to the next
- Security updates may be fast-tracked if vulnerabilities are discovered
