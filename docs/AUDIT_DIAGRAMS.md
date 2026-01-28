# URL Audit Feature - Visual Diagrams

This file contains Mermaid diagrams that can be rendered in GitHub, GitLab, or any Mermaid-compatible viewer.

## System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Frontend (Browser)"]
        UI[Audit UI Components]
        CSV[CSV Parser]
        Input[AuditInput]
        Progress[AuditProgress]
        Results[AuditResults]
    end

    subgraph Backend["Backend (Next.js API)"]
        API["/api/audit"]
        Auth[Authentication]
        RateLimit[Rate Limiter]
        AuditEngine[Audit Engine]
        Discovery[Discovery Engine]
    end

    subgraph Database["Database (Supabase)"]
        Sessions[(url_audit_sessions)]
        AuditResults[(url_audit_results)]
    end

    UI --> Input
    UI --> Progress
    UI --> Results
    Input --> CSV
    Input -->|POST| API

    API --> Auth
    Auth --> RateLimit
    RateLimit --> AuditEngine
    RateLimit --> Discovery

    AuditEngine --> Sessions
    AuditEngine --> AuditResults
    Discovery --> AuditEngine
```

## Audit Modes

```mermaid
flowchart LR
    subgraph Batch["Batch Mode"]
        URLs[URL List] --> Validate[Validate URLs]
        Validate --> Process[Process Batch]
    end

    subgraph Domain["Domain Mode"]
        DomainInput[Domain] --> DiscoverRobots[Parse robots.txt]
        DomainInput --> DiscoverSitemap[Parse sitemap.xml]
        DomainInput --> CommonPaths[Test Common Paths]
        DiscoverRobots --> Collect[Collect URLs]
        DiscoverSitemap --> Collect
        CommonPaths --> Collect
        Collect --> Process2[Process Batch]
    end
```

## URL Testing Pipeline

```mermaid
sequenceDiagram
    participant URL as URL
    participant AE as Audit Engine
    participant Target as Target Server

    AE->>Target: HEAD Request
    alt Redirect (3xx)
        Target-->>AE: 301/302 + Location
        Note over AE: Record redirect
        AE->>Target: HEAD Request (new location)
    end
    Target-->>AE: Response Headers

    alt Success (2xx) and HTML
        AE->>Target: GET Request
        Target-->>AE: HTML Content
        Note over AE: Detect JS requirements
        Note over AE: Detect bot protections
    end

    Note over AE: Calculate Score (0-100)
    AE-->>URL: Result Object
```

## Scoring Algorithm

```mermaid
pie title Score Components (100 points total)
    "HTTP Status" : 40
    "No JS Required" : 20
    "HTML Response" : 15
    "No Bot Protection" : 15
    "Short Redirects" : 10
```

## Score Calculation Flow

```mermaid
flowchart TD
    Start[URL Result] --> HTTP{HTTP Status?}

    HTTP -->|200| H40[+40 points]
    HTTP -->|2xx other| H30[+30 points]
    HTTP -->|3xx| H20[+20 points]
    HTTP -->|403/429| H5[+5 points]
    HTTP -->|4xx/5xx| H0[+0 points]

    H40 --> JS{JS Required?}
    H30 --> JS
    H20 --> JS
    H5 --> JS
    H0 --> JS

    JS -->|No| J20[+20 points]
    JS -->|Yes| J0[+0 points]

    J20 --> HTML{Content Type?}
    J0 --> HTML

    HTML -->|text/html| HT15[+15 points]
    HTML -->|Other| HT5[+5 points]
    HTML -->|Unknown| HT0[+0 points]

    HT15 --> BOT{Bot Protection?}
    HT5 --> BOT
    HT0 --> BOT

    BOT -->|None| B15[+15 points]
    BOT -->|1 detected| B5[+5 points]
    BOT -->|2+ detected| B0[+0 points]

    B15 --> RED{Redirects?}
    B5 --> RED
    B0 --> RED

    RED -->|0| R10[+10 points]
    RED -->|1-2| R8[+8 points]
    RED -->|3-4| R4[+4 points]
    RED -->|5+| R0[+0 points]

    R10 --> Total[Total Score]
    R8 --> Total
    R4 --> Total
    R0 --> Total
