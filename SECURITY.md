# Security Policy

The MindineersOS team at Mindineers Labs takes the security of our software
seriously. This document describes how to report vulnerabilities and our
remediation commitments.

## Reporting a Vulnerability

**Do not open public GitHub issues for security bugs.**

Email: **security@mindineers.dev**

We will acknowledge receipt within **2 business days** and provide an initial
triage assessment within **5 business days**.

## Responsible Disclosure

We follow a **90-day** coordinated-disclosure window from initial report to
public disclosure. We may extend this for complex issues by mutual agreement
with the reporter. Researchers who report in good faith and follow this policy
will not be subject to legal action under our vulnerability-disclosure terms.

## Remediation SLA

Once a vulnerability is confirmed:

| Severity (CVSS v3) | Remediation Target  | Notes                                            |
| ------------------- | ------------------- | ------------------------------------------------ |
| Critical (9.0–10)  | **7 calendar days** | Includes hotfix release where applicable.        |
| High (7.0–8.9)     | **30 days**         | Patched in next minor release.                   |
| Medium (4.0–6.9)   | **90 days**         | Patched in next minor release or bundled bugfix. |
| Low (< 4.0)        | Next planned release| Tracked but not separately released.             |

These targets apply to first-party code in this repository and to direct
dependencies under our control. Transitive vulnerabilities that depend on
upstream maintainers may take longer; we document any extended exposure in
this file and in dependabot ignore rules.

## Supported Versions

Security patches are applied to the **`latest` and `beta` dist-tag releases**
on npm. Versions older than the current `latest` minor are end-of-life
and will not receive patches.

## Scope

In-scope:
- Source code in this repository.
- Installer scripts (`install.sh`, `install.ps1`).
- Officially published packages.

Out-of-scope:
- Third-party plugins not maintained by Mindineers Labs.
- Social engineering against contributors.
- Denial of service via resource exhaustion of a self-hosted deployment.

## Public Advisories

Confirmed and remediated vulnerabilities are published as GitHub Security
Advisories on this repository.

---

## Author

**Kartikay Srivastava** — Mindineers Labs

Copyright © 2026 Mindineers Labs. All rights reserved.
