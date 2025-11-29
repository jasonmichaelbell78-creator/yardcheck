# 🚀 Complete GitHub Copilot Enhancement Guide
## 50 MCP Servers + 50 AI Agents with Installation Instructions

**Last Updated:** November 2025  
**Purpose:** Maximize your GitHub Copilot and VS Code capabilities for app development

---

# 📋 TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [General Installation Methods](#general-installation-methods)
4. [All 50 MCP Servers](#all-50-mcp-servers)
5. [All 50 AI Agents](#all-50-ai-agents)
6. [Quick Start Recommendations](#quick-start-recommendations)
7. [Troubleshooting](#troubleshooting)
8. [Resources](#resources)

---

# 📖 INTRODUCTION

This guide provides a comprehensive reference for extending GitHub Copilot with:
- **MCP Servers**: Model Context Protocol servers that connect AI to external tools and data
- **AI Agents**: Extensions and tools that enhance your coding experience

**What is MCP?**
MCP (Model Context Protocol) is like a "USB-C for AI" - a standardized way to connect AI assistants to external services, databases, APIs, and tools securely.

**What are AI Agents?**
AI agents are tools that can assist, automate, or autonomously perform coding tasks - from simple autocomplete to building entire applications.

---

# ✅ PREREQUISITES

Before installing MCP servers or agents, ensure you have:

## Required
- [ ] **GitHub Account** with Copilot subscription
- [ ] **VS Code** installed (latest version recommended)
- [ ] **GitHub Copilot Extension** installed in VS Code
- [ ] **Node.js** (v18 or later) - for most MCP servers
- [ ] **Git** installed

## Recommended
- [ ] **Docker** - for containerized MCP servers
- [ ] **Python 3.10+** - for Python-based tools
- [ ] **npm/pnpm/yarn** - for JavaScript package management

## Check Your Setup
```bash
# Verify installations
node --version    # Should be v18+
npm --version     # Should be v9+
git --version     # Any recent version
docker --version  # Optional but recommended
python --version  # Should be 3.10+
```

---

# 🔧 GENERAL INSTALLATION METHODS

## Method 1: VS Code Settings (Recommended for Beginners)

1. Open VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Preferences: Open User Settings (JSON)"
4. Add MCP server configurations to your settings

```json
{
  "mcp": {
    "servers": {
      "server-name": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-name"]
      }
    }
  }
}
```

## Method 2: MCP Configuration File

Create a file at `~/.config/mcp/settings.json` (Linux/Mac) or `%APPDATA%\mcp\settings.json` (Windows):

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Method 3: Docker (For Self-Hosted Servers)

```bash
docker run -d \
  --name mcp-server-name \
  -e API_KEY=your-key \
  -p 3000:3000 \
  mcp/server-name:latest
```

## Method 4: VS Code Extensions Marketplace

1. Open VS Code
2. Click Extensions icon (or `Ctrl+Shift+X`)
3. Search for the extension name
4. Click "Install"

---

# 🔌 ALL 50 MCP SERVERS

## Quick Reference Table

| # | Server | Category | Difficulty | Best For |
|---|--------|----------|------------|----------|
| 1 | GitHub | Code/Repos | Easy | Everyone |
| 2 | Context7 | Documentation | Easy | Framework users |
| 3 | Filesystem | Local Files | Easy | Local automation |
| 4 | Playwright | Browser Testing | Medium | Web QA |
| 5 | Puppeteer | Browser Automation | Medium | Frontend devs |
| 6 | PostgreSQL | Database | Medium | Backend devs |
| 7 | Figma | Design | Easy-Medium | UI developers |
| 8 | Notion | Documentation | Easy | Project teams |
| 9 | Slack | Communication | Easy-Medium | Team collaboration |
| 10 | Docker | Containers | Medium | DevOps |
| 11 | Supabase | Database/Auth | Easy | Modern web apps |
| 12 | MongoDB | NoSQL Database | Medium | Real-time apps |
| 13 | Redis | Caching | Medium | High-performance apps |
| 14 | AWS S3 | Storage | Medium | Cloud-native apps |
| 15 | SQLite | Local Database | Easy | Prototyping |
| 16 | Vercel | Deployment | Easy | Next.js developers |
| 17 | Cloudflare | Edge/CDN | Medium | Edge computing |
| 18 | Netlify | Deployment | Easy | Static sites |
| 19 | Terraform | Infrastructure | Medium | DevOps |
| 20 | Kubernetes | Container Orchestration | Medium-Hard | Microservices |
| 21 | Stripe | Payments | Medium | SaaS/e-commerce |
| 22 | Linear | Project Management | Easy | Agile teams |
| 23 | Twilio | SMS/Voice | Medium | Communication apps |
| 24 | SendGrid | Email | Easy-Medium | Email-heavy apps |
| 25 | Discord | Community | Easy-Medium | Gaming/community |
| 26 | Sentry | Error Tracking | Easy-Medium | Production debugging |
| 27 | Datadog | Monitoring | Medium | Enterprise monitoring |
| 28 | Git | Version Control | Easy | Everyone |
| 29 | NPM/Yarn | Package Management | Easy | JS/Node developers |
| 30 | Brave Search | Web Search | Easy | Research |
| 31 | BigQuery | Analytics | Medium | Data analysts |
| 32 | Elasticsearch | Search/Analytics | Medium | Search-heavy apps |
| 33 | Airtable | Data Management | Easy | Project management |
| 34 | GraphQL | API | Medium | GraphQL developers |
| 35 | Prisma | ORM/Database | Medium | TypeScript/Node devs |
| 36 | OpenAPI | REST APIs | Medium | API developers |
| 37 | Google Calendar | Productivity | Easy | Productivity automation |
| 38 | Gmail | Email | Easy-Medium | Email automation |
| 39 | Google Drive | Storage | Easy | Document management |
| 40 | OneDrive | Storage | Easy | Microsoft 365 users |
| 41 | Jira | Project Management | Easy-Medium | Agile teams |
| 42 | Confluence | Documentation | Easy-Medium | Teams using Confluence |
| 43 | Asana | Project Management | Easy | Teams using Asana |
| 44 | Trello | Project Management | Easy | Kanban workflows |
| 45 | Shopify | E-Commerce | Medium | E-commerce developers |
| 46 | Memory | AI Context | Medium | Personalized AI |
| 47 | Time | Utilities | Easy | Time-sensitive apps |
| 48 | Vault | Security | Medium-Hard | Security teams |
| 49 | AWS General | Cloud | Medium | AWS-heavy teams |
| 50 | Raygun | Error Tracking | Easy-Medium | Production monitoring |

---

## Detailed MCP Server Configurations

### 1. GitHub MCP Server ⭐ ESSENTIAL
```json
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
        }
      }
    }
  }
}
```
**Setup:** GitHub → Settings → Developer Settings → Personal Access Tokens → Create with repo, read:user scopes

### 2. Context7 MCP Server ⭐ RECOMMENDED
```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "npx",
        "args": ["-y", "@context7/mcp-server"]
      }
    }
  }
}
```

### 3. Filesystem MCP Server
```json
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
      }
    }
  }
}
```

### 4. Playwright MCP Server
```json
{
  "mcp": {
    "servers": {
      "playwright": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-playwright"]
      }
    }
  }
}
```

### 5. Puppeteer MCP Server
```json
{
  "mcp": {
    "servers": {
      "puppeteer": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-puppeteer"]
      }
    }
  }
}
```

### 6. PostgreSQL MCP Server
```json
{
  "mcp": {
    "servers": {
      "postgres": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {
          "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/db"
        }
      }
    }
  }
}
```

### 7. Figma MCP Server
```json
{
  "mcp": {
    "servers": {
      "figma": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-figma"],
        "env": {
          "FIGMA_ACCESS_TOKEN": "<your-figma-token>"
        }
      }
    }
  }
}
```

### 8. Notion MCP Server
```json
{
  "mcp": {
    "servers": {
      "notion": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-notion"],
        "env": {
          "NOTION_API_KEY": "<your-notion-key>"
        }
      }
    }
  }
}
```

### 9. Slack MCP Server
```json
{
  "mcp": {
    "servers": {
      "slack": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-slack"],
        "env": {
          "SLACK_BOT_TOKEN": "<your-slack-token>"
        }
      }
    }
  }
}
```

### 10. Docker MCP Server
```json
{
  "mcp": {
    "servers": {
      "docker": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-docker"]
      }
    }
  }
}
```

### 11. Supabase MCP Server
```json
{
  "mcp": {
    "servers": {
      "supabase": {
        "command": "npx",
        "args": ["-y", "@supabase/mcp-server"],
        "env": {
          "SUPABASE_URL": "<your-project-url>",
          "SUPABASE_KEY": "<your-anon-key>"
        }
      }
    }
  }
}
```

### 12. MongoDB MCP Server
```json
{
  "mcp": {
    "servers": {
      "mongodb": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-mongodb"],
        "env": {
          "MONGODB_URI": "mongodb://localhost:27017/mydb"
        }
      }
    }
  }
}
```

### 13. Redis MCP Server
```json
{
  "mcp": {
    "servers": {
      "redis": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-redis"],
        "env": {
          "REDIS_URL": "redis://localhost:6379"
        }
      }
    }
  }
}
```

### 14. AWS S3 MCP Server
```json
{
  "mcp": {
    "servers": {
      "s3": {
        "command": "npx",
        "args": ["-y", "@aws/mcp-server-s3"],
        "env": {
          "AWS_ACCESS_KEY_ID": "<your-key>",
          "AWS_SECRET_ACCESS_KEY": "<your-secret>",
          "AWS_REGION": "us-east-1"
        }
      }
    }
  }
}
```

### 15. SQLite MCP Server
```json
{
  "mcp": {
    "servers": {
      "sqlite": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"]
      }
    }
  }
}
```

### 16. Vercel MCP Server
```json
{
  "mcp": {
    "servers": {
      "vercel": {
        "command": "npx",
        "args": ["-y", "@vercel/mcp-server"],
        "env": {
          "VERCEL_TOKEN": "<your-vercel-token>"
        }
      }
    }
  }
}
```

### 17. Cloudflare MCP Server
```json
{
  "mcp": {
    "servers": {
      "cloudflare": {
        "command": "npx",
        "args": ["-y", "@cloudflare/mcp-server"],
        "env": {
          "CLOUDFLARE_API_TOKEN": "<your-cf-token>"
        }
      }
    }
  }
}
```

### 18. Netlify MCP Server
```json
{
  "mcp": {
    "servers": {
      "netlify": {
        "command": "npx",
        "args": ["-y", "@netlify/mcp-server"],
        "env": {
          "NETLIFY_AUTH_TOKEN": "<your-netlify-token>"
        }
      }
    }
  }
}
```

### 19. Terraform MCP Server
```json
{
  "mcp": {
    "servers": {
      "terraform": {
        "command": "npx",
        "args": ["-y", "@hashicorp/mcp-server-terraform"]
      }
    }
  }
}
```

### 20. Kubernetes MCP Server
```json
{
  "mcp": {
    "servers": {
      "kubernetes": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-kubernetes"]
      }
    }
  }
}
```

### 21. Stripe MCP Server
```json
{
  "mcp": {
    "servers": {
      "stripe": {
        "command": "npx",
        "args": ["-y", "@stripe/mcp-server"],
        "env": {
          "STRIPE_SECRET_KEY": "<your-stripe-key>"
        }
      }
    }
  }
}
```

### 22. Linear MCP Server
```json
{
  "mcp": {
    "servers": {
      "linear": {
        "command": "npx",
        "args": ["-y", "@linear/mcp-server"],
        "env": {
          "LINEAR_API_KEY": "<your-linear-key>"
        }
      }
    }
  }
}
```

### 23. Twilio MCP Server
```json
{
  "mcp": {
    "servers": {
      "twilio": {
        "command": "npx",
        "args": ["-y", "@twilio/mcp-server"],
        "env": {
          "TWILIO_ACCOUNT_SID": "<your-sid>",
          "TWILIO_AUTH_TOKEN": "<your-token>"
        }
      }
    }
  }
}
```

### 24. SendGrid MCP Server
```json
{
  "mcp": {
    "servers": {
      "sendgrid": {
        "command": "npx",
        "args": ["-y", "@sendgrid/mcp-server"],
        "env": {
          "SENDGRID_API_KEY": "<your-sendgrid-key>"
        }
      }
    }
  }
}
```

### 25. Discord MCP Server
```json
{
  "mcp": {
    "servers": {
      "discord": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-discord"],
        "env": {
          "DISCORD_BOT_TOKEN": "<your-discord-token>"
        }
      }
    }
  }
}
```

### 26. Sentry MCP Server
```json
{
  "mcp": {
    "servers": {
      "sentry": {
        "command": "npx",
        "args": ["-y", "@sentry/mcp-server"],
        "env": {
          "SENTRY_AUTH_TOKEN": "<your-sentry-token>"
        }
      }
    }
  }
}
```

### 27. Datadog MCP Server
```json
{
  "mcp": {
    "servers": {
      "datadog": {
        "command": "npx",
        "args": ["-y", "@datadog/mcp-server"],
        "env": {
          "DD_API_KEY": "<your-dd-key>",
          "DD_APP_KEY": "<your-app-key>"
        }
      }
    }
  }
}
```

### 28. Git MCP Server
```json
{
  "mcp": {
    "servers": {
      "git": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-git"]
      }
    }
  }
}
```

### 29. NPM/Yarn MCP Server
```json
{
  "mcp": {
    "servers": {
      "npm": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-npm"]
      }
    }
  }
}
```

### 30. Brave Search MCP Server
```json
{
  "mcp": {
    "servers": {
      "brave-search": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-brave-search"],
        "env": {
          "BRAVE_API_KEY": "<your-brave-key>"
        }
      }
    }
  }
}
```

### 31. BigQuery MCP Server
```json
{
  "mcp": {
    "servers": {
      "bigquery": {
        "command": "npx",
        "args": ["-y", "@google-cloud/mcp-server-bigquery"],
        "env": {
          "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/service-account.json"
        }
      }
    }
  }
}
```

### 32. Elasticsearch MCP Server
```json
{
  "mcp": {
    "servers": {
      "elasticsearch": {
        "command": "npx",
        "args": ["-y", "@elastic/mcp-server"],
        "env": {
          "ELASTICSEARCH_URL": "http://localhost:9200"
        }
      }
    }
  }
}
```

### 33. Airtable MCP Server
```json
{
  "mcp": {
    "servers": {
      "airtable": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-airtable"],
        "env": {
          "AIRTABLE_API_KEY": "<your-airtable-key>"
        }
      }
    }
  }
}
```

### 34. GraphQL MCP Server
```json
{
  "mcp": {
    "servers": {
      "graphql": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-graphql"],
        "env": {
          "GRAPHQL_ENDPOINT": "https://api.example.com/graphql"
        }
      }
    }
  }
}
```

### 35. Prisma MCP Server
```json
{
  "mcp": {
    "servers": {
      "prisma": {
        "command": "npx",
        "args": ["-y", "@prisma/mcp-server"],
        "env": {
          "DATABASE_URL": "postgresql://user:pass@localhost:5432/db"
        }
      }
    }
  }
}
```

### 36. OpenAPI MCP Server
```json
{
  "mcp": {
    "servers": {
      "openapi": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-openapi"],
        "env": {
          "OPENAPI_SPEC_URL": "https://api.example.com/openapi.json"
        }
      }
    }
  }
}
```

### 37. Google Calendar MCP Server
```json
{
  "mcp": {
    "servers": {
      "google-calendar": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-google-calendar"],
        "env": {
          "GOOGLE_CLIENT_ID": "<your-client-id>",
          "GOOGLE_CLIENT_SECRET": "<your-client-secret>"
        }
      }
    }
  }
}
```

### 38. Gmail MCP Server
```json
{
  "mcp": {
    "servers": {
      "gmail": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-gmail"],
        "env": {
          "GOOGLE_CLIENT_ID": "<your-client-id>",
          "GOOGLE_CLIENT_SECRET": "<your-client-secret>"
        }
      }
    }
  }
}
```

### 39. Google Drive MCP Server
```json
{
  "mcp": {
    "servers": {
      "google-drive": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-google-drive"],
        "env": {
          "GOOGLE_CLIENT_ID": "<your-client-id>",
          "GOOGLE_CLIENT_SECRET": "<your-client-secret>"
        }
      }
    }
  }
}
```

### 40. OneDrive MCP Server
```json
{
  "mcp": {
    "servers": {
      "onedrive": {
        "command": "npx",
        "args": ["-y", "@microsoft/mcp-server-onedrive"],
        "env": {
          "MICROSOFT_CLIENT_ID": "<your-client-id>",
          "MICROSOFT_CLIENT_SECRET": "<your-client-secret>"
        }
      }
    }
  }
}
```

### 41. Jira MCP Server (Atlassian)
```json
{
  "mcp": {
    "servers": {
      "jira": {
        "command": "npx",
        "args": ["-y", "@atlassian/mcp-server"],
        "env": {
          "ATLASSIAN_EMAIL": "<your-email>",
          "ATLASSIAN_API_TOKEN": "<your-token>",
          "ATLASSIAN_DOMAIN": "your-domain.atlassian.net"
        }
      }
    }
  }
}
```

### 42. Confluence MCP Server (Atlassian)
```json
{
  "mcp": {
    "servers": {
      "confluence": {
        "command": "npx",
        "args": ["-y", "@atlassian/mcp-server"],
        "env": {
          "ATLASSIAN_EMAIL": "<your-email>",
          "ATLASSIAN_API_TOKEN": "<your-token>",
          "ATLASSIAN_DOMAIN": "your-domain.atlassian.net"
        }
      }
    }
  }
}
```

### 43. Asana MCP Server
```json
{
  "mcp": {
    "servers": {
      "asana": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-asana"],
        "env": {
          "ASANA_ACCESS_TOKEN": "<your-asana-token>"
        }
      }
    }
  }
}
```

### 44. Trello MCP Server
```json
{
  "mcp": {
    "servers": {
      "trello": {
        "command": "npx",
        "args": ["-y", "@anthropic/mcp-server-trello"],
        "env": {
          "TRELLO_API_KEY": "<your-trello-key>",
          "TRELLO_TOKEN": "<your-trello-token>"
        }
      }
    }
  }
}
```

### 45. Shopify MCP Server
```json
{
  "mcp": {
    "servers": {
      "shopify": {
        "command": "npx",
        "args": ["-y", "@shopify/mcp-server"],
        "env": {
          "SHOPIFY_STORE_URL": "your-store.myshopify.com",
          "SHOPIFY_ACCESS_TOKEN": "<your-shopify-token>"
        }
      }
    }
  }
}
```

### 46. Memory MCP Server
```json
{
  "mcp": {
    "servers": {
      "memory": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"]
      }
    }
  }
}
```

### 47. Time MCP Server
```json
{
  "mcp": {
    "servers": {
      "time": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-time"]
      }
    }
  }
}
```

### 48. Vault MCP Server (HashiCorp)
```json
{
  "mcp": {
    "servers": {
      "vault": {
        "command": "npx",
        "args": ["-y", "@hashicorp/mcp-server-vault"],
        "env": {
          "VAULT_ADDR": "https://vault.example.com",
          "VAULT_TOKEN": "<your-vault-token>"
        }
      }
    }
  }
}
```

### 49. AWS MCP Server (General)
```json
{
  "mcp": {
    "servers": {
      "aws": {
        "command": "npx",
        "args": ["-y", "@aws/mcp-server"],
        "env": {
          "AWS_ACCESS_KEY_ID": "<your-key>",
          "AWS_SECRET_ACCESS_KEY": "<your-secret>",
          "AWS_REGION": "us-east-1"
        }
      }
    }
  }
}
```

### 50. Raygun MCP Server
```json
{
  "mcp": {
    "servers": {
      "raygun": {
        "command": "npx",
        "args": ["-y", "@raygun/mcp-server"],
        "env": {
          "RAYGUN_API_KEY": "<your-raygun-key>"
        }
      }
    }
  }
}
```

---

# 🤖 ALL 50 AI AGENTS

## Quick Reference Table

| # | Agent | Type | Difficulty | Best For | Cost |
|---|-------|------|------------|----------|------|
| 1 | GitHub Copilot | VS Code Extension | Easy | Everyone | $10-39/mo |
| 2 | GitHub Copilot Chat | VS Code Extension | Easy | Everyone | Included |
| 3 | Copilot Coding Agent | GitHub Feature | Easy | Automation | Included |
| 4 | AI Toolkit | VS Code Extension | Medium | AI apps | Free |
| 5 | Cline | VS Code Extension | Medium | Autonomous coding | Free/Token |
| 6 | Codeium | VS Code Extension | Easy | Free completion | Free |
| 7 | Tabnine | VS Code Extension | Easy-Medium | Enterprise | $12/mo |
| 8 | Continue | VS Code Extension | Medium | Multi-model | Free |
| 9 | GitHub Actions | VS Code Extension | Easy | CI/CD | Free |
| 10 | Error Lens | VS Code Extension | Easy | Everyone | Free |
| 11 | GitLens | VS Code Extension | Easy | Git users | Free |
| 12 | Cursor | Standalone IDE | Easy | AI-first editing | Free tier |
| 13 | Claude Code | CLI Tool | Medium | CLI lovers | Subscription |
| 14 | Roo Code | VS Code Extension | Medium | Custom agents | Free/Token |
| 15 | Aider | CLI Tool | Medium | Open-source | Free |
| 16 | Amazon Q Developer | VS Code Extension | Easy-Medium | AWS ecosystem | Free tier |
| 17 | Gemini Code Assist | VS Code Extension | Easy | Google Cloud | Free tier |
| 18 | Sourcegraph Cody | VS Code Extension | Medium | Large codebases | Free tier |
| 19 | Supermaven | VS Code Extension | Easy | Fast completion | Free tier |
| 20 | Pieces | VS Code Extension | Easy | Snippet management | Free |
| 21 | Replit Agent | Web-based | Easy | Full app building | Subscription |
| 22 | Bolt.new | Web-based | Very Easy | No-setup dev | Free tier |
| 23 | Lovable | Web-based | Very Easy | MVPs | Free tier |
| 24 | v0 by Vercel | Web-based | Very Easy | UI generation | Free tier |
| 25 | Devin | Autonomous | Medium | Full automation | Enterprise |
| 26 | OpenHands | Open-source | Medium-Hard | Self-hosted | Free |
| 27 | Copilot Labs | VS Code Extension | Easy | Experiments | Included |
| 28 | Blackbox AI | VS Code Extension | Easy | Code search | Free |
| 29 | Windsurf | Standalone IDE | Easy | Agentic coding | Free tier |
| 30 | Qodo | VS Code Extension | Medium | Testing/compliance | Free tier |
| 31 | Sweep AI | GitHub Bot | Easy-Medium | PR automation | Free tier |
| 32 | SWE-agent | CLI Tool | Medium-Hard | Autonomous dev | Free |
| 33 | Mutable AI | VS Code Extension | Medium | Refactoring | Subscription |
| 34 | JetBrains AI | JetBrains IDE | Easy | JetBrains users | Subscription |
| 35 | Phind | Web/Extension | Easy | Technical search | Free |
| 36 | CodeGeeX | VS Code Extension | Easy | Multilingual | Free |
| 37 | Bito AI | VS Code Extension | Easy | Productivity | Free tier |
| 38 | Double | VS Code Extension | Medium | Multi-agent | Subscription |
| 39 | Warp AI | Terminal App | Easy | Terminal users | Free tier |
| 40 | Zed AI | Standalone Editor | Easy | Performance | Free |
| 41 | Copilot Workspace | GitHub Feature | Medium | Project planning | Preview |
| 42 | Mentat | CLI Tool | Medium | Open-source | Free |
| 43 | GPT Pilot | CLI Tool | Medium | App building | Free |
| 44 | Snyk Code AI | VS Code Extension | Easy-Medium | Security | Free tier |
| 45 | SonarQube AI | CI Integration | Medium | Code quality | Free tier |
| 46 | Codacy AI | CI Integration | Easy-Medium | Code review | Free tier |
| 47 | Figma AI | Figma Plugin | Easy | Design-to-code | Included |
| 48 | Mintlify Writer | VS Code Extension | Easy | Documentation | Free |
| 49 | ChatGPT | Web/API | Easy | General coding | Free tier |
| 50 | Claude | Web/API | Easy | Complex reasoning | Free tier |

---

## Detailed Agent Installation Instructions

### 1. GitHub Copilot ⭐ ESSENTIAL
**Type:** VS Code Extension | **Cost:** $10-39/month

**What it does:** AI-powered code completion, suggestions, and inline coding assistance.

**Installation:**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search "GitHub Copilot"
4. Click Install
5. Sign in with your GitHub account
6. Ensure you have an active Copilot subscription

---

### 2. GitHub Copilot Chat
**Type:** VS Code Extension | **Cost:** Included with Copilot

**What it does:** Conversational AI for code questions, debugging, and explanations.

**Installation:**
1. Install GitHub Copilot first
2. Search "GitHub Copilot Chat" in Extensions
3. Click Install
4. Access via chat icon in sidebar

---

### 3. GitHub Copilot Coding Agent
**Type:** GitHub Feature | **Cost:** Included with Copilot

**What it does:** Autonomously creates PRs from issue descriptions.

**How to use:**
1. Create an issue in your repository
2. In the issue, assign "Copilot" as the assignee
3. Copilot will analyze the issue and create a PR
4. Review and merge the generated code

---

### 4. Microsoft AI Toolkit Extension Pack
**Type:** VS Code Extension Pack | **Cost:** Free

**What it does:** Build, debug, and deploy multi-agent AI applications.

**Installation:**
1. Search "AI Toolkit" in VS Code Extensions
2. Install "AI Toolkit" by Microsoft
3. Follow the setup wizard
4. Configure your preferred AI models

---

### 5. Cline
**Type:** VS Code Extension | **Cost:** Free (uses your API keys)

**What it does:** Autonomous agent with human-in-the-loop approval for all actions.

**Installation:**
1. Search "Cline" in VS Code Extensions
2. Click Install
3. Open Cline panel
4. Add your API key (OpenAI, Anthropic, etc.)
5. Configure approval settings

---

### 6. Codeium
**Type:** VS Code Extension | **Cost:** Free

**What it does:** Free, privacy-focused AI code completion for 70+ languages.

**Installation:**
1. Search "Codeium" in Extensions
2. Click Install
3. Create free account at codeium.com
4. Sign in within VS Code

---

### 7. Tabnine
**Type:** VS Code Extension | **Cost:** Free tier / $12/month Pro

**What it does:** Enterprise AI assistant with on-premise deployment options.

**Installation:**
1. Search "Tabnine" in Extensions
2. Click Install
3. Create account or connect to enterprise instance
4. Configure privacy settings

---

### 8. Continue
**Type:** VS Code Extension | **Cost:** Free

**What it does:** Use any LLM (GPT-4, Claude, Ollama, local models) in VS Code.

**Installation:**
1. Search "Continue" in Extensions
2. Click Install
3. Create config file: `~/.continue/config.json`
4. Add your model configurations:
```json
{
  "models": [
    {
      "title": "GPT-4",
      "provider": "openai",
      "model": "gpt-4",
      "apiKey": "<your-key>"
    }
  ]
}
```

---

### 9. GitHub Actions Extension
**Type:** VS Code Extension | **Cost:** Free

**What it does:** Manage GitHub Actions workflows from VS Code.

**Installation:**
1. Search "GitHub Actions" in Extensions
2. Click Install
3. Sign in with GitHub

---

### 10. Error Lens
**Type:** VS Code Extension | **Cost:** Free

**What it does:** Displays errors and warnings inline in your code.

**Installation:**
1. Search "Error Lens" in Extensions
2. Click Install
3. Works immediately - no configuration needed

---

### 11. GitLens
**Type:** VS Code Extension | **Cost:** Free / Pro features

**What it does:** Supercharges Git capabilities with blame, history, and more.

**Installation:**
1. Search "GitLens" in Extensions
2. Click Install
3. Configure display preferences in settings

---

### 12. Cursor
**Type:** Standalone IDE | **Cost:** Free tier / $20/month Pro

**What it does:** AI-first IDE forked from VS Code with deep AI integration.

**Installation:**
1. Go to https://cursor.com
2. Download for your OS (Windows/Mac/Linux)
3. Install the application
4. Import your VS Code settings (optional)
5. Sign in and configure AI models

---

### 13. Claude Code
**Type:** CLI Tool | **Cost:** Anthropic subscription

**What it does:** CLI-based AI agent with exceptional code understanding.

**Installation:**
```bash
# Install via npm
npm install -g @anthropic-ai/claude-code

# Authenticate
claude-code auth

# Use in any directory
claude-code "explain this codebase"
```

---

### 14. Roo Code
**Type:** VS Code Extension | **Cost:** Free (uses your API keys)

**What it does:** Multiple AI "personalities" for different coding tasks.

**Installation:**
1. Search "Roo Code" in Extensions
2. Click Install
3. Configure API keys
4. Create custom agent personalities

---

### 15. Aider
**Type:** CLI Tool | **Cost:** Free (uses your API keys)

**What it does:** Open-source CLI agent supporting multiple LLMs.

**Installation:**
```bash
# Install via pip
pip install aider-chat

# Or via pipx (recommended)
pipx install aider-chat

# Configure and run
export OPENAI_API_KEY=<your-key>
aider
```

---

### 16. Amazon Q Developer
**Type:** VS Code Extension | **Cost:** Free tier / Pro

**What it does:** AWS-integrated AI for cloud-native development.

**Installation:**
1. Search "Amazon Q" in Extensions
2. Click Install
3. Sign in with AWS Builder ID or IAM
4. Configure AWS credentials

---

### 17. Gemini Code Assist
**Type:** VS Code Extension | **Cost:** Free tier available

**What it does:** Google's AI coding assistant with massive context window.

**Installation:**
1. Search "Gemini Code Assist" in Extensions
2. Click Install
3. Sign in with Google account
4. Configure for your Google Cloud project (optional)

---

### 18. Sourcegraph Cody
**Type:** VS Code Extension | **Cost:** Free tier / Enterprise

**What it does:** Enterprise code intelligence with deep codebase understanding.

**Installation:**
1. Search "Sourcegraph Cody" in Extensions
2. Click Install
3. Create account at sourcegraph.com
4. Connect your repositories

---

### 19. Supermaven
**Type:** VS Code Extension | **Cost:** Free tier / Pro

**What it does:** Ultra-fast code completion with 1M token context window.

**Installation:**
1. Search "Supermaven" in Extensions
2. Click Install
3. Create account at supermaven.com
4. Sign in within VS Code

---

### 20. Pieces for Developers
**Type:** VS Code Extension + Desktop App | **Cost:** Free

**What it does:** AI-powered code snippet manager with contextual recall.

**Installation:**
1. Download Pieces desktop app from pieces.app
2. Install the desktop application
3. Search "Pieces" in VS Code Extensions
4. Click Install
5. Connect to desktop app

---

### 21. Replit Agent
**Type:** Web-based | **Cost:** Subscription required

**What it does:** Builds complete apps from natural language descriptions.

**Installation:**
1. Go to https://replit.com
2. Create an account
3. Start a new Repl
4. Use Agent feature to describe your app
5. Agent builds frontend + backend + database

---

### 22. Bolt.new
**Type:** Web-based | **Cost:** Free tier available

**What it does:** Browser-based AI that generates and deploys apps instantly.

**Installation:**
1. Go to https://bolt.new
2. Sign in or create account
3. Describe the app you want to build
4. AI generates and deploys automatically

---

### 23. Lovable (formerly GPT Engineer)
**Type:** Web-based | **Cost:** Free tier available

**What it does:** Turns ideas into fully functional web applications.

**Installation:**
1. Go to https://lovable.dev
2. Create an account
3. Describe your application idea
4. AI generates complete React/Vue app

---

### 24. v0 by Vercel
**Type:** Web-based | **Cost:** Free tier available

**What it does:** Generates React/UI components from text or images.

**Installation:**
1. Go to https://v0.dev
2. Sign in with Vercel account
3. Describe UI or upload design image
4. AI generates Tailwind/React components
5. Copy code to your project

---

### 25. Devin
**Type:** Autonomous Agent | **Cost:** Enterprise

**What it does:** Fully autonomous AI software engineer.

**Installation:**
1. Request access at https://cognition-labs.com
2. Enterprise onboarding required
3. Assign tasks via natural language
4. Devin handles entire development lifecycle

---

### 26. OpenHands (formerly OpenDevin)
**Type:** Open-source Self-hosted | **Cost:** Free

**What it does:** Open-source autonomous AI agent for development.

**Installation:**
```bash
# Clone repository
git clone https://github.com/All-Hands-AI/OpenHands.git
cd OpenHands

# Install dependencies
pip install -r requirements.txt

# Configure and run
python main.py
```

---

### 27. GitHub Copilot Labs
**Type:** VS Code Extension | **Cost:** Included with Copilot

**What it does:** Experimental Copilot features like code brushes.

**Installation:**
1. Ensure you have Copilot subscription
2. Search "GitHub Copilot Labs" in Extensions
3. Click Install
4. Access via Copilot Labs panel

---

### 28. Blackbox AI
**Type:** VS Code Extension | **Cost:** Free tier available

**What it does:** AI code autocomplete with code search from millions of repos.

**Installation:**
1. Search "Blackbox AI" in Extensions
2. Click Install
3. Create free account
4. Sign in within VS Code

---

### 29. Windsurf
**Type:** Standalone IDE | **Cost:** Free tier / Pro

**What it does:** AI-first editor with Cascade workflow and autonomous Turbo Mode.

**Installation:**
1. Go to https://windsurf.com
2. Download for your OS
3. Install the application
4. Configure AI models and workflows
5. Create `.windsurfrules` for custom behaviors

---

### 30. Qodo (formerly Codiumate)
**Type:** VS Code Extension | **Cost:** Free tier / Enterprise

**What it does:** Enterprise AI for code integrity, testing, and compliance.

**Installation:**
1. Search "Qodo" in Extensions
2. Click Install
3. Create account at qodo.ai
4. Configure testing and review settings

---

### 31. Sweep AI
**Type:** GitHub Bot | **Cost:** Free tier available

**What it does:** Automates PR workflows and generates code fixes.

**Installation:**
1. Go to https://sweep.dev
2. Install Sweep GitHub App on your repos
3. Create issues with "Sweep:" prefix
4. Sweep automatically creates PRs

---

### 32. SWE-agent
**Type:** CLI Tool | **Cost:** Free (uses your API keys)

**What it does:** Software Engineer agent with goal-oriented execution.

**Installation:**
```bash
# Clone repository
git clone https://github.com/princeton-nlp/SWE-agent.git
cd SWE-agent

# Install dependencies
pip install -r requirements.txt

# Configure API keys
export OPENAI_API_KEY=<your-key>

# Run agent
python run.py
```

---

### 33. Mutable AI
**Type:** VS Code Extension | **Cost:** Subscription

**What it does:** Advanced autocomplete and multi-file AI editing.

**Installation:**
1. Search "Mutable AI" in Extensions
2. Click Install
3. Create account at mutable.ai
4. Sign in and configure

---

### 34. JetBrains AI Assistant
**Type:** JetBrains IDE Plugin | **Cost:** Subscription

**What it does:** Deep AI integration for all JetBrains IDEs.

**Installation:**
1. Open any JetBrains IDE (IntelliJ, PyCharm, etc.)
2. Go to Settings → Plugins
3. Search "AI Assistant"
4. Click Install
5. Sign in with JetBrains account

---

### 35. Phind
**Type:** Web-based + Extension | **Cost:** Free tier available

**What it does:** Search-focused AI for technical questions and code.

**Installation:**
1. Go to https://phind.com for web access
2. Or search "Phind" in VS Code Extensions
3. Click Install
4. Use for technical research and code explanation

---

### 36. CodeGeeX
**Type:** VS Code Extension | **Cost:** Free

**What it does:** Multilingual code generation with strong non-English support.

**Installation:**
1. Search "CodeGeeX" in Extensions
2. Click Install
3. Supports 20+ programming languages
4. Works offline after initial setup

---

### 37. Bito AI
**Type:** VS Code Extension | **Cost:** Free tier available

**What it does:** Smart code completion, bug fixing, and documentation.

**Installation:**
1. Search "Bito" in Extensions
2. Click Install
3. Create account at bito.ai
4. Sign in within VS Code

---

### 38. Double
**Type:** VS Code Extension | **Cost:** Subscription

**What it does:** Multi-agent collaboration for docs, review, and debugging.

**Installation:**
1. Search "Double" in Extensions
2. Click Install
3. Create account and configure agents
4. Set up for your workflow

---

### 39. Warp AI
**Type:** Terminal Application | **Cost:** Free tier available

**What it does:** AI-powered terminal with natural language commands.

**Installation:**
1. Go to https://warp.dev
2. Download for Mac/Linux
3. Install the application
4. Use natural language to run commands

---

### 40. Zed AI
**Type:** Standalone Editor | **Cost:** Free

**What it does:** High-performance code editor with built-in AI.

**Installation:**
1. Go to https://zed.dev
2. Download for your OS
3. Install the application
4. Configure AI assistant settings

---

### 41. GitHub Copilot Workspace
**Type:** GitHub Feature | **Cost:** Preview/Included

**What it does:** AI environment for planning and implementing changes.

**Installation:**
1. Ensure you have Copilot subscription
2. Access via github.com/copilot/workspace
3. Connect your repositories
4. Use for multi-file planning and implementation

---

### 42. Mentat
**Type:** CLI Tool | **Cost:** Free

**What it does:** Open-source AI coding assistant in your terminal.

**Installation:**
```bash
# Install via pip
pip install mentat

# Or via pipx
pipx install mentat

# Configure API key
export OPENAI_API_KEY=<your-key>

# Run in your project
mentat
```

---

### 43. GPT Pilot
**Type:** CLI Tool | **Cost:** Free (uses your API keys)

**What it does:** AI developer that builds apps with human oversight.

**Installation:**
```bash
# Clone repository
git clone https://github.com/Pythagora-io/gpt-pilot.git
cd gpt-pilot

# Install dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
# Add your API key to .env

# Run
python main.py
```

---

### 44. Snyk Code AI
**Type:** VS Code Extension | **Cost:** Free tier available

**What it does:** AI-powered security scanning and vulnerability detection.

**Installation:**
1. Search "Snyk" in Extensions
2. Click Install
3. Create account at snyk.io
4. Connect your repositories
5. Enable real-time scanning

---

### 45. SonarQube AI
**Type:** CI Integration | **Cost:** Free tier available

**What it does:** Code quality analysis with AI-powered suggestions.

**Installation:**
1. Go to https://sonarcloud.io
2. Create account and connect repos
3. Add to your CI pipeline:
```yaml
# GitHub Actions example
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

### 46. Codacy AI
**Type:** CI Integration | **Cost:** Free tier available

**What it does:** Automated code review and quality monitoring.

**Installation:**
1. Go to https://codacy.com
2. Create account
3. Add your repositories
4. Configure quality gates
5. Enable PR comments

---

### 47. Figma AI (Dev Mode)
**Type:** Figma Plugin | **Cost:** Included with Figma

**What it does:** AI features for design-to-code workflows.

**Installation:**
1. Open Figma
2. Enable Dev Mode in your file
3. Use AI features for code generation
4. Export components as code

---

### 48. Mintlify Writer
**Type:** VS Code Extension | **Cost:** Free

**What it does:** AI-powered documentation generation from code.

**Installation:**
1. Search "Mintlify Doc Writer" in Extensions
2. Click Install
3. Highlight code and use command palette
4. Generate docstrings and documentation

---

### 49. ChatGPT
**Type:** Web/API | **Cost:** Free tier / Plus $20/month

**What it does:** General-purpose AI for coding assistance.

**Installation:**
1. Go to https://chat.openai.com
2. Create account
3. Use for code questions and generation
4. Or integrate via API:
```bash
pip install openai
```

---

### 50. Claude
**Type:** Web/API | **Cost:** Free tier / Pro $20/month

**What it does:** Advanced AI with exceptional reasoning for complex code.

**Installation:**
1. Go to https://claude.ai
2. Create account
3. Use for complex code analysis and generation
4. Or integrate via API:
```bash
pip install anthropic
```

---

# 🎯 QUICK START RECOMMENDATIONS

## By Experience Level

### Beginners (Start Here)
1. **GitHub Copilot** - Essential foundation
2. **GitHub Copilot Chat** - Ask questions about code
3. **Error Lens** - See errors instantly
4. **GitLens** - Understand Git history
5. **Context7 MCP** - Get accurate documentation

### Intermediate Developers
Add these to your beginner setup:
1. **Cursor or Windsurf** - AI-first IDE
2. **Cline** - Autonomous coding with control
3. **GitHub MCP** - Full GitHub automation
4. **Filesystem MCP** - Local file operations
5. **Supabase or PostgreSQL MCP** - Database access

### Advanced/Enterprise
Add these for enterprise workflows:
1. **Qodo** - Testing and compliance
2. **Sourcegraph Cody** - Large codebase navigation
3. **Jira/Confluence MCP** - Project management
4. **Sentry MCP** - Error tracking
5. **Vault MCP** - Secrets management

## By Use Case

### Web Development
| Tool | Purpose |
|------|---------|
| GitHub Copilot | Code completion |
| Context7 MCP | Framework docs |
| Figma MCP | Design integration |
| Vercel/Netlify MCP | Deployment |
| Playwright MCP | Testing |

### Backend/API Development
| Tool | Purpose |
|------|---------|
| PostgreSQL/MongoDB MCP | Database |
| OpenAPI/GraphQL MCP | API design |
| Docker MCP | Containers |
| Stripe MCP | Payments |
| Sentry MCP | Monitoring |

### Mobile Development
| Tool | Purpose |
|------|---------|
| GitHub Copilot | Code completion |
| Firebase MCP | Backend services |
| Figma MCP | Design specs |
| Filesystem MCP | Local files |
| Gemini Code Assist | Android support |

### DevOps/Infrastructure
| Tool | Purpose |
|------|---------|
| Terraform MCP | IaC |
| Kubernetes MCP | Container orchestration |
| AWS MCP | Cloud services |
| Docker MCP | Containers |
| Datadog MCP | Monitoring |

---

# 🔧 TROUBLESHOOTING

## Common Issues

### MCP Server Won't Start
```bash
# Check Node.js version
node --version  # Must be v18+

# Clear npm cache
npm cache clean --force

# Reinstall the server
npx -y @modelcontextprotocol/server-name
```

### API Key Issues
- Ensure keys are properly escaped in JSON
- Check for trailing whitespace
- Verify key permissions/scopes
- Test keys independently first

### VS Code Extension Issues
1. Reload VS Code (`Ctrl+Shift+P` → "Reload Window")
2. Check extension output logs
3. Disable/re-enable the extension
4. Clear extension cache

### Performance Issues
- Limit concurrent MCP servers (start with 2-3)
- Use local models when possible
- Close unused extensions
- Increase VS Code memory limit

---

# 📚 RESOURCES

## Official Documentation
- [GitHub Copilot Docs](https://docs.github.com/copilot)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [VS Code AI Documentation](https://code.visualstudio.com/docs/copilot)

## Community Resources
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [MCP Server Directory](https://mcp-server-list.com)
- [MCP Market Leaderboard](https://mcpmarket.com/leaderboards)

## Learning Resources
- [GitHub Copilot Tutorials](https://docs.github.com/copilot/tutorials)
- [MCP Getting Started Guide](https://modelcontextprotocol.io/quickstart)
- [AI Coding Best Practices](https://github.blog/category/ai-ml/)

---

# 📋 COMPLETE MCP CONFIGURATION TEMPLATE

Use this template to configure multiple MCP servers at once:

```json
{
  "mcp": {
    "servers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-github-token>"
        }
      },
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/your/project/path"]
      },
      "context7": {
        "command": "npx",
        "args": ["-y", "@context7/mcp-server"]
      },
      "memory": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"]
      },
      "time": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-time"]
      }
    }
  }
}
```

---

# ✅ CHECKLIST: Getting Started

## Phase 1: Foundation (Day 1)
- [ ] Install VS Code (latest version)
- [ ] Install Node.js v18+
- [ ] Create GitHub account with Copilot subscription
- [ ] Install GitHub Copilot extension
- [ ] Install GitHub Copilot Chat extension
- [ ] Install Error Lens extension
- [ ] Install GitLens extension

## Phase 2: MCP Basics (Week 1)
- [ ] Configure GitHub MCP server
- [ ] Configure Filesystem MCP server
- [ ] Configure Context7 MCP server
- [ ] Test MCP connections in Copilot Chat

## Phase 3: Expand (Week 2+)
- [ ] Add database MCP (Supabase/PostgreSQL/MongoDB)
- [ ] Add deployment MCP (Vercel/Netlify)
- [ ] Try Cursor or Windsurf IDE
- [ ] Explore autonomous agents (Cline, Sweep AI)

## Phase 4: Optimize (Ongoing)
- [ ] Add project management MCP (Linear/Jira)
- [ ] Add monitoring MCP (Sentry/Datadog)
- [ ] Configure custom agent personalities
- [ ] Create project-specific MCP configurations

---

**Document Version:** 1.0  
**Created:** November 2025  
**Maintained by:** GitHub Copilot Community

*This guide is regularly updated. Check the resources section for the latest information.*