```

## Recommendation Logic

```mermaid
flowchart TD
    Score[Score Calculated] --> Accessible{Accessible?}

    Accessible -->|No| Blocked[❌ Blocked]
    Accessible -->|Yes| Check85{Score >= 85?}

    Check85 -->|Yes| Best[⭐ Best Entry Point]
    Check85 -->|No| Check70{Score >= 70?}

    Check70 -->|Yes| Good[✅ Good]
    Check70 -->|No| Check50{Score >= 50?}

    Check50 -->|Yes| Moderate[⚠️ Moderate]
    Check50 -->|No| BotCheck{Has Bot Protection?}

    BotCheck -->|Yes| Blocked
    BotCheck -->|No| Challenging[⚡ Challenging]
```

## Domain Discovery Flow

```mermaid
flowchart TB
    Domain[Domain Input] --> Normalize[Normalize Domain]
    Normalize --> CheckRoot[Check Root Accessibility]

    CheckRoot --> Parallel

    subgraph Parallel["Parallel Discovery"]
        Robots[Parse robots.txt]
        Sitemap[Check Standard Sitemaps]
        Common[Test Common Paths]
    end

    Robots -->|Sitemap URLs| ParseSitemaps[Parse Sitemaps]
    Sitemap -->|Found| ParseSitemaps

    ParseSitemaps --> URLs[Discovered URLs]
    Common --> URLs

    URLs --> Dedupe[Deduplicate]
    Dedupe --> Limit[Apply Limit 100 URLs]
    Limit --> Output[Return Discovery Result]
```

## Component Hierarchy

```mermaid
flowchart TB
    subgraph AuditPage["Audit Page (/audit)"]
        Header[Header with Nav]
        DevBanner[Dev Banner]
        MainAudit[Audit Component]
    end

    subgraph AuditComponent["Audit Component"]
        AuditInput[AuditInput]
        AuditProgress[AuditProgress]
        AuditResults[AuditResults]
    end

    MainAudit --> AuditInput
    MainAudit --> AuditProgress
    MainAudit --> AuditResults

    subgraph AuditInputSub["AuditInput"]
        Tabs[Tab Navigation]
        URLTab[Multiple URLs Tab]
        CSVTab[CSV Upload Tab]
        DomainTab[Domain Audit Tab]
    end

    AuditInput --> Tabs
    Tabs --> URLTab
    Tabs --> CSVTab
    Tabs --> DomainTab
```

## Data Model (ER Diagram)

```mermaid
erDiagram
    users ||--o{ url_audit_sessions : creates
    users ||--o{ url_audit_results : owns
    url_audit_sessions ||--|{ url_audit_results : contains

    url_audit_sessions {
        uuid id PK
        uuid user_id FK
        string mode
        string domain
        int total_urls
        int completed_urls
        string status
        string error
        timestamp created_at
        timestamp completed_at
    }

    url_audit_results {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string url
        int status_code
        string final_url
        int scrape_score
        boolean requires_js
        jsonb bot_protections
        jsonb redirects
        boolean accessible
        string recommendation
        string blocked_reason
        string content_type
        int response_time_ms
        timestamp created_at
    }
```

## State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Running: Start Audit

    Running --> Discovering: Domain Mode
    Running --> Testing: Batch Mode

    Discovering --> Testing: URLs Discovered
    Testing --> Scoring: Tests Complete
    Scoring --> Completed: Scores Calculated

    Running --> Error: Request Failed
    Discovering --> Error: Discovery Failed
    Testing --> Error: Tests Failed
    Scoring --> Error: Scoring Failed

    Error --> Idle: Reset
    Completed --> Idle: New Audit
```

## API Request/Response Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as /api/audit
    participant Auth as Auth Check
    participant Rate as Rate Limiter
    participant Engine as Audit Engine
    participant DB as Database

    Client->>API: POST {mode, urls/domain}
    API->>Auth: Check Session

    alt Not Authenticated
        Auth-->>API: 401 Unauthorized
        API-->>Client: Error Response
    else Authenticated
        Auth-->>API: User Object
        API->>Rate: Check Rate Limit

        alt Rate Limited
            Rate-->>API: 429 Too Many Requests
            API-->>Client: Error Response
        else Allowed
            Rate-->>API: OK
            API->>DB: Create Session
            DB-->>API: Session ID
            API->>Engine: Process URLs
            Engine-->>API: Results
            API->>DB: Save Results
            API->>DB: Update Session Status
            API-->>Client: Success Response
        end
    end
```

---

## Usage

These diagrams can be viewed directly on:
- GitHub (native Mermaid support)
- GitLab (native Mermaid support)
- VS Code with Mermaid extension
- [Mermaid Live Editor](https://mermaid.live)

To render locally, you can use:
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i AUDIT_DIAGRAMS.md -o audit_diagrams.pdf
```
