# Security Policy

## Supported Versions

The following versions of the project are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please follow these steps:

1. **Do NOT create a public GitHub issue.**
2. Email the details to the project maintainer (or open a private advisory if on GitHub Enterprise).
3. Include steps to reproduce the issue.

We will acknowledge your report within 48 hours and provide an estimated timeline for a fix.

## Best Practices for Developers

- **Secrets**: Never commit API keys, private keys, or mnemonics to the repository. Use `.env` files.
- **Dependencies**: Regularly audit dependencies using `npm audit`.
- **Input Validation**: Always validate user input, especially for on-chain transactions.
- **Reentrancy**: Ensure smart contracts are protected against reentrancy attacks (use `nonReentrant` modifiers).
