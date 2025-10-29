# BudgetManager

A web-based application that helps individual users consolidate and categorize expenses and income from multiple bank accounts. Leveraging AI-powered categorization, BudgetManager enables users to quickly record transactions, receive category suggestions, and maintain a clear financial overview without manual sorting.

![Node.js Version](https://img.shields.io/badge/node-22.14.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-MVP%20Development-orange)

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------||
| **Frontend** | | |
| [Astro](https://astro.build/) | 5.13.7 | Modern web framework for building fast, content-focused websites |
| [React](https://react.dev/) | 19.1.1 | UI library for building interactive components |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Static typing for better development experience and IDE support |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.13 | Utility-first CSS framework for convenient styling |
| [Shadcn/ui](https://ui.shadcn.com/) | - | Accessible component library for React UI |
| **Backend** | | |
| [Supabase](https://supabase.com/) | - | Complete backend solution with PostgreSQL database, BaaS SDK, and built-in user authentication |
|| **AI Integration** | | |
|| [OpenRouter.ai](https://openrouter.ai/) | - | Access to various AI models (OpenAI, Anthropic, Google) for transaction categorization with cost optimization |
|| **Testing** | | |
|| [Vitest](https://vitest.dev/) | - | Fast unit testing framework with TypeScript support |
|| [@testing-library/react](https://testing-library.com/) | - | Testing utilities for React components |
|| [MSW](https://mswjs.io/) | - | API mocking for integration tests |
|| [Playwright](https://playwright.dev/) | - | End-to-end testing across Chromium, Firefox, and WebKit |
|| [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) | - | Accessibility testing integration |
|| **CI/CD & Hosting** | | |
| GitHub Actions | - | CI/CD pipeline automation |
| DigitalOcean | - | Application hosting via Docker containers |

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd budget-manager
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration values
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:4321`

### Building for Production

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format code using Prettier
- `npm run test` - Run unit and integration tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright

## Project Scope

### Core Features (MVP)

**User Authentication**
- Email/password signup and login
- Secure session token management

**Account Management**
- Create, edit, and delete bank accounts (name, type, optional balance)
- View list of user's accounts

**Transaction Management**
- Create, read, update, and delete transaction records
- Single-form entry interface for quick transaction input
- Record details: amount, date, description, account ID, category

**AI-Powered Categorization**
- Automatic category suggestions via OpenRouter.ai integration
- Display suggested categories with confidence scores
- User can approve, reject, or modify AI suggestions

**Category Management**
- 15-20 predefined standard categories
- Create, edit, and delete custom categories

**Dashboard**
- Display total expenses and income summary
- List recent transactions with edit/delete actions
- Quick access to add new transactions

**Data Persistence**
- Store transaction data, AI suggestions, confidence scores, and user selections in database

### Out of Scope (Current MVP)

- Integration with external banking systems (API connections)
- Import transactions from files or third-party services
- Charts or graphical expense/income trend analysis
- Advanced analytics and reporting
- Performance optimization for large-scale usage

### Success Metrics

- **Primary Goal**: Achieve ≥50% AI categorization accuracy for expenses
- **Measurement**: Daily comparison of AI-suggested categories vs. user's final category selections
- **Reporting**: Dashboard showing categorization accuracy percentage over time

## Project Status

🚧 **Currently in MVP Development**

This project is actively being developed as a Minimum Viable Product (MVP). The core functionality for transaction management, AI-powered categorization, and user authentication is being implemented.

### Recent Development Focus
- Setting up the foundational Astro + React + TypeScript architecture
- Implementing Supabase integration for backend services
- Developing the core transaction and account management features

## License

This project is licensed under the MIT License. See the LICENSE file for details.